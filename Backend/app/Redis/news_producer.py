import time
from app.APIs.NewsApis.Finnhub import get_news_finnhub
from app.APIs.NewsApis.marketaux import get_marketaux_news
from app.APIs.NewsApis.moneycontrol import get_livemint_news
from app.Redis.redis_service import check_and_cache_to_redis, publish_news_to_stream, setup_news_stream

## ─────────────────────────────────────────────────────────────────────────────
##  News Ingestion Producer  (Phase 2 — Redis Streams)
##
##  Replaces: app/Kafka/Workers/producer.py
##  What changed:
##    • KafkaProducer removed entirely
##    • producer.send('market-news', value=news)  →  publish_news_to_stream(news)
##    • producer.flush()                          →  no-op (XADD is synchronous)
##  What is IDENTICAL:
##    • All three news API calls (Finnhub, Marketaux, Livemint)
##    • Redis URL dedup via check_and_cache_to_redis()
##    • 15-minute polling cycle (900 s sleep)
##    • Per-source try/except so one failing API never stops the others
## ─────────────────────────────────────────────────────────────────────────────

POLL_INTERVAL_SECONDS = 900   ## 15 minutes — same as the Kafka producer


def run_news_producer():
    print("News Producer Service Started (Redis Streams)...")

    ## Create stream + consumer group on startup so the consumer
    ## can connect even before the first article is published.
    setup_news_stream()
    print("News stream ready — beginning fetch cycle.")

    try:
        while True:
            print("\n──────────────────────────────────────────────────")
            print("Collecting news from all sources...")
            all_articles = []
            published_count = 0

            ## ── Source 1: Finnhub ──────────────────────────────────────────
            try:
                finnhub_articles = get_news_finnhub()
                all_articles.extend(finnhub_articles)
                print(f"Finnhub: fetched {len(finnhub_articles)} articles.")
            except Exception as e:
                print(f"Error fetching from Finnhub → {e}")

            ## ── Source 2: Marketaux ────────────────────────────────────────
            try:
                marketaux_articles = get_marketaux_news()
                all_articles.extend(marketaux_articles)
                print(f"Marketaux: fetched {len(marketaux_articles)} articles.")
            except Exception as e:
                print(f"Error fetching from Marketaux → {e}")

            ## ── Source 3: Livemint (MoneyControl RSS) ─────────────────────
            try:
                livemint_articles = get_livemint_news()
                all_articles.extend(livemint_articles)
                print(f"Livemint: fetched {len(livemint_articles)} articles.")
            except Exception as e:
                print(f"Error fetching from Livemint → {e}")

            print(f"Total articles collected this cycle: {len(all_articles)}")

            ## ── Dedup + publish ────────────────────────────────────────────
            for article in all_articles:
                url = article.get('url')

                if not url:
                    continue    ## skip articles with no URL — can't dedup or scrape

                try:
                    ## check_and_cache_to_redis: returns True only if URL is NEW
                    ## (caches the URL hash with a 3-day TTL on first sight)
                    if check_and_cache_to_redis(url):
                        ## XADD replaces kafka_producer.send('market-news', value=article)
                        message_id = publish_news_to_stream(article)
                        if message_id:
                            published_count += 1

                except Exception as e:
                    print(f"Error while deduplicating / publishing article: {e}")

            ## ── Cycle summary ──────────────────────────────────────────────
            if published_count > 0:
                print(f"Published {published_count} new article(s) to news stream this cycle.")
            else:
                print("No new articles found in this cycle.")

            print(f"Sleeping for {POLL_INTERVAL_SECONDS // 60} minutes...")
            time.sleep(POLL_INTERVAL_SECONDS)

    except KeyboardInterrupt:
        print("\nNews producer stopped by user.")


if __name__ == "__main__":
    run_news_producer()

## Run from the project root:
## python -m app.Redis.news_producer
