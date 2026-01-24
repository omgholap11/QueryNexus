from fastapi import APIRouter , Depends , Response , Request
from app.Schema.user import UserSchema , UserSignInSchema , UserDeleteAccountSchema
from app.Config.Database.database import get_db  
from sqlalchemy.orm import Session
from app.Controllers.user import handle_user_signup , handle_user_sign_in , handle_get_user_details , handle_user_logout , handle_delete_user_account
from app.Dependencies.authentication import get_optimal_user_from_cookie
from app.Utils.rate_limiter import limiter

userrouter = APIRouter()

@userrouter.post("/signup")
@limiter.limit('5/minute')
def signup(                                      ## if u are implementing the rate limiting then req object in the parameters is requered although u are using it or not
    request : Request,                      ## be word specific here use request exact word only dont use the req or whatever
    payload : UserSchema,
    res : Response,
    db : Session = Depends(get_db),  
):
    return handle_user_signup(payload , res , db)

@userrouter.post("/signin")
@limiter.limit('10/minute')
def signin(
    request : Request,
    payload : UserSignInSchema,
    res : Response,
    db : Session = Depends(get_db)
):
    return handle_user_sign_in(payload , res , db)

@userrouter.get("/user-details")
@limiter.exempt
def get_user_details(
    request : Request,
):
    return handle_get_user_details(request)

@userrouter.post("/logout")
@limiter.exempt
def user_logout(
    request : Request,
    res : Response
):
    return handle_user_logout(res)

@userrouter.delete("/delete-account")
@limiter.limit('5/minute')
def delete_account(
    request : Request,
    res : Response,
    payload : UserDeleteAccountSchema,
    current_user : dict =  Depends(get_optimal_user_from_cookie),
    db : Session = Depends(get_db)
):
    password = payload.password
    return handle_delete_user_account(password=password , current_user=current_user , db = db , res = res)

