import hashlib
from app.Redis.redis_client import get_redis_client
import json
from redis import RedisError
from langchain_core.messages import HumanMessage , AIMessage

WINDOW_SIZE = 6       
SESSION_TTL = 3600  ## 1 hour

def check_and_cache_to_redis(url):
    if not url:
        return False

    r_client = get_redis_client()
    if r_client is None:
        return True
    
    try:
        hashed_key = hashlib.md5(url.encode('utf-8')).hexdigest()
        redis_key = f"seen:{hashed_key}"

        if r_client.exists(redis_key) == 1:
            print("Duplicate Url so skip these!!")
            return False
        
        print("Unique Url storing to the Redis!!")
        r_client.set(redis_key , "1" , ex=259200)   ## 3 days 

        return True    ## push it to the kafka
    except Exception as e:
        print(f"Error occured duing Redis caching as {e}")
        return True


def save_chat_history_to_redis(session_id: str, role: str, content: str):
       
    key = f"chat: {session_id}"   
    message_data = {
        "role": role,       # "user" or "ai"
        "content": content,
    }
    json_payload = json.dumps(message_data)

    redis_client = get_redis_client()
    if redis_client is None:
        print(f"Failed to save {role} message to {key}: Redis Not Initiated!!")
        return 

    try:   
        pipe = redis_client.pipeline()
         
        pipe.rpush(key, json_payload)       ## pushes from the right side
        pipe.ltrim(key, -WINDOW_SIZE, -1)     ### trims from the left side if exceeds than the windowsize      
        pipe.expire(key, SESSION_TTL)       ## sets the ttl  >>  rolling expiration everytime after the last visiit it gets updates right 
        pipe.execute()                
            
        print(f"Saved {role} message to {key}")
    except RedisError as e:
        print(f"Failed to save {role} message to {key}: {e}")
          

def retrive_chat_history_from_redis(session_id : str):
    if not session_id:
        print("Null ession id recieved!!")
        return []
    
    chat_history = []
    key = f"chat: {session_id}"
    try:
        redis_client = get_redis_client()
        if redis_client is None:
            print(f"Failed to retrive chat history: Redis Not Initiated!!")
            return 
        raw_history = redis_client.lrange(key , 0,-1);
        for chat in raw_history:
            data = json.loads(chat)
            role = data.get('role')
            content = data.get('content')

            if role == 'user':
                chat_history.append(HumanMessage(content=content))
            elif role == 'ai':
                chat_history.append(AIMessage(content=content))
        return chat_history
    except Exception as e:
        print(f"Error occured while saving the message in chat: {e}")
        return []
    

## ─────────────────────────────────────────────────────────────────────────────
##  CHAT MESSAGE QUEUE  ——  Redis Streams
##  Migration: RPUSH / BLPOP  →  XADD / XREADGROUP / XACK  + Dead Letter Queue
##
##  Why Redis Streams over Redis List:
##    • ACK-based delivery  : message survives a worker crash (lives in PEL until ACKed)
##    • Retry tracking      : Redis tracks delivery_count per message automatically
##    • Dead Letter Queue   : messages exceeding RETRY_THRESHOLD move to a DLQ stream
##    • Bounded RAM         : MAXLEN cap prevents unbounded memory growth
## ─────────────────────────────────────────────────────────────────────────────

CHAT_STREAM_NAME    = "chat_message_stream"   ## Main ingestion stream
CHAT_CONSUMER_GROUP = "chat_workers"          ## Consumer group name
CHAT_CONSUMER_NAME  = "chat_worker_1"         ## Worker instance name
CHAT_DLQ_STREAM     = "chat_message_dlq"      ## Dead Letter Queue stream
CHAT_STREAM_MAXLEN  = 10000                   ## Max entries in stream (RAM safety cap)
RETRY_THRESHOLD     = 5                       ## Max delivery attempts before DLQ


def setup_chat_stream():
    """
    One-time init: creates the Redis Stream and Consumer Group if they do not
    already exist. Safe to call on every worker startup — BUSYGROUP error is
    silently ignored (group already exists).
    """
    r_client = get_redis_client()
    if r_client is None:
        print("Redis not available — cannot set up chat stream!")
        return
    try:
        ## id="0"     : consumer group reads from the very beginning of the stream
        ## mkstream=True : creates the stream automatically if it doesn't exist yet
        r_client.xgroup_create(CHAT_STREAM_NAME, CHAT_CONSUMER_GROUP, id="0", mkstream=True)
        print(f"Stream '{CHAT_STREAM_NAME}' and consumer group '{CHAT_CONSUMER_GROUP}' ready.")
    except Exception as e:
        if "BUSYGROUP" in str(e):
            print(f"Consumer group '{CHAT_CONSUMER_GROUP}' already exists. Skipping creation.")
        else:
            print(f"Error during stream setup: {e}")


