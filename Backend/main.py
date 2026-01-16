from fastapi import FastAPI
from Backend.AI_Engine.retriver import get_response
app = FastAPI()
from pydantic import BaseModel
from Backend.Routes.user import userrouter
from Backend.Models.user import Base
from Backend.Config.Database.database import engine

## will load all the tables 
Base.metadata.create_all(bind=engine)

class input_data(BaseModel):
    payload : str

@app.post("/response")
def getResponse(
    payload : input_data
):
    print(payload)
    dicti = payload.model_dump()
    print(dicti)
    response = get_response(dicti['payload'])
    print(response)
    return {"msg" : response}

print("Om Gholap")



app.include_router(userrouter , prefix="/api/user")





