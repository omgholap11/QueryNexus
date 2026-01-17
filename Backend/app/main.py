from fastapi import FastAPI
from Backend.app.AI_Engine.response_pipeline import get_response
app = FastAPI()
from pydantic import BaseModel
from app.Routes.user import userrouter
from app.Models.user import Base
from app.Config.Database.database import engine
from fastapi.middleware.cors import CORSMiddleware

## will load all the tables 
Base.metadata.create_all(bind=engine)

class input_data(BaseModel):
    payload : str

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

@app.post("/api/response")
def getResponse(
    payload : input_data
):
    print(payload)
    dicti = payload.model_dump()
    print(dicti)
    response = get_response(dicti['payload'])
    print(response)
    return {"msg" : response }

print("Om Gholap")



app.include_router(userrouter , prefix="/api/user")





