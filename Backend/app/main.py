from fastapi import FastAPI
from app.Routes.user import userrouter
from app.Models.user import Base
from app.Config.Database.database import engine
from fastapi.middleware.cors import CORSMiddleware
from app.Routes.chat import chat_router

app = FastAPI()
## will load all the tables 
Base.metadata.create_all(bind=engine)


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Important for cookies/auth
    allow_methods=["*"],
    allow_headers=["*"],
)



print("Om Gholap")

app.include_router(userrouter , prefix="/api/user")

app.include_router(chat_router , prefix = "/api/chat")




