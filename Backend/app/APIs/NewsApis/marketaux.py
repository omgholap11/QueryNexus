import requests
import os
import datetime
import time
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '..', '..' , '.env')
load_dotenv(dotenv_path=env_path)
MAX_NEWS_AGE_SECONDS = 43200

def normalize_to_utc(timestamp):
    try:
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    except:
        return str(timestamp)
    
    

MARKETAUX_API_TOKEN = os.getenv("MARKETAUX_API_TOKEN")

# print(MARKETAUX_API_TOKEN)

def get_marketaux_news(symbols=None, country="in"):
    if not MARKETAUX_API_TOKEN:
        print("Error: MARKETAUX_API_TOKEN is missing.")
        return []

    print(f"Fetching Marketaux ({country.upper()})...")

    url = "https://api.marketaux.com/v1/news/all"
    
    params = {
        'api_token': MARKETAUX_API_TOKEN,
        'language': 'en',
    }

   
    if symbols:
        params['symbols'] = symbols
    else:
        params['countries'] = country

    

    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 429:
            print("⚠️ Marketaux Quota Exceeded (75/day limit hit).")
            return []
            
        response.raise_for_status()
        data = response.json()
        
        articles = data.get('data', [])
        print(f"Marketaux: Found {len(articles)} articles.")

        normalized_news = []
        for item in articles:
           
            normalized_news.append({
                "headline": item.get('title'),
                "summary": item.get('description'),
                "url": item.get('url'),
                "source": item.get('source'),
                "date": normalize_to_utc(item.get('published_at')),
                "category": "financial",
            })
        print(normalized_news)    
        return normalized_news

    except Exception as e:
        print(f"Marketaux Error: {e}")
        return []

# get_marketaux_news()
