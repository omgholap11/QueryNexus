from fastapi import FastAPI
from app.AI_Engine.retriver import get_response
app = FastAPI()
from pydantic import BaseModel

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





