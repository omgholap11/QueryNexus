
import requests
import os
import trafilatura
from requests.exceptions import RequestException
from dotenv import load_dotenv
load_dotenv()

SCRAPERAPI_KEY = os.getenv('SCRAPERAPI_KEY')

def scrape_with_proxy(url):

    if not SCRAPERAPI_KEY:
        print("Error: SCRAPERAPI_KEY is missing from environment.")
        return None

    print(f"Proxy Scraping: {url}...")
    payload = {
        'api_key': SCRAPERAPI_KEY,
        'url': url,
        # 'render': 'true', # Uncomment if you need to scrape JS-heavy sites (Costs 5 credits!)
        'keep_headers': 'true', # Good practice to pass genuine headers
    }

    try:
        response = requests.get(
            'http://api.scraperapi.com', 
            params=payload, 
            timeout=60
        )

        if response.status_code != 200:
            print(f"ScraperAPI Failed: Status {response.status_code} | Reason: {response.text[:100]}")
            return None

        raw_html = response.text
        if not raw_html or len(raw_html) < 100:
            print(f"Warning: ScraperAPI returned empty/short content for: {url}")
            return None

        clean_text = trafilatura.extract(
            raw_html,
            include_comments=False,
            deduplicate=True,
            include_tables=False # Set to True if you need data tables
        )

        if clean_text and len(clean_text) > 200:
            print(f"Success! Extracted {len(clean_text)} chars.")
            return clean_text
        else:
            print(f"Trafilatura Warning: Could not extract meaningful text from {url}")
            return None

    except RequestException as e:
        print(f"Network Error (ScraperAPI): {e}")
        return None

    except Exception as e:
        print(f"Unexpected Scraper Error: {e}")
        return None
    
# print(scrape_with_proxy('https://jsonviewer.stack.hu/'))  