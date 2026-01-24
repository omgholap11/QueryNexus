import feedparser
import datetime
from app.Utils.session_utils import get_timestamp

def normalize_to_utc(timestamp):
    try:
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    except:
        return str(timestamp)

RSS_URLS = {
    "markets": "https://www.livemint.com/rss/markets",
    "companies": "https://www.livemint.com/rss/companies",
    "money": "https://www.livemint.com/rss/money",
    "technology": "https://www.livemint.com/rss/technology"
}

def get_livemint_news(category="markets"):
   
    rss_url = RSS_URLS.get(category, RSS_URLS["markets"])
    print(f"🇮🇳 Fetching LiveMint ({category})...")

    try:
        # Parse the RSS Feed
        feed = feedparser.parse(rss_url)
        
        if not feed.entries:
            print("LiveMint: No entries found (Check connection).")
            return []

        print(f"LiveMint: Found {len(feed.entries)} articles.")
        # print(feed.entries)
        feed.entries.sort(key=lambda x: x.published_parsed if x.published_parsed else tuple(), reverse=True)   ## sorting as per the published dates
        normalized_news = []
        for entry in feed.entries: 
            
            summary_text = entry.get('summary', '') or entry.get('title')
            
            if "<" in summary_text:
                summary_text = entry.get('title')

            normalized_news.append({
                "headline": entry.get('title'),
                "summary": summary_text,
                "url": entry.get('link'),
                "source": "LiveMint",
                "date": normalize_to_utc(entry.get('published')),
                "category": "market-news",
                "timestamp" : get_timestamp()
            })
            
        print(normalized_news)
        print(len(normalized_news))
        return normalized_news

    except Exception as e:
        print(f"LiveMint Error: {e}")
        return []
    
get_livemint_news()
