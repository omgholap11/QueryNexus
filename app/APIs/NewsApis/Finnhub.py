import finnhub
from dotenv import load_dotenv
import os

load_dotenv()
FINNHUB_API_KEY = os.environ.get('FINNHUB_API_KEY')

try:
    finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)
except Exception as e:
    print(f"Error initializing Finnhub client: {e}")


def get_news_finnhub():
    print("Fetching News from the Finnhub: ")
    try:
        news = finnhub_client.general_news('general', min_id=0)
        print(f"News fetched Successfully: {len(news)}")
        return news
    except Exception as e:
        print(f"Error while fetching news {e}")
        return []







