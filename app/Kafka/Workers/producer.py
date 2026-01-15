import json
import time
from kafka import KafkaProducer
from app.APIs.NewsApis.Finnhub import get_news_finnhub
from app.APIs.NewsApis.marketaux import get_marketaux_news
from app.APIs.NewsApis.moneycontrol import get_livemint_news
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
    # producer = get_producer()
    print("Producer Connected!!")

    try:
        while True:
            print("Collecting data through the news apis...")
            all_articles = []
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
            
            # for news in all_articles:
            #     id = news['id']
            #     if id  in seen_news_ids:
            #         continue

            #     print(f"Found new news: {news['headline'][:30]}...")
            
            #     payload = {
            #             "id" : news['id'],
            #             "category": news['category'],
            #             "headline": news['headline'],
            #             "date": clean_date(news['datetime']),
            #             "source": news['source'],
            #             "summary": news['summary'],
            #             "url":  news['url']
            #         }

            #     ## sending the data
            #     producer.send('market-news', value=payload)
            #     producer.flush()

            #     seen_news_ids.add(id)
            #     new_count += 1

            
            #     print(f"Sent: {payload['headline'][:20]}")

            # if new_count == 0:
            #     print("No new items. Waiting...")
            
            # time.sleep(60)   ## fire api call after every 1 minutes 

    except KeyboardInterrupt:
        print("\nStopping Producer...")
        # producer.close()
        print("Producer Disconnected!!")

# if __name__ == "__main__":
#     run_producer()

run_producer()


## running the script from the root 
## python -m app.Kafka.Workers.producer