from fastapi import APIRouter , Depends , Response , Request
from app.Schema.user import UserSchema , UserSignInSchema , UserDeleteAccountSchema
from app.Config.Database.database import get_db  
from sqlalchemy.orm import Session
from app.Controllers.user import handle_user_signup , handle_user_sign_in , handle_get_user_details , handle_user_logout , handle_delete_user_account
from app.Dependencies.authentication import get_optimal_user_from_cookie
userrouter = APIRouter()

@userrouter.post("/signup")
def signup(
    payload : UserSchema,
    res : Response,
    db : Session = Depends(get_db),  
):
    return handle_user_signup(payload , res , db)

@userrouter.post("/signin")
def signin(
    payload : UserSignInSchema,
    res : Response,
    db : Session = Depends(get_db)
):
    return handle_user_sign_in(payload , res , db)

@userrouter.get("/user-details")
def get_user_details(
    req : Request,
):
    return handle_get_user_details(req)

@userrouter.post("/logout")
def user_logout(
    res : Response
):
    return handle_user_logout(res)

@userrouter.delete("/delete-account")
def delete_account(
    res : Response,
    payload : UserDeleteAccountSchema,
    current_user : dict =  Depends(get_optimal_user_from_cookie),
    db : Session = Depends(get_db)
):
    password = payload.password
    return handle_delete_user_account(password=password , current_user=current_user , db = db , res = res)

