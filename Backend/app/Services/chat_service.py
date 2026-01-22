from app.Config.Database.database import session
from app.Models.chat import ChatMessage
from app.Redis.redis_service import save_chat_history_to_redis
from langchain.messages import HumanMessage , AIMessage

def get_chats_from_database_and_save_to_redis(session_id : str):

    print("Getting the chats from the database!!")
    try:
        db = session()            ## created the ocal session 
        raw_message_data = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.desc()).limit(6).all()
        if not raw_message_data:
            print("No chat message for the provided session!!")
            return []
        
        chat_history = []
        for msg in raw_message_data:
            if msg.role == 'user':
                save_chat_history_to_redis(session_id , 'user' , msg.content)
                chat_history.append(HumanMessage(content=msg.content))

            else:
                save_chat_history_to_redis(session_id , 'ai' , msg.content)
                chat_history.append(AIMessage(content=msg.content))

        print("Message data retrived from the database!! " , chat_history)
        return chat_history

    except Exception as e:
        print(f"Error arised while fetching chat messages from database {e}")
        return []
    
    finally:
        print("Clossing the local db session")
        db.close()