def recover_pending_messages_on_startup():
    """
    STARTUP RECOVERY — Reclaims messages that were delivered to a (now-dead)
    consumer but never ACKed (still sitting in the Pending Entries List / PEL).

    Uses XAUTOCLAIM with min_idle_time=0 to immediately re-deliver ALL pending
    messages to the current consumer (CHAT_CONSUMER_NAME), regardless of how
    long they have been idle.

    This closes the crash-recovery gap: without this, messages read with ">"
    but never ACKed would only surface in the DLQ scanner after RETRY_THRESHOLD
    failures — instead they are retried immediately on the next worker start.

    Call once at startup, AFTER setup_chat_stream().
    """
    r_client = get_redis_client()
    if r_client is None:
        return

    try:
        ## min_idle_time=0  → claim ALL pending messages immediately (no idle wait required)
        ## start_id="0-0"   → scan from the very beginning of the PEL
        ## count=100         → safe batch size for typical queue depths
        result = r_client.xautoclaim(
            name=CHAT_STREAM_NAME,
            groupname=CHAT_CONSUMER_GROUP,
            consumername=CHAT_CONSUMER_NAME,
            min_idle_time=0,
            start_id="0-0",
            count=100
        )
        ## result: (next_start_id, [(msg_id, {fields}), ...], [deleted_ids])
        claimed_messages = result[1]
        if claimed_messages:
            print(f"Startup recovery: Reclaimed {len(claimed_messages)} unACKed "
                  f"message(s) from PEL — they will be reprocessed this cycle.")
        else:
            print("Startup recovery: PEL is clean — no pending messages to reclaim.")
    except Exception as e:
        print(f"Error during startup PEL recovery (XAUTOCLAIM): {e}")


def save_chat_message_to_redis_queue(message_data):
    """
    PRODUCER — Pushes one chat message into the Redis Stream.

    Function signature is IDENTICAL to the old Redis List version so
    Controllers/chat.py requires ZERO changes.

    Old: redis_client.rpush("chat_message_queue", message_data)
    New: redis_client.xadd(CHAT_STREAM_NAME, {"data": message_data}, maxlen=...)
    """
    if not message_data:
        print("Empty data received to push into the Redis Stream! Skipping...")
        return

    print(f"Inserting the data into the Redis Stream...")
    try:
        redis_client = get_redis_client()
        if redis_client is None:
            print("Failed to save chat message: Redis Not Initiated!!")
            return

        ## approximate=True uses "~" trimming — slightly faster, still RAM-bounded
        message_id = redis_client.xadd(
            CHAT_STREAM_NAME,
            {"data": message_data},
            maxlen=CHAT_STREAM_MAXLEN,
            approximate=True
        )
        print(f"Chat message saved to Redis Stream with ID: {message_id}")
        return message_id

    except Exception as e:
        print(f"Error while saving chat message to Redis Stream! {e}")
        return None


def retrive_chat_message_from_redis_queue():
    """
    CONSUMER — Reads one undelivered message via XREADGROUP.
    Returns (message_id, raw_data) tuple.

    • message_id is passed back to the worker for XACK after successful DB insert.
    • block=5000 (5 s) : worker wakes every 5 s even if queue is empty,
      allowing periodic DLQ checks between reads.

    Old return: raw_message_data  (str)
    New return: (message_id, raw_message_data)  — redis_worker.py updated accordingly
    """
    try:
        redis_client = get_redis_client()
        if redis_client is None:
            print("Failed to retrieve chat message: Redis Not Initiated!!")
            return None, None

        ## ">" = only NEW messages not yet delivered to any consumer in this group
        messages = redis_client.xreadgroup(
            groupname=CHAT_CONSUMER_GROUP,
            consumername=CHAT_CONSUMER_NAME,
            streams={CHAT_STREAM_NAME: ">"},
            count=1,
            block=5000   ## 5-second blocking read; returns None on timeout (enables DLQ polling)
        )

        if not messages:
            return None, None

        ## messages: [("stream_name", [("message_id", {"data": "..."})])]
        _stream_name, message_list = messages[0]
        message_id, message_fields = message_list[0]
        raw_message_data = message_fields.get("data")

        print(f"Retrieved message from Redis Stream: ID={message_id}")
        return message_id, raw_message_data

    except Exception as e:
        print(f"Error while retrieving message from Redis Stream! {e}")
        return None, None


