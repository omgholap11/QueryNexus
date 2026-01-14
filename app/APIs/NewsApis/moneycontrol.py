import feedparser
import datetime

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
            print("⚠️ LiveMint: No entries found (Check connection).")
            return []

        print(f"✅ LiveMint: Found {len(feed.entries)} articles.")
        
        normalized_news = []
        for entry in feed.entries[:10]: # Limit to 10 latest
            
            summary_text = entry.get('summary', '') or entry.get('title')
            
            if "<" in summary_text:
                summary_text = entry.get('title')

            normalized_news.append({
                "id": entry.get('guid', entry.get('link')),
                "headline": entry.get('title'),
                "summary": summary_text,
                "url": entry.get('link'),
                "source": "LiveMint",
                "date": normalize_to_utc(entry.get('published')),
                "category": "market-news",
                "tags": ["Indian Market", "LiveMint"]
            })
            
        return normalized_news

    except Exception as e:
        print(f"❌ LiveMint Error: {e}")
        return []
