import requests
import os
import sys
import datetime
from dotenv import load_dotenv
from app.Utils.session_utils import get_timestamp

current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '..', '..' ,'.env')
load_dotenv(dotenv_path=env_path)

def normalize_to_utc(timestamp):
    try:
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    except:
        return str(timestamp)

NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")

def get_newsdata_io(category="business", country="in"):
   
    if not NEWSDATA_API_KEY:
        print("Error: NEWSDATA_API_KEY is missing.")
        return []

    print(f"Fetching NewsData.io ({country.upper()} - {category})...")

    url = "https://newsdata.io/api/1/news"
    
    params = {
        'apikey': NEWSDATA_API_KEY,
        'country': country,
        'category': category,
        'language': 'en', 
        # 'full_content' : '1'   ## requires the paid plan 
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 429:
            print("NewsData.io Quota Exceeded (200/day limit hit).")
            return []
            
        response.raise_for_status()
        data = response.json()
        
        results = data.get('results', [])
        print(f"NewsData.io: Found {len(results)} articles.")

        normalized_news = []
        for item in results:
            normalized_news.append({ 
                "headline": item.get('title'),
                "summary": item.get('description'),
                "url": item.get('link'),
                "source": item.get('source_id'),
                "date": normalize_to_utc(item.get('pubDate')), 
                "category": "market-news",
                "timestamp" : get_timestamp
            })
            
            print(len(normalized_news))
        print(normalized_news)
        return normalized_news

    except Exception as e:
        print(f"NewsData.io Error: {e}")
        return []

# get_newsdata_io()