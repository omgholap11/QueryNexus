
from pygooglenews import GoogleNews
import datetime
from app.Utils.session_utils import get_timestamp

def normalize_to_utc(timestamp):
    try:
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    except:
        return str(timestamp)

def fetch_pygoogle_news(category="all"):

    all_articles = []
    
    if category == "india_market":
        gn = GoogleNews(lang='en', country='IN')
        queries = [
            "Sensex OR Nifty 50",
            "Indian Stock Market breaking",
            "RBI Policy OR SEBI news",
            "Tata Motors OR Reliance Industries OR HDFC Bank"
        ]
        
    elif category == "world_market":
        gn = GoogleNews(lang='en', country='US')
        queries = [
            "US Stock Market OR Nasdaq OR S&P 500",
            "Fed Rate Hike OR Powell",
            "Global recession OR Inflation data",
            "Crude Oil Prices"
        ]
    else:
        print(f"Unknown category '{category}'. Skipping.")
        return []

    print(f"\nGoogleNews ({category}): Starting Fetch...")


    for query in queries:
        try:
            print(f"Searching: '{query}'...")
            
            search_results = gn.search(query, when='6h')
           
            entries = search_results.get('entries', [])[:5]
            
            for entry in entries:
                article = parse_rss_entry(entry, tag=category)
                all_articles.append(article)
                
        except Exception as e:
            print(f"Error processing query '{query}': {e}")

    print(f"GoogleNews ({category}): Fetched {len(all_articles)} articles.")
    return all_articles



def parse_rss_entry(entry, tag):
    return {
        "id": entry.get('link'),
        "headline": entry.get('title'),     
        "summary": entry.get('title'),        
        "url": entry.get('link'),
        "source": entry.get('source', {}).get('title', 'Google RSS'),
        "date": normalize_to_utc(entry.get('published')),
        "category": "market-news",
        "tags": [tag] ,
        "timestamp" : get_timestamp()
    }

