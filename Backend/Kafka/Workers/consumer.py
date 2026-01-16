import json
from kafka import KafkaConsumer
from app.APIs.Services.smart_scrape import smart_scrapper
from app.AI_Engine.pipeline import process_and_store_news

def get_consumer():
    consumer = KafkaConsumer(
        "market-news" ,    ## subscribing to the topic right 
        bootstrap_servers=['localhost:9092'],    ## kafka runnning port 
        group_id='velo-worker-group',
        auto_offset_reset='earliest',    ## like the from beggining true
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))  ## convertc the incominng bytes to the python dictionary
    )

    return consumer

def start_consumer():
    print("Consumer Connecting.....")
    consumer = get_consumer()
    print("Consumer Connected!!")

    try:
        for message in consumer:
            data = message.value
            print(
                f" GROUP[velo-worker-group] : "
                f"TOPIC[{message.topic}] : "
                f"PART:{message.partition} : "
                f"id: {data.get('id')} | Headline: {data.get('headline')[:30]}"
            )

            url = data.get('url')   ## obtained the url now scrap the content present on the url right  
            summary = data.get('summary')
            headline = data.get('headline')
            date = data.get('date')
            source = data.get('source')

            full_article = None
            source_type = "Unkown"
            
            scraped_data = smart_scrapper(url)

            if scraped_data:
                print("Recieved Complete Data for news!!")
                full_article = scraped_data.get('full_article')
                source_type = scraped_data.get('source_type')
           
            if full_article is None:
                if summary:
                    print("Scrapping failed continue with summary fallback!!")
                    full_article = summary
                    source_type = "summary_fallback"
                else:
                    print("Scrapping and summary fallback both failed so skip!!")
                    continue
    
            print(full_article[:100])

            metadata = {
                'url' : url,
                'date' : date,
                'summary' : summary,
                'headline' : headline,
                'source' : source,
                'source_type' : source_type
            }

            if full_article and len(full_article) > 80:
                print("Adding data in the vectordb!! .....")
                process_and_store_news(full_article , metadata)
            else:
                print("Article skipped..........")
           
    except KeyboardInterrupt:
        print("Consumer Stopped.")

if __name__ == "__main__":
    start_consumer()