import finnhub
from dotenv import load_dotenv
import os
from datetime import datetime
import time
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

FINNHUB_API_KEY = os.environ.get('FINNHUB_API_KEY')
MAX_NEWS_AGE_SECONDS = 43200   ## max 12 hour

try:
    finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)
except Exception as e:
    print(f"Error initializing Finnhub client: {e}")


def clean_date(timestamp):
    try:
        timestamp = int(timestamp)
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    except:
        return str(timestamp)


def get_news_finnhub():
    print("Fetching News from the Finnhub: ")

    current_time = int(time.time())
    cutoff_time = current_time - MAX_NEWS_AGE_SECONDS
    try:
        all_news = finnhub_client.general_news('general', min_id=0)
        print(f"News fetched Successfully: {len(all_news)}")

        final_news = []
        skipped_count = 0
        for news in all_news:

            news_ts = news.get('datetime')
            if not news_ts:
                continue 

            # If the news is older than our cutoff, skip it
            if news_ts < cutoff_time:
                skipped_count += 1
                continue

            final_news.append(
                {
                    "category": news['category'],
                    "headline": news['headline'],
                    "date": clean_date(news['datetime']),
                    "source": news['source'],
                    "summary": news['summary'],
                    "url":  news['url']
                }
            )

        print(final_news)
        print(len(final_news))
        return final_news
    except Exception as e:
        print(f"Error while fetching news {e}")
        return []
    
# get_news_finnhub()
# print(clean_date('1768338840'))




