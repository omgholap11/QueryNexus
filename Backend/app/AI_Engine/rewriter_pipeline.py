from langchain_core.prompts import PromptTemplate
from app.AI_Engine.llm_models import get_gemini_25_flash_lite
from langchain_core.output_parsers import PydanticOutputParser
from app.Services.redis_service import retrive_chat_history_from_redis
from app.Schema.response import SearchQuery
from datetime import datetime

REWRITER_PROMPT_TEMPLATE = """
You are a Search Query Refiner.
Current Date: {current_date}

RULES:
1. Rewrite the "Follow-up Question" into a concise, standalone search query. Replace pronouns (it, he, that) with specific entities from the Chat History.
2. Keep the query concise and focused on the user's intent.
3. Output ONLY the rewritten question text. No preamble.
4. If the user mentions relative time (e.g., "yesterday", "last week" or "date"), use the Current Date to resolve the specific date range.

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

parser = PydanticOutputParser(pydantic_object=SearchQuery)

llm_wso = llm.with_structured_output(parser)

rewriter_chain = rewriter_prompt | llm_wso

def get_detailed_question(question: str, session_id: str):

    if not session_id or session_id == "null":
        return question

    chat_history = retrive_chat_history_from_redis(session_id)

    if not chat_history:
        return question
    
    today_str = datetime.now().strftime("%Y-%m-%d")

    try:
        response = rewriter_chain.invoke({
            'current_date' : today_str,
            'chat_history': chat_history,
            'question': question
        })
        
        result_dict = response.model_dump()
        print("Response from Rewriter Pipeline: " , result_dict)

        return result_dict
        
    except Exception as e:
        print(f"Error while generating standalone question: {e}")
        return question