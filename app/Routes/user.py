from fastapi import APIRouter , Depends , Response
from app.Schema.user import UserSchema , UserSignInSchema
from app.Config.Database.database import get_db  
from sqlalchemy.orm import Session
from app.Controllers.user import handle_user_signup , handle_user_sign_in

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

