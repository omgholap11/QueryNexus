import json
from kafka import KafkaConsumer
from app.APIs.Services.scrap import fetch_with_spoofing
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
            full_article = fetch_with_spoofing(url)

            if full_article is None:
                continue

            print(full_article[:100])

            process_and_store_news(full_article , url)
            
            print("Documents Added to the vectordb!! .. ")
            print("\n\n\n\n\n\n\n")

            ## will handle here the embedding an all right 


    except KeyboardInterrupt:
        print("Consumer Stopped.")

if __name__ == "__main__":
    start_consumer()