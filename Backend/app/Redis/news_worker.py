import time
from app.Redis.redis_service import (
    read_news_from_stream,
    acknowledge_news_message,
    handle_news_pending_dlq,
    setup_news_stream,
    recover_news_pending_on_startup
)
from app.APIs.Services.smart_scrape import smart_scrapper
from app.AI_Engine.v4_ingest_vdb import process_and_store_news

## ─────────────────────────────────────────────────────────────────────────────
##  News Ingestion Worker  (Phase 2 — Redis Streams)
##
##  Replaces: app/Kafka/Workers/consumer.py
##  Continuously reads articles from 'news_ingestion_stream', scrapes full content
##  via Trafilatura (or falls back to summary), chunks, embeds, and indexes into
##  ChromaDB vector store.
##
##  Reliability guarantees:
##    • ACKs only AFTER process_and_store_news() completes successfully.
##    • UnACKed messages stay in PEL and are reclaimed on startup via XAUTOCLAIM.
##    • Permanent failures exceeding NEWS_RETRY_THRESHOLD are routed to DLQ.
## ─────────────────────────────────────────────────────────────────────────────

DLQ_CHECK_INTERVAL = 10   ## Run a DLQ/PEL scan every N processed articles


def process_single_news_article(article_data: dict) -> bool:
    """
    Scrapes full article text, extracts metadata, and stores into ChromaDB vector store.
    Returns True on success (triggers XACK), False on recoverable failure (kept in PEL for retry).
    """
    url = article_data.get('url')
    summary = article_data.get('summary')
    headline = article_data.get('headline')
    date = article_data.get('date')
    source = article_data.get('source')

    if not url:
        print("Article missing URL — cannot process. Skipping...")
        return True   ## Return True to ACK and remove invalid message from stream

    full_article = None
    source_type = "Unknown"

    try:
        scraped_data = smart_scrapper(url)
        if scraped_data:
            print("Successfully scraped full article content.")
            full_article = scraped_data.get('full_article')
            source_type = scraped_data.get('source_type', 'scraped')
    except Exception as scrape_err:
        print(f"Scraping error for URL {url}: {scrape_err}")

    if not full_article:
        if summary:
            print("Scraping failed — using summary fallback.")
            full_article = summary
            source_type = "summary_fallback"
        else:
            print("Both scraping and summary fallback failed — skipping article.")
            return True   ## Return True to ACK since retrying won't fix missing article text

    if full_article and len(full_article) > 80:
        metadata = {
            'url': url,
            'date': date,
            'summary': summary,
            'headline': headline,
            'source': source,
            'source_type': source_type
        }

        try:
            print(f"Indexing article into ChromaDB vector store... | Headline: {headline[:40] if headline else ''}")
            process_and_store_news(full_article, metadata)
            print("Successfully indexed article into ChromaDB.")
            return True
        except Exception as vdb_err:
            print(f"Error while indexing article into ChromaDB: {vdb_err}")
            return False   ## Database/embedding failure — return False to retry via PEL
    else:
        print("Article content too short (<= 80 chars) — skipping vector DB insertion.")
        return True   ## ACK short articles so they don't block the stream


def run_news_ingestion_worker():
    """
    Main loop for news ingestion consumer.
    """
    print("Starting News Ingestion Worker (Redis Streams)...")

    ## 1. Setup stream and consumer group if missing (idempotent)
    setup_news_stream()

    ## 2. Reclaim unACKed messages from any dead consumer on startup
    recover_news_pending_on_startup()

    pending_check_counter = 0

    try:
        while True:
            ## Read one article from stream (blocking read up to 10 seconds)
            message_id, article_data = read_news_from_stream()

            if not message_id or not article_data:
                ## Timeout or empty stream
                continue

            print(f"\nProcessing message ID: {message_id} | Headline: {str(article_data.get('headline'))[:40]}")

            ## Process & index
            success = process_single_news_article(article_data)

            if success:
                acknowledge_news_message(message_id)
                print(f"News message {message_id} successfully ACKed.")
            else:
                print(f"Failed to process news message {message_id}. Leaving in PEL for retry.")

            ## Periodic DLQ scan
            pending_check_counter += 1
            if pending_check_counter >= DLQ_CHECK_INTERVAL:
                print("Running news stream DLQ / PEL scan...")
                handle_news_pending_dlq()
                pending_check_counter = 0

    except KeyboardInterrupt:
        print("\nNews worker stopped by user.")


if __name__ == "__main__":
    run_news_ingestion_worker()
