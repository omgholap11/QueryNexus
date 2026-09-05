from app.Redis.redis_service import (
    retrive_chat_message_from_redis_queue,
    acknowledge_chat_message,
    handle_pending_messages_dlq,
    setup_chat_stream,
    recover_pending_messages_on_startup
)
from app.Config.Database.database import session
from app.Models.chat import ChatMessage , ChatSession
from app.Models.user import UserModel     ## not used directly but required — UserModel is linked to ChatSession via FK relationship
import json
import uuid
import time
from datetime import datetime


## ─────────────────────────────────────────────────────────────────────────────
##  Redis Streams Worker
##  Continuously reads from 'chat_message_stream', persists to PostgreSQL,
##  ACKs on success, leaves message in PEL on failure (auto-retry on next read),
##  and periodically checks the PEL for messages exceeding the retry threshold
##  to route them to the Dead Letter Queue (chat_message_dlq).
## ─────────────────────────────────────────────────────────────────────────────

DLQ_CHECK_INTERVAL = 10   ## Run a DLQ/PEL scan every N read cycles


def save_chat_messages_to_database(message_data) -> bool:
    """
    Persists one chat message to PostgreSQL and updates the session's updated_at.
    Returns True on success, False on failure.
    Worker uses the return value to decide whether to ACK or leave in PEL.
    """
    db = session()   ## background process needs its own local session
    try:
        print(f"Storing message to the Database: {message_data}")

        ## ── Type coercions ──────────────────────────────────────────────────
        ## Controllers serialise session_id via str(uuid) and created_at via
        ## .isoformat() before JSON-dumping — both arrive here as plain strings.
        ## SQLAlchemy / PostgreSQL needs the native Python types or the insert
        ## will raise a DataError and the message will loop in PEL forever.

        session_id_str = message_data.get('session_id')
        created_at_raw = message_data.get('created_at')

        clean_data = {
            'session_id' : uuid.UUID(session_id_str) if session_id_str else None,
            'role'       : message_data.get('role'),
            'content'    : message_data.get('content'),
            'created_at' : (datetime.fromisoformat(created_at_raw)
                            if isinstance(created_at_raw, str)
                            else (created_at_raw or datetime.utcnow())),
        }

        chat_message_model = ChatMessage(**clean_data)   ## ** unpacks dict as keyword args
        db.add(chat_message_model)

        db.query(ChatSession).filter(
            ChatSession.session_id == clean_data['session_id']
        ).update(
            {"updated_at": clean_data['created_at']},
            synchronize_session=False   ## runs UPDATE directly in DB — faster, no Python-side sync
        )

        db.commit()
        return True   ## ← worker will XACK on True

    except Exception as e:
        print(f"Error while storing message to database: {e}")
        db.rollback()
        return False  ## ← worker will NOT ACK — message stays in PEL for retry

    finally:
        db.close()


def run_message_saving_worker():
    """
    Main worker loop.

    Startup sequence:
      1. setup_chat_stream()                — create stream + group if missing (idempotent)
      2. recover_pending_messages_on_startup() — XAUTOCLAIM any unACKed messages from a
                                                  previous crashed worker so they are
                                                  reprocessed immediately (not sent to DLQ)

    Flow per iteration:
      1. XREADGROUP (block=5s) → read one new message
      2. Parse JSON → insert to PostgreSQL
      3. Success  → XACK (removes from PEL) ✅
         Failure  → no ACK (message stays in PEL, redelivered next cycle) ♻️
      4. Every DLQ_CHECK_INTERVAL *processed* messages (not idle timeouts) →
         scan PEL for over-threshold messages → route to DLQ
    """
    ## Initialize stream + consumer group on startup (idempotent — safe to call every time)
    setup_chat_stream()

    ## Reclaim any unACKed messages left behind by a previous crashed worker instance
    recover_pending_messages_on_startup()

    pending_check_counter = 0

    while True:
        try:
            ## ── Read one message from Redis Stream ─────────────────────────────────
            ## Returns (message_id, raw_str) or (None, None) on 5s timeout
            message_id, raw_message_data = retrive_chat_message_from_redis_queue()

            if not message_id or not raw_message_data:
                ## Timeout or empty stream — loop back WITHOUT incrementing DLQ counter
                ## so idle periods don't trigger unnecessary PEL scans
                continue

            ## ── Parse & persist ────────────────────────────────────────────────
            json_message_data = json.loads(raw_message_data)
            print("Message data parsed: ", json_message_data)

            success = save_chat_messages_to_database(json_message_data)

            ## ── ACK only on confirmed DB success ───────────────────────────────
            if success:
                acknowledge_chat_message(message_id)
                print(f"Message {message_id} processed and acknowledged.")
            else:
                ## Do NOT call XACK — message stays in PEL.
                ## Redis will redeliver it on the next XREADGROUP call from this consumer,
                ## or it will be claimed by handle_pending_messages_dlq() if retries exceed threshold.
                print(f"Message {message_id} failed to persist. Leaving in PEL for retry.")

            ## ── Periodic DLQ scan (only on real message cycles, not idle timeouts) ───
            pending_check_counter += 1
            if pending_check_counter >= DLQ_CHECK_INTERVAL:
                print("Running DLQ / PEL check...")
                handle_pending_messages_dlq()
                pending_check_counter = 0

        except Exception as e:
            print(f"Unexpected error in Redis Stream worker: {e}")
            time.sleep(1)   ## brief back-off before retrying the loop


if __name__ == "__main__":
    run_message_saving_worker()