import redis
from dotenv import load_dotenv
import os
import hashlib

current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir , '..', '.env')
load_dotenv(dotenv_path=env_path)


REDIS_HOST = os.getenv("REDIS_HOST", "localhost") 
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

redis_client = None

def get_redis_client():
    global redis_client
    if redis_client is not None:
        return redis_client

    try:
        client = redis.Redis(
        host = REDIS_HOST,     ##os.getenv(Variable_Name, Default_Value)
        port = REDIS_PORT,
        db=0,        ## just like the tabs in the test data we want just the single one it can be 2 if we used the test and the main data
        decode_responses=True,     ## we want the response in string format else it will give in the binary format
        socket_timeout=2
    )
        client.ping()   ## testing the connection 
        print("Redis client setup done yesss!!")
        redis_client = client
        return redis_client

    except redis.ConnectionError:
        print("Error: Redis Connection Failed!! We are still up, continue with duplications!!")
        return None 
    
    except Exception as e:
        print(f"Unexpected Redis Error: {e}")
        return None


def cache_to_redis(url):
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

        return True
    except Exception as e:
        print(f"Error occured duing Redis caching as {e}")
        return True

# cache_to_redis("www.google.com/omgholap11/@45")