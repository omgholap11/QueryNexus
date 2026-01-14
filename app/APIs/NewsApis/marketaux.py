import requests
import os
import datetime
from dotenv import load_dotenv

load_dotenv()


def normalize_to_utc(timestamp):
    try:
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    except:
        return str(timestamp)
    
    

MARKETAUX_API_TOKEN = os.getenv("MARKETAUX_API_TOKEN")

# print(MARKETAUX_API_TOKEN)

def get_marketaux_news(symbols=None, country="in", limit=3):
    if not MARKETAUX_API_TOKEN:
        print("Error: MARKETAUX_API_TOKEN is missing.")
        return []

    print(f"Fetching Marketaux ({country.upper()})...")

    url = "https://api.marketaux.com/v1/news/all"
    
    params = {
        'api_token': MARKETAUX_API_TOKEN,
        'language': 'en',
        'limit': limit,
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
            sentiment = item.get('entities', [{}])[0].get('sentiment_score', 0)
            tags = [e.get('symbol') for e in item.get('entities', []) if e.get('symbol')]
            normalized_news.append({
                "id": item.get('uuid'), # Unique UUID
                "headline": item.get('title'),
                "summary": item.get('description'),
                "url": item.get('url'),
                "source": item.get('source'),
                "date": normalize_to_utc(item.get('published_at')),
                "category": "financial",
                # We store sentiment score in metadata/tags for the AI
                "tags": tags,
                "sentiment_score": sentiment 
            })
            
        return normalized_news

    except Exception as e:
        print(f"Marketaux Error: {e}")
        return []
