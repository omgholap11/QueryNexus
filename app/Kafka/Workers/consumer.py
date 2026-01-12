import json
from kafka import KafkaConsumer

def start_consumer():
    print("Consumer Connecting.....")

    consumer = KafkaConsumer(
        "market-news" ,    ## subscribing to the topic right 
        bootstrap_servers=['localhost:9092'],    ## kafka runnning port 
        group_id='velo-worker-group',
        auto_offset_reset='earliest',    ## like the from beggining true
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))  ## convertc the incominng bytes to the python dictionary
    )

    print("Consumer Connected!!")

    try:
        for message in consumer:
            data = message.value

            print(
                f" GROUP[velo-worker-group] : "
                f"TOPIC[{message.topic}] : "
                f"PART:{message.partition} : "
                f"Ticker: {data.get('ticker')} | Headline: {data.get('headline')}"
            )

    except KeyboardInterrupt:
        print("Consumer Stopped.")

if __name__ == "__main__":
    start_consumer()