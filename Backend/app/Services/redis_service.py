import hashlib
from app.Services.redis_client import get_redis_client
import json
from redis import RedisError
from langchain_core.messages import HumanMessage , AIMessage

WINDOW_SIZE = 6       
SESSION_TTL = 3600  ## 1 hour

def check_and_cache_to_redis(url):
    if not url:
        return False

    r_client = get_redis_client()
    if r_client is None:
        return True
    
    try:
        hashed_key = hashlib.md5(url.encode('utf-8')).hexdigest()
        redis_key = f"seen:{hashed_key}"

        if r_client.exists(redis_key) == 1:
            print("Duplicate Url so skip these!!")
            return False
        
        print("Unique Url storing to the Redis!!")
        r_client.set(redis_key , "1" , ex=259200)   ## 3 days 

        return True    ## push it to the kafka
    except Exception as e:
        print(f"Error occured duing Redis caching as {e}")
        return True

# cache_to_redis("www.google.com/omgholap11/@45")



def save_message_to_redis(session_id: str, role: str, content: str):
       
    key = f"chat: {session_id}"   
    message_data = {
        "role": role,       # "user" or "ai"
        "content": content,
    }
    json_payload = json.dumps(message_data)

    redis_client = get_redis_client()
    if redis_client is None:
        print(f"Failed to save {role} message to {key}: Redis Not Initiated!!")
        return 

    try:   
        pipe = redis_client.pipeline()
         
        pipe.rpush(key, json_payload)       ## pushes from the right side
        pipe.ltrim(key, -WINDOW_SIZE, -1)     ### trims from the left side if exceeds than the windowsize      
        pipe.expire(key, SESSION_TTL)       ## sets the ttl  >>  rolling expiration everytime after the last visiit it gets updates right 
        pipe.execute()                
            
        print(f"Saved {role} message to {key}")
    except RedisError as e:
        print(f"Failed to save {role} message to {key}: {e}")
          

def retrive_chat_history_from_redis(session_id : str):
    if not session_id:
        print("Null ession id recieved!!")
        return []
    
    chat_history = []
    key = f"chat: {session_id}"
    try:
        redis_client = get_redis_client()
        raw_history = redis_client.lrange(key , 0,-1);
        for chat in raw_history:
            data = json.loads(chat)
            role = data.get('role')
            content = data.get('content')

            if role == 'user':
                chat_history.append(HumanMessage(content=content))
            elif role == 'ai':
                chat_history.append(AIMessage(content=content))
        return chat_history
    except Exception as e:
        print(f"Error occured while saving the message in chat: {e}")
        return []
    

# def save_database_messages_to_redis(message_data):
#     if not message_data:
#         print("Message data not recieved to the redis!!")
    
#     try:
#         redis_client = get_redis_client()


