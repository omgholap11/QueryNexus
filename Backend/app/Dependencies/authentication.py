from fastapi import Cookie , Request
from typing import Optional
from app.Services.authentication import verify_token

## here token is the name of the coookie right 
## this token is directly read by the fast api from the request at the backgroubd 
## u can also do it manually by checking using the req.cookies.get('token')
## lly for the Bearer token or the tokens in the headers we have the security method provided by the fastapi 


async def get_optimal_user_from_cookie(request : Request , token : Optional[str] = Cookie(default=None)):
    
    print("Token in the Dependencies: " , token)

    if not token:
        print("Token is not setted -- Dependencies!")
        return None
    
    try:
        payload = verify_token(token)
        if not payload:
            return None
        
        print("User Payload Fetched by Dependencies: " , payload)
        return payload
    
    except Exception as e:
        print(f"Error Occured while fetching payload in Auth Dependiencies! {e}")
        return None 
    


## we are using the dependencies not the middlewares because in fast api because >> 
# Type Safety: Middleware monkey-patches the request object, so your editor doesn't know req.user exists.
# Swagger UI: Middleware auth is "invisible" to the auto-generated API docs.
# Datatype Validations with the middlewares the type validations cannot be performed so we are using this 

