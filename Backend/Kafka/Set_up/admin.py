from Backend.Kafka.Set_up.client import admin_client
from kafka.errors import TopicAlreadyExistsError
from kafka.admin import NewTopic

def init_kafka():
    print("Admin Client imported successfully!!")

    topic_name = "market-news"

    new_topic = NewTopic(
        name = topic_name , 
        num_partitions=1,
        replication_factor=1
    )

    print(f"Creating the topic {topic_name}...")

    try:
        admin_client.create_topics(new_topics=[topic_name] , validate_only=False)
        print(f"Topic '{topic_name}' created successfully!!")

    except TopicAlreadyExistsError:
        print(f"Topic '{topic_name}' already exists. Skipping.")

    except Exception as e:
        print(f"Error while Topic creation: {e}")

    finally:
        admin_client.close()
        print("Admin Disconnected.")

if __name__ == "__main__":
    init_kafka()