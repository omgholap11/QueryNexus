from slowapi import Limiter
from slowapi.util import get_remote_address
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=REDIS_URL, 
    default_limits=["60/minute"]  # Standard Global Limit
)

## the currrent implementations actually tracks the ip address of the request 
## so if 2-3 peoples are in the same wifi they may have the same public ips so can be treated as the one only
## solution for these is ctually tracking the actual location of the user that can be done using the user id actually q