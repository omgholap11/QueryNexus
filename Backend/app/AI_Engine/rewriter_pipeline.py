from langchain_core.prompts import PromptTemplate
from app.AI_Engine.llm_models import get_gemini_25_flash_lite
from langchain_core.output_parsers import StrOutputParser
from app.Redis.redis_service import retrive_chat_history_from_redis
from app.Services.chat_service import get_chats_from_database_and_save_to_redis
from datetime import datetime

REWRITER_PROMPT_TEMPLATE = """
You are a Search Query Refiner.
Current Date: {current_date}

RULES:
1. Rewrite the "Follow-up Question" into a concise, standalone search query. Replace pronouns (it, he, that) with specific entities from the Chat History.
2. Keep the query concise and focused on the user's intent.
3. Output ONLY the rewritten question text. No preamble.

--- CHAT HISTORY START ---
{chat_history}
--- CHAT HISTORY END ---

Follow-up Question: {question}
"""

rewriter_prompt = PromptTemplate(
    template=REWRITER_PROMPT_TEMPLATE,
    input_variables=['chat_history', 'question']
)
llm = get_gemini_25_flash_lite()
parser = StrOutputParser()
rewriter_chain = rewriter_prompt | llm | parser

def get_detailed_question(question: str, session_id: str):

    if not session_id or session_id == "null":
        return question

    chat_history = retrive_chat_history_from_redis(session_id)

    if not chat_history:    ## here we have to check the db once if it was the older chat right 
        chat_history = get_chats_from_database_and_save_to_redis(session_id)
        print("Chat saved to the redis!!")
        if not chat_history:
            return question
    
    today_str = datetime.now().strftime("%Y-%m-%d")

    try:
        response = rewriter_chain.invoke({
            'current_date' : today_str,
            'chat_history': chat_history,
            'question': question
        })
        
        print("Response from Rewriter Pipeline: " , response)

        return response
        
    except Exception as e:
        print(f"Error while generating standalone question: {e}")
        return question