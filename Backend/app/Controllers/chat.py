from app.AI_Engine.response_pipeline import generate_llm_response
from app.AI_Engine.chat_title_pipeline import get_chat_title
from app.Utils.session_utils import generate_session_id
from fastapi import HTTPException 
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from datetime import datetime
from app.Models.chat import ChatSession , ChatMessage
from app.Config.Database.database import session   ## dont use the get_db because it is special only for the fastapi routing and the handlers that exist only upto reqest lifecycle
from app.Redis.redis_service import save_chat_message_to_redis_queue
import json
##  Background Tasks
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
    is_first_message = False

    if not payload or not payload.session_id or not payload.question:
        raise HTTPException(
            status_code=400, 
            detail="Query Data not recieved at the backend!!"
        )
    
    # print(f"Welcome User {current_user['id']}")
    if not payload.session_id or payload.session_id == "null":   ## new user so to create the sessionid and the session entry too here 
        print("New user")
        is_first_message = True
        if current_user and current_user['id']:  ## now to create the session right 
            user_id = current_user['id']
            session_data = {
               "user_id" : user_id,
               "title" : "New Chat",
               "created_at" : datetime.utcnow(),
               "updated_at" : datetime.utcnow(),
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
        llm_result = generate_llm_response(user_question , session_id , is_first_message)
        print("Response from model: " , llm_result)

        llm_response = llm_result.dict()
        # llm_response = {"answer" : "BSDK kyu limit hit kar raha hai!!" , "source" : []}
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
    

def handle_get_all_sessions(current_user , db , offset , limit):
    #first check whether the user is being authenticated right 
    if not current_user or not current_user['id']:
        print("User Was Unauthorized!!")
        HTTPException(status_code=401 , detail="Unauthorized User!!")

    try:
        user_id = current_user['id']
        all_sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).order_by(ChatSession.updated_at.desc()).offset(offset).limit(limit).all()
    
        # print(f"Fetched all sessions with length {len(all_sessions)}")
        print(all_sessions)   

        # time.sleep(2)

        return all_sessions   ## fast api converts these into the json using pydantic validations because of the responsre_model
    
    except Exception as e:
        print(f"Error while retriving the sessions from the DB ->  {e}")
        HTTPException(
            status_code=500,
            detail="Error while fetching all sessions!"
        )


def handle_get_sessions_messages(session_id ,current_user , db , limit , offset):

    print("Fetching the session messages.....")
    if not session_id:
        raise HTTPException(status_code=400 , detail="Session id is missing!!")
    
    if not current_user or not current_user['id']:
        raise HTTPException(status_code=401 , detail="User is not Authenticated!!")
    
    try:
        chat_messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.desc()).offset(offset).limit(limit).all()   ## for desc  >>  desc(Chatmessage.createdat)
        session_details = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
        complete_chat_details = {
            "session_info" : session_details,
            "messages" : chat_messages
        }
        # time.sleep(2)

        print(complete_chat_details)

        return complete_chat_details    ## response model automatically converts the model into the pydantic object and then json type using the response model
    except Exception as e:
        print(f"Error while fetching session Messages. {e}")
        raise HTTPException(
            status_code=500 , 
            detail="Server side error while fetching the session messages."
        )
   
    
def handle_delete_chat(session_id , db):
    print("Deleting the coversations!!")
    if not session_id:
        print("Chat's session_id missing!!")
        raise HTTPException(
            status_code=400 , 
            detail="Session id for the chat not recieved!!")
    
    try:
        chat_session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()

        if not chat_session:
            raise HTTPException(
                status_code=404 , 
                detail="Chat session with provided session id does not exist!!"
            )

        db.delete(chat_session);
        db.commit()

        return {"msg" : "Chat session deleted successfully!!"}
    
    except Exception as e:
        db.rollback()
        print(f"Error while deleting chat session! {e}")
        raise HTTPException(
            status_code=500,
            detail="Error while deleting the chat sessions!!"
        )