def acknowledge_chat_message(message_id):
    """
    ACK — Marks a successfully processed message as done.
    Removes it from the Pending Entries List (PEL).
    ONLY call this AFTER the PostgreSQL insert succeeds.
    """
    try:
        redis_client = get_redis_client()
        if redis_client is None:
            return
        redis_client.xack(CHAT_STREAM_NAME, CHAT_CONSUMER_GROUP, message_id)
        print(f"Message {message_id} acknowledged and removed from PEL.")
    except Exception as e:
        print(f"Error while acknowledging message {message_id}: {e}")


def handle_pending_messages_dlq():
    """
    DLQ CHECK — Scans the Pending Entries List (PEL) for messages that have been
    delivered more than RETRY_THRESHOLD times without a successful ACK.

    Those messages are:
      1. Copied to the Dead Letter Queue stream (chat_message_dlq) for inspection.
      2. ACKed on the main stream so they stop blocking the PEL.

    Called periodically by the worker (every N read cycles).
    """
    try:
        redis_client = get_redis_client()
        if redis_client is None:
            return

        pending_messages = redis_client.xpending_range(
            CHAT_STREAM_NAME,
            CHAT_CONSUMER_GROUP,
            min="-",
            max="+",
            count=100
        )

        if not pending_messages:
            return

        for pending in pending_messages:
            message_id     = pending["message_id"]
            delivery_count = pending["times_delivered"]
            idle_time_ms   = pending.get("idle", 0)

            if delivery_count > RETRY_THRESHOLD:
                print(f"Message {message_id} exceeded retry threshold "
                      f"({delivery_count} attempts). Moving to DLQ...")

                ## Fetch original payload from the stream
                original = redis_client.xrange(CHAT_STREAM_NAME, min=message_id, max=message_id)

                dlq_write_ok = False
                if original:
                    _msg_id, fields = original[0]
                    try:
                        ## Push to Dead Letter Queue for manual inspection / alerting
                        redis_client.xadd(
                            CHAT_DLQ_STREAM,
                            {
                                "data"                : fields.get("data", ""),
                                "original_message_id" : str(message_id),
                                "delivery_count"      : str(delivery_count),
                                "reason"              : "max_retries_exceeded"
                            }
                        )
                        dlq_write_ok = True
                    except Exception as dlq_err:
                        ## DLQ write failed — do NOT ACK the main stream.
                        ## Message stays in PEL; operator must investigate Redis.
                        print(f"CRITICAL: Failed to write message {message_id} to DLQ: {dlq_err}. "
                              f"NOT ACKing — message remains in PEL.")
                else:
                    ## Original message no longer exists in the stream (already trimmed by MAXLEN).
                    ## Nothing to archive in the DLQ — safe to ACK so the PEL entry is cleared.
                    print(f"Message {message_id} no longer in stream (trimmed by MAXLEN). "
                          f"ACKing to clear stale PEL entry.")
                    dlq_write_ok = True

                ## ACK ONLY after confirming DLQ write succeeded (or message was already gone)
                if dlq_write_ok:
                    redis_client.xack(CHAT_STREAM_NAME, CHAT_CONSUMER_GROUP, message_id)
                    print(f"Message {message_id} moved to DLQ '{CHAT_DLQ_STREAM}' and ACKed.")
            else:
                ## Message is below retry threshold — check if idle for more than 10 seconds to reclaim for retry
                if idle_time_ms >= 10000:
                    print(f"Message {message_id} idle for {idle_time_ms} ms (attempt {delivery_count}/{RETRY_THRESHOLD}). Reclaiming for retry...")
                    try:
                        redis_client.xautoclaim(
                            name=CHAT_STREAM_NAME,
                            groupname=CHAT_CONSUMER_GROUP,
                            consumername=CHAT_CONSUMER_NAME,
                            min_idle_time=10000,
                            start_id=message_id,
                            count=1
                        )
                    except Exception as claim_err:
                        print(f"Error while reclaiming idle chat message {message_id}: {claim_err}")

    except Exception as e:
        print(f"Error during DLQ / PEL scan: {e}")


## ─────────────────────────────────────────────────────────────────────────────
##  NEWS INGESTION QUEUE  ——  Redis Streams  (Phase 2)
##  Migration: Kafka topic `market-news`  →  Redis Stream `news_ingestion_stream`
##
##  Same ACK + PEL + DLQ guarantees as the chat stream (Phase 1).
##  RETRY_THRESHOLD is 3 (not 5) because scraping failures are usually
##  permanent (paywalled / dead URL) — no point retrying 5 times.
## ─────────────────────────────────────────────────────────────────────────────

NEWS_STREAM_NAME    = "news_ingestion_stream"   ## Main news ingestion stream
NEWS_CONSUMER_GROUP = "news_workers"            ## Consumer group name
NEWS_CONSUMER_NAME  = "news_worker_1"           ## Worker instance name
NEWS_DLQ_STREAM     = "news_ingestion_dlq"      ## Dead Letter Queue for failed articles
NEWS_STREAM_MAXLEN  = 5000                      ## Max entries (news cycles are bounded)
NEWS_RETRY_THRESHOLD = 3                        ## Fewer retries — scrape failures are usually permanent


def setup_news_stream():
    """
    One-time init: creates the news Redis Stream and Consumer Group if they do
    not already exist. Safe to call on every worker startup — BUSYGROUP is
    silently ignored.
    """
    r_client = get_redis_client()
    if r_client is None:
        print("Redis not available — cannot set up news stream!")
        return
    try:
        r_client.xgroup_create(NEWS_STREAM_NAME, NEWS_CONSUMER_GROUP, id="0", mkstream=True)
        print(f"Stream '{NEWS_STREAM_NAME}' and consumer group '{NEWS_CONSUMER_GROUP}' ready.")
    except Exception as e:
        if "BUSYGROUP" in str(e):
            print(f"Consumer group '{NEWS_CONSUMER_GROUP}' already exists. Skipping creation.")
        else:
            print(f"Error during news stream setup: {e}")


def recover_news_pending_on_startup():
    """
    STARTUP RECOVERY — Uses XAUTOCLAIM to reclaim any articles that were
    delivered to a (now-dead) consumer but never ACKed.

    Mirrors recover_pending_messages_on_startup() from Phase 1.
    Call once at startup, AFTER setup_news_stream().
    """
    r_client = get_redis_client()
    if r_client is None:
        return
    try:
        result = r_client.xautoclaim(
            name=NEWS_STREAM_NAME,
            groupname=NEWS_CONSUMER_GROUP,
            consumername=NEWS_CONSUMER_NAME,
            min_idle_time=0,    ## claim ALL pending messages immediately
            start_id="0-0",
            count=100
        )
        claimed_messages = result[1]
        if claimed_messages:
            print(f"News startup recovery: Reclaimed {len(claimed_messages)} unACKed "
                  f"article(s) from PEL — they will be reprocessed this cycle.")
        else:
            print("News startup recovery: PEL is clean — no pending articles to reclaim.")
    except Exception as e:
        print(f"Error during news startup PEL recovery (XAUTOCLAIM): {e}")


def publish_news_to_stream(article_data: dict):
    """
    PRODUCER — Publishes one news article dict into the Redis Stream.

    Replaces: kafka_producer.send('market-news', value=article_data)
    The article_data dict is JSON-serialised into a single 'data' field so
    the stream entry stays a flat key-value map (Redis Streams requirement).

    Returns the stream message_id on success, None on failure.
    """
    if not article_data:
        print("Empty article data — skipping publish.")
        return None

    try:
        r_client = get_redis_client()
        if r_client is None:
            print("Failed to publish news article: Redis Not Initiated!!")
            return None

        ## Serialise the whole dict as JSON into the 'data' field
        message_id = r_client.xadd(
            NEWS_STREAM_NAME,
            {"data": json.dumps(article_data)},
            maxlen=NEWS_STREAM_MAXLEN,
            approximate=True    ## "~" trimming — slightly faster, still RAM-bounded
        )
        print(f"Article published to news stream: ID={message_id} | "
              f"headline={str(article_data.get('headline', ''))[:40]}")
        return message_id

    except Exception as e:
        print(f"Error while publishing news article to Redis Stream: {e}")
        return None


