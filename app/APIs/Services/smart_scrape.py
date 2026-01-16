from app.APIs.Services.scrap_traf import scrape_with_lib
from app.APIs.Services.scrap_api import scrape_with_api

def smart_scrapper(url):
    full_article = None
    source_type = "Unknown"
    if url:
        try:
            full_article = scrape_with_lib(url) 
            source_type = "scraped_locally" 
        except Exception as e:
                print(f"Error while scrapping through Trafilatura -> {e}")

        is_insufficient = full_article is None or len(full_article) < 600
        if is_insufficient:
            try:
                full_article = scrape_with_api(url)   ## if the trafilatura gets failed fetch with the apis 
                source_type = "scraped_proxy"
            except Exception as e:
                print(f"Error while scrapping with scrapper API!! -> {e}")
    
    if full_article:
         return {
              "full_article" : full_article,
              "source_type" : source_type
         }