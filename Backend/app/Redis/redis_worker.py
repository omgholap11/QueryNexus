from app.Redis.redis_service import retrive_chat_message_from_redis_queue
from app.Config.Database.database import session
from app.Models.chat import ChatMessage
from app.Models.user import UserModel     ## we are not using this still import it as it is connected to the chatsession adn the chatsession to the chatmessage
import json 
import time

def save_chat_messages_to_database(message_data):
    # its the background process so will have to create the local session righgt not the universal canbe used here 
    try:
        db = session()
        print(f"Storing {message_data} to the Database!")

        chat_message_model = ChatMessage(**message_data)
        db.add(chat_message_model)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error while storing the redis message to database!! , {e}")
    finally:
        db.close()



def run_message_saving_worker():
    while True:
        try:
            raw_message_data = retrive_chat_message_from_redis_queue()
            if not raw_message_data:
                print("Null message data recieved at the worker side so skipp..")
                time.sleep(1)   ## wait for a while 
                continue 
            
            json_message_data = json.loads(raw_message_data)
            print("Json Message data: " , json_message_data)
            save_chat_messages_to_database(json_message_data)

        except Exception as e:
            print(f"Error at the message storing redis worker!!  {e}")



if __name__ == "__main__":
    run_message_saving_worker()