from langchain_core.prompts import PromptTemplate
from app.AI_Engine.llm_models import get_gemini_25_flash_lite
from langchain_core.output_parsers import StrOutputParser
from app.Services.redis_client import retrive_chat_history_from_redis

REWRITER_PROMPT_TEMPLATE = """
You are a Search Query Refiner.
Your job is to rewrite the user's "Follow-up Question" into a "Standalone Search Query" that can be understood without the chat history.

RULES:
1. Replace pronouns (it, he, she, they, that) with the specific names/entities from the Chat History.
2. Keep the query concise and focused on the user's intent.
3. Do NOT answer the question.
4. Output ONLY the rewritten question text. No preamble.

--- CHAT HISTORY START ---
{chat_history}
--- CHAT HISTORY END ---

Follow-up Question: {question}

Standalone Question:
"""

rewriter_prompt = PromptTemplate(
    template=REWRITER_PROMPT_TEMPLATE,
    input_variables=['chat_history', 'question']
)

llm = get_gemini_25_flash_lite()
parser = StrOutputParser()


rewriter_chain = rewriter_prompt | llm | parser

def get_standalone_question(question: str, session_id: str):

    if not session_id or session_id == "null":
        return question

    chat_history = retrive_chat_history_from_redis(session_id)

    if not chat_history:
        return question

    try:
        standalone_question = rewriter_chain.invoke({
            'chat_history': chat_history,
            'question': question
        })
        
        return standalone_question.strip()
        
    except Exception as e:
        print(f"Error while generating standalone question: {e}")
        return question