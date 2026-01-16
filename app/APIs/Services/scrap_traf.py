import requests
import trafilatura

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/"
}

def scrape_with_lib(url):
    print(f"\n{'='*60}")
    print(f"TESTING: {url}")
    
    try:
       
        print("Downloading with Fake ID...", end=" ")
        
        response = requests.get(url, headers=HEADERS, timeout=10)
        
        if response.status_code in [403, 401]:            ## 
            print(f"⚠️ Skipped (Protected Content): {url}")
            return None
        
        print(f"Success ")

        clean_text = trafilatura.extract(response.text, include_comments=False)

        if clean_text:
            print("Done!")
            print(f"\n--- [ PREVIEW ] ---\n{clean_text[:100]}...\n")
            return clean_text
        else:
            print("Download worked, but Trafilatura found no text (Site might be JS-only).")
            return None

    except Exception as e:
        print(f"FAILED: {e}")
        return None

