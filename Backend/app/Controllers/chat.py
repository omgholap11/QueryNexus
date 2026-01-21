from app.AI_Engine.response_pipeline import generate_llm_response
from app.AI_Engine.chat_title_pipeline import get_chat_title
from app.Utils.session_utils import generate_session_id
from fastapi import HTTPException 
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from datetime import datetime
from app.Models.chat import ChatSession
from app.Config.Database.database import session   ## dont use the get_db because it is special only for the fastapi routing and the handlers that exist only upto reqest lifecycle
from app.Services.redis_service import save_chat_message_to_redis_queue
import json



def update_chat_title_task(session_id : str , user_query : str ):   ## this background tasks required there own db session as the first db session gets closed as soon as the request i being over right 
    print("Background Task in Progress to update the chat title.")     ## so create the another local session 

    db = session()
    try:
        chat_title = get_chat_title(user_query)

        print("Chat Title: ",chat_title)
        if chat_title:
            session_to_update = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
            if session_to_update:
                session_to_update.title = chat_title
                db.commit()
                print("Chat title updated!!")

    except Exception as e:
        print(f"Background Tasks(chat title updation) failed {e}")
    finally:
        db.close()
        print("Local db session closed!")


def get_response_from_model(payload , current_user , db , background_tasks):
    session_id = None
    # print(f"Welcome User {current_user['id']}")

    if not payload.session_id or payload.session_id == "null":   ## new user so to create the sessionid and the session entry too here 
        print("New user")
        if current_user and current_user['id']:  ## now to create the session right 
            user_id = current_user['id']
            session_data = {
               "user_id" : user_id,
               "title" : "New Chat",
               "created_at" : datetime.utcnow(),
            }

            chat_session_model = ChatSession(**session_data)
            if chat_session_model:
                try:
                    db.add(chat_session_model)
                    db.commit()
                    db.refresh(chat_session_model)
               
                    session_id = chat_session_model.session_id
                    print(f"{session_data}  inserted in the database with session id {session_id}")

                    background_tasks.add_task(   ## this will be executed at the background after response is send to frontend then 
                        update_chat_title_task , 
                        session_id,
                        payload.question,
                    )

                except Exception as e:
                   print(f"Error occured while inserting the session data in db -- {e}")
                


            else :
                session_id = generate_session_id()

    else:
        print("Existing User")
        session_id = payload.session_id


    user_question = payload.question
    print(f"Question {user_question} recieved from sessionid {session_id}")
    
    try:        
        # llm_result = generate_llm_response(user_question , session_id)
        # print("Response from model: " , llm_result)

        # llm_response = llm_result.dict()
        llm_response = {"answer" : "BSDK kyu limit hit kar raha hai!!" , "source" : []}
        llm_response['session_id'] = session_id

       
        if current_user and current_user['id']:  ## User is authenticated here so save his complete chats right in the redis 
            user_message_data= {
            "session_id" : str(session_id),
            "role" : "User",
            "content" : user_question,
            "created_at" : datetime.utcnow().isoformat()            
            }

            ai_message_data = {
            "session_id" : str(session_id),
            "role" : "VMS-AI",
            "content" : llm_response['answer'],
            "created_at": datetime.utcnow().isoformat()
            }

            user_message_data_json = json.dumps(user_message_data)
            ai_message_data_json = json.dumps(ai_message_data)

            try:
                print("Pusing the messages to the redis queue!!")
                save_chat_message_to_redis_queue(user_message_data_json)
                save_chat_message_to_redis_queue(ai_message_data_json)

            except Exception as e:
                print("Error while storing message to the redis queue!")

        return JSONResponse(
            status_code=200,
            content=jsonable_encoder(llm_response)
        )
    
    # Future Scpoe 
    ## if the user is being authenticated we will store the chat in the database
    
    except Exception as e:
        print(f"Error while getting response from model!! {e}")
        raise HTTPException(status_code=500 , detail="Internal AI Engine Processing Failed!!")
    

def handle_get_all_sessions(current_user , db):
    #first check whether the user is being authenticated right 
    if not current_user or not current_user['id']:
        print("User Was Unauthorized!!")
        HTTPException(status_code=401 , detail="Unauthorized User!!")

    try:
        user_id = current_user['id']
        all_sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).all()
    
        # print(f"Fetched all sessions with length {len(all_sessions)}")
        print(all_sessions)   

        return all_sessions   ## fast api converts these into the json using pydantic validations at the responsre_model
    
    except Exception as e:
        print(f"Error while retriving the sessions from the DB ->  {e}")
        HTTPException(
            status_code=500,
            detail="Error while fetching all sessions!"
        )
