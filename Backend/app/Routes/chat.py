from fastapi import APIRouter , Response , Depends , Request
from app.Schema.response import User_Chat_Payload
chat_router = APIRouter()
from Backend.app.Controllers.chat import get_response_from_model
from sqlalchemy.orm import Session
from app.Config.Database.database import get_db

@chat_router.post("/getresponse")
async def get_response(
    request : User_Chat_Payload,
    db : Session = Depends(get_db)
):
    data = request.payload
    return await get_response_from_model(data,db)