from datetime import datetime , timedelta
import jwt
import os
from dotenv import load_dotenv
from fastapi import HTTPException

current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
ALGORITHM = os.getenv('JWT_ALGO')

def generate_token(user_data : dict):
    print("Generating JWT Token......")
    to_encode = user_data.copy()   ## id   name   email

    expiry = datetime.utcnow() + timedelta(hours=72)
    to_encode.update({'exp' : expiry})
    to_encode['id'] = str(to_encode['id'])
    try:
        jwt_token = jwt.encode(to_encode , JWT_SECRET_KEY , algorithm=ALGORITHM)
        print(f"JWT Token Generated: {jwt_token}")
        return jwt_token
    
    except Exception as e:
        print(f"Error occued while generating the token!! {e}")
        return None

def verify_token(token : str):
    try:
        payload = jwt.decode(token , JWT_SECRET_KEY , algorithms=[ALGORITHM])
        return payload
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401 , detail="Token has expired")
    
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401 , detail="Invalid Token")       