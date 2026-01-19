from fastapi import HTTPException 
from app.Models.user import UserModel
from sqlalchemy.orm import Session
from app.Services.authentication import generate_token , verify_token
from passlib.context import CryptContext
from fastapi.responses import JSONResponse  

pwd_context = CryptContext(schemes = ["bcrypt"] , deprecated = "auto")

def get_hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)

def verify_user_password(plain_password: str , hashed_password: str) -> bool:
    return pwd_context.verify(plain_password , hashed_password )


def handle_user_signup(payload , res , db):
    user_data = payload.model_dump()   ## pydantic object to the dictionary
    existing_user = db.query(UserModel).filter(UserModel.email == user_data['email']).first()
    print(existing_user)
    print(user_data)
    if existing_user:
        raise HTTPException(status_code=400 , detail="User Already Exist Please Sign In")
    
    password = user_data['password']
    hashed_password = get_hash_password(password)
    user_data['password'] = hashed_password
    user_model = UserModel(**user_data)  ## for dictionary parsing rught 
    print("Cmes here ")
    if user_model is None:
        raise HTTPException(status_code=400 , detail = "Invalid Data Provided")
    try:
        db.add(user_model)
        db.commit()
        db.refresh(user_model)
        print(f"Data saved to the database: {user_data}")

        user_token_data = {
            "id" : user_model.id,
            "name" : user_model.name,
            "email" : user_model.email
        }

        try:
            token = generate_token(user_token_data)
            print(f"User Sign Up Token: {token}")

            if token is None:
                print("Toke Not generated!!")

            res.set_cookie(
                key='token',
                value=token,
                httponly = True,
                max_age = 259200,
                expires = 259200,
                samesite = 'lax',
                secure = False
            )

            return {"msg" : "User Sign Up Successful!!"}
        
        except Exception as e:
            print("Error occured while signing up the user!!")
            raise HTTPException(
            status_code=500,
            detail="User sign up failed!!"
            )
    
    except Exception as e:
        print(f"Error occured during signing up the user!  {e}")
        raise HTTPException(
            status_code=500,
            detail="User sign up failed!!"
        )


def handle_user_sign_in(payload , res , db):
    user_data = payload.model_dump()
    print(user_data)
    existing_user = db.query(UserModel).filter(UserModel.email == user_data['email']).first()
    if existing_user is None:
        raise HTTPException(
            status_code=404 , 
            detail="User Not Found!!"
        )
    
    new_user_password = user_data['password']
    old_user_password = existing_user.password

    if verify_user_password(new_user_password , old_user_password) is False:
        raise HTTPException(status_code=400 , detail = "Incorrect Password")
    
    user_token_data = {
        "id" : existing_user.id,
        "name" : existing_user.name,
        "email" : existing_user.email
     }
    

    try : 
        token = generate_token(user_token_data)
        print(f"User Sign Up Token: {token}")

        if token is None:
            print("Toke Not generated!!")

        res.set_cookie(
            key='token',
            value=token,
            httponly = True,
            max_age = 259200,
            expires = 259200,
            samesite = 'lax',
            secure = False
        )

        return {"msg" : "User Sign In Successful!!"}
        
    except Exception as e:
        print("Error occured while signing up the user!!")
        raise HTTPException(
        status_code=500,
        detail="User sign up failed!!"
    )

def handle_get_user_details(req):
    token = req.cookies.get('token') 
    print(f"Getting user Tokens: {token}")   
    if not token:
        raise HTTPException(status_code=401 , detail="Unauthorized")
    try:
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401 , detail="Unauthorized")

        print(f"Authenticated User! {payload}")
        
        return JSONResponse(status_code=200, content={
            "msg": "User Details Fetched Successfully!!",
            "user": {
                "id": payload.get("id"),
                "name": payload.get("name"),
                "email": payload.get("email")
            }
        })    
        
    except Exception as e:
        print(f"Error occured while getting user details!  {e}")
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )




