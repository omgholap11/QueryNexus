import redis
from dotenv import load_dotenv
import os


current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir , '..','..' ,'.env')
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
        socket_timeout=None,      ## this is the max time upto which redis client can stay connected  when the redis operation is not taking place 
        ## we are using the worker that is fetching the redis queue and inserting the data into the database so for that purpose we want the redis connection connected even if the redis client is being blocked due to the blocking pop operations 
        ## but to ensure the connection on the network failure we will use this 
        socket_keepalive=True
        ## this will send the dummy request or ping after 60 seconds of the inactivity just to check whether is it connected or not and ensure the network failures doesnt damages redis client 
    )
        client.ping()   ## testing the connection 
        print("Redis client setup done yesss!!")
        redis_client = client
        return redis_client

    except redis.ConnectionError as e:
        print(f"Error: Redis Connection Failed!! We are still up, continue with duplications!! {e}")
        return None 
    
    except Exception as e:
        print(f"Unexpected Redis Error: {e}")
        return None

