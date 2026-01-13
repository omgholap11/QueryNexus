import json
import time
import random
from kafka import KafkaProducer
from app.APIs.NewsApis.Finnhub import get_news_finnhub
import datetime

def get_producer():
    producer =  KafkaProducer(
        bootstrap_servers=['localhost:9092'],
        value_serializer=lambda x: json.dumps(x).encode('utf-8')
    )
    return producer

seen_news_ids = []

def clean_date(timestamp):
    try:
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    except:
        return str(timestamp)
        

def run_producer():
    print("Producer Service Started.......")
    producer = get_producer()
    print("Producer Connected!!")

    try:
        while True:
            print("Collecting data through the news apis...")

            news_items  = get_news_finnhub()
            new_count = 0

            for news in news_items:
                id = news['id']
                if id  in seen_news_ids:
                    continue

                print(f"Found new news: {news['headline'][:30]}...")
            
                payload = {
                        "id" : news['id'],
                        "category": news['category'],
                        "headline": news['headline'],
                        "date": clean_date(news['datetime']),
                        "source": news['source'],
                        "summary": news['summary'],
                        "url":  news['url']
                    }

                ## sending the data
                producer.send('market-news', value=payload)
                producer.flush()

                seen_news_ids.add(id)
                new_count += 1

            
                print(f"Sent: {payload['headline'][:20]}")

            if new_count == 0:
                print("No new items. Waiting...")
            
            time.sleep(60)   ## fire api call after every 1 minutes 

    except KeyboardInterrupt:
        print("\nStopping Producer...")
        producer.close()
        print("Producer Disconnected!!")

if __name__ == "__main__":
    run_producer()
