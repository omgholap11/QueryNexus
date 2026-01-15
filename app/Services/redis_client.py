import redis
from dotenv import load_dotenv
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir , '..', '.env')
load_dotenv(dotenv_path=env_path)


REDIS_HOST = os.getenv("REDIS_HOST", "localhost") 
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

redis_client = None

def get_redis_client():
    global redis_client
    if redis_client is None:
        try:
            redis_client = redis.Redis(
            host = REDIS_HOST,     ##os.getenv(Variable_Name, Default_Value)
            port = REDIS_PORT,
            db=0,        ## just like the tabs in the test data we want just the single one it can be 2 if we used the test and the main data
            decode_responses=True,     ## we want the response in string format else it will give in the binary format
            socket_timeout=2
        )
            redis_client.ping()   ## testing the connection 
            print("Redis client setup done yesss!!")

        except redis.ConnectionError:
            print("Error while Redis Connecrtion!! We are up continue with duplications!!")
            return None 
    print(redis_client)
    return redis_client

redisclient = get_redis_client()
redisclient.set("py_message" , "i_am_omii")












import redis
import os
from dotenv import load_dotenv

load_dotenv()

# 1. Create the Client (Equivalent to 'const client = new Redis()')
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True # ✅ Crucial: Returns 'Strings' instead of 'Bytes'
)

# 2. Test the connection immediately (Optional but recommended)
try:
    redis_client.ping()
    print("✅ Connected to Redis")
except redis.ConnectionError:
    print("❌ Warning: Redis is not connected")