def read_news_from_stream():
    """
    CONSUMER — Reads one undelivered news article via XREADGROUP.
    Returns (message_id, article_dict) or (None, None) on timeout.

    • block=10000 (10 s): longer than the chat worker since news ingestion
      is bursty — a 10-second wait avoids hammering Redis between cycles.
    • message_id is returned so the caller can XACK after successful processing.

    Replaces: the `for message in KafkaConsumer(...)` loop.
    """
    try:
        r_client = get_redis_client()
        if r_client is None:
            print("Failed to read from news stream: Redis Not Initiated!!")
            return None, None

        messages = r_client.xreadgroup(
            groupname=NEWS_CONSUMER_GROUP,
            consumername=NEWS_CONSUMER_NAME,
            streams={NEWS_STREAM_NAME: ">"},    ## ">" = only new, undelivered messages
            count=1,
            block=10000    ## 10-second blocking read
        )

        if not messages:
            return None, None

        ## messages: [("stream_name", [("message_id", {"data": "{...json...}"})])]
        _stream_name, message_list = messages[0]
        message_id, message_fields = message_list[0]
        raw_data = message_fields.get("data")

        if not raw_data:
            return message_id, None    ## malformed entry — caller should ACK and skip

        article_data = json.loads(raw_data)
        print(f"News article read from stream: ID={message_id} | "
              f"headline={str(article_data.get('headline', ''))[:40]}")
        return message_id, article_data

    except Exception as e:
        print(f"Error while reading from news stream: {e}")
        return None, None


def acknowledge_news_message(message_id):
    """
    ACK — Marks a successfully processed news article as done.
    Removes it from the PEL.
    ONLY call this AFTER process_and_store_news() completes without error.
    """
    try:
        r_client = get_redis_client()
        if r_client is None:
            return
        r_client.xack(NEWS_STREAM_NAME, NEWS_CONSUMER_GROUP, message_id)
        print(f"News message {message_id} acknowledged and removed from PEL.")
    except Exception as e:
        print(f"Error while acknowledging news message {message_id}: {e}")


def handle_news_pending_dlq():
    """
    DLQ CHECK — Scans the news stream PEL for articles that have been delivered
    more than NEWS_RETRY_THRESHOLD times without a successful ACK.

    Those articles are moved to `news_ingestion_dlq` for manual inspection,
    then ACKed on the main stream — same guarded pattern as Phase 1.

    Called periodically by the news consumer worker.
    """
    try:
        r_client = get_redis_client()
        if r_client is None:
            return

        pending_messages = r_client.xpending_range(
            NEWS_STREAM_NAME,
            NEWS_CONSUMER_GROUP,
            min="-",
            max="+",
            count=100
        )

        if not pending_messages:
            return

        for pending in pending_messages:
            message_id     = pending["message_id"]
            delivery_count = pending["times_delivered"]
            idle_time_ms   = pending.get("idle", 0)

            if delivery_count > NEWS_RETRY_THRESHOLD:
                print(f"News article {message_id} exceeded retry threshold "
                      f"({delivery_count} attempts). Moving to DLQ...")

                original = r_client.xrange(NEWS_STREAM_NAME, min=message_id, max=message_id)

                dlq_write_ok = False
                if original:
                    _msg_id, fields = original[0]
                    try:
                        r_client.xadd(
                            NEWS_DLQ_STREAM,
                            {
                                "data"                : fields.get("data", ""),
                                "original_message_id" : str(message_id),
                                "delivery_count"      : str(delivery_count),
                                "reason"              : "max_retries_exceeded"
                            }
                        )
                        dlq_write_ok = True
                    except Exception as dlq_err:
                        print(f"CRITICAL: Failed to write news article {message_id} to DLQ: {dlq_err}. "
                              f"NOT ACKing — message remains in PEL.")
                else:
                    ## Original entry already trimmed by MAXLEN — clear the stale PEL entry
                    print(f"News article {message_id} no longer in stream (trimmed by MAXLEN). "
                          f"ACKing to clear stale PEL entry.")
                    dlq_write_ok = True

                if dlq_write_ok:
                    r_client.xack(NEWS_STREAM_NAME, NEWS_CONSUMER_GROUP, message_id)
                    print(f"News article {message_id} moved to DLQ '{NEWS_DLQ_STREAM}' and ACKed.")
            else:
                ## Article is below retry threshold — check if idle for more than 10 seconds to reclaim for retry
                if idle_time_ms >= 10000:
                    print(f"News article {message_id} idle for {idle_time_ms} ms (attempt {delivery_count}/{NEWS_RETRY_THRESHOLD}). Reclaiming for retry...")
                    try:
                        r_client.xautoclaim(
                            name=NEWS_STREAM_NAME,
                            groupname=NEWS_CONSUMER_GROUP,
                            consumername=NEWS_CONSUMER_NAME,
                            min_idle_time=10000,
                            start_id=message_id,
                            count=1
                        )
                    except Exception as claim_err:
                        print(f"Error while reclaiming idle news article {message_id}: {claim_err}")

    except Exception as e:
        print(f"Error during news DLQ / PEL scan: {e}")
