from fastapi import Request , HTTPException
from Backend.Services.authentication import verify_token
async def auth_middlewares(req : Request):
    token = req.cookies.get('token')
    print(f"Inside the Auth Middleware token: {token}")

    if not token:
        raise HTTPException(
            status_code=400,
            detail = "Unauthorized access - No token is provided!!"
        )
    
    try:
        payload = verify_token(token)
        if payload is None:
            raise HTTPException(
                status_code=401,
                detail="Unauthorized - Invalid token"
            )
        
        print("Payload is >>>>   ",payload)
        req.state.user = {
            "name": payload['name'],
            "email": payload['email'],
            "id": payload['id']
        }


    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Unauthorized - Authentication failed"
        )