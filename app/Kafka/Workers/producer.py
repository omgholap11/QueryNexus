import json
import time
import random
from kafka import KafkaProducer

def get_producer():
    
    producer =  KafkaProducer(
        bootstrap_servers=['localhost:9092'],
        value_serializer=lambda x: json.dumps(x).encode('utf-8')
    )

    return producer

def run_producer():
    print("Producer Service Started.......")
    producer = get_producer()
    print("Producer Connected!!")

    tickers = ["HDFC", "TCS", "RELIANCE", "INFY", "ZOMATO"]
    actions = ["surges", "falls", "flat", "reports growth", "acquires startup"]

    try:
        while True:
            print("Collecting data through the apis...")

            ticker = random.choice(tickers)
            price_change = random.randint(-5, 10)
            
            payload = {
                "ticker": ticker,
                "headline": f"{ticker} {random.choice(actions)} by {abs(price_change)}% in intraday trade",
                "price_change": f"{price_change}%",
                "timestamp": time.time()
            }

            ## sending the data
            producer.send('market-news', value=payload)
            
           
            producer.flush()
            
            print(f"Sent: {payload['ticker']} | {payload['headline']}")
            
            time.sleep(3)

    except KeyboardInterrupt:
        print("\nStopping Producer...")
        producer.close()
        print("Producer Disconnected!!")

if __name__ == "__main__":
    run_producer()
