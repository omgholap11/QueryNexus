import json
import time
from kafka import KafkaProducer
from app.APIs.NewsApis.Finnhub import get_news_finnhub
from app.APIs.NewsApis.marketaux import get_marketaux_news
from app.APIs.NewsApis.moneycontrol import get_livemint_news
from app.Services.redis_service import check_and_cache_to_redis


import datetime

def get_producer():
    producer =  KafkaProducer(
        bootstrap_servers=['localhost:9092'],
        value_serializer=lambda x: json.dumps(x).encode('utf-8'))
    return producer


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
            all_articles = []
            news_cnt = 0
            # Finnhub source
            try:
                finnhub_news = get_news_finnhub()
                all_articles.extend(finnhub_news)
            except Exception as e:
                print(f"Error while collection news from Finnhub -> {e}")

            # Marketaux 
            try:
                marketaux_news = get_marketaux_news()
                all_articles.extend(marketaux_news)
            except Exception as e:
                print(f"Error while collecting news from Marketaux -> {e}")

            ## Moneey control (Livemint)
            try:
                livemint_news = get_livemint_news()
                all_articles.extend(livemint_news)
            except Exception as e:
                print(f"Error while collecting news from Marketaux -> {e}")

            print(f"Length of all articles: {len(all_articles)}")
            # print(all_articles) 
            
            for news in all_articles:
                url = news.get('url')

                if url is None:
                    continue

                try:
                    if check_and_cache_to_redis(url):
                        ## sending the data to kafka
                        producer.send('market-news', value=news)
                        news_cnt += 1

                except Exception as e:
                    print(f"Error occured while producing the data in kafka!! -> {e}")
            
            if news_cnt > 0:
                producer.flush()
                print(f"Found {news_cnt} new news in current cycle.")
            else:
                print("No new news articles found in current cycle!!")

            print("Sleeping for 15 minutes.........")
            time.sleep(900)   ## fire api call after every 15 minutes 

    except KeyboardInterrupt:
        print("\nStopping Producer...")
        producer.close()
        print("Producer Disconnected!!")

if __name__ == "__main__":
    run_producer()

## running the script from the root 
## python -m app.Kafka.Workers.producer