from app.AI_Engine.response_pipeline import generate_llm_response
from app.Utils.session_utils import generate_session_id
from fastapi import HTTPException 
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

def get_response_from_model(payload , db):
    session_id = ""

    if not payload.session_id or payload.session_id == "null":
        print("New user")
        session_id = generate_session_id()
    else:
        print("Existing User")
        session_id = payload.session_id


    user_question = payload.question
    print(f"Question {user_question} recieved from sessionid {session_id}")
    
    try:        
        llm_result = generate_llm_response(user_question , session_id)
        print("Response from model: " , llm_result)

        llm_response = llm_result.dict()
        llm_response['session_id'] = session_id

        return JSONResponse(
            status_code=200,
            content=jsonable_encoder(llm_response)
        )
    
    # Future Scpoe 
    ## if the user is being authenticated we will store the chat in the database
    
    except Exception as e:
        print(f"Error while getting response from model!! {e}")
        raise HTTPException(status_code=500 , detail="Internal AI Engine Processing Failed!!")
    