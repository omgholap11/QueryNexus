from app.AI_Engine.v3_vector_store import get_vector_store
from langchain_core.output_parsers import PydanticOutputParser 
from app.AI_Engine.llm_models import get_gemini_25_flash , get_gemini_25_flash_lite , get_ollama_local
from datetime import datetime
from app.Schema.response import LLM_Response_Format
from app.AI_Engine.prompt_with_str_output import get_prompt_with_str_output 
from app.AI_Engine.prompt_with_output_parser import get_prompt_with_output_parsers
from app.AI_Engine.rewriter_pipeline import get_standalone_question
from app.Services.redis_service import save_message_to_redis

vector_store = get_vector_store()
retriver = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs = {'k' : 5}
)

prompt_template = get_prompt_with_str_output()

llm = get_gemini_25_flash()

chain = prompt_template | llm.with_structured_output(LLM_Response_Format) 


def format_docs(docs):
    formatted_chunks = []
    for doc in docs:
        news_date = doc.metadata.get("date", "Unknown Date")
        url = doc.metadata.get("url", "No URL")
        content = doc.page_content
        
        chunk = (
            f"News-Date: {news_date}\n"
            f"Source URL: {url}\n"
            f"Content: {content}"
        )
        formatted_chunks.append(chunk)
        
    return "\n\n---\n\n".join(formatted_chunks)

import logging
logger = logging.getLogger(__name__)      ## for keeping the logs logs are pessited even if the terminal clear or was off 

def generate_llm_response(user_question: str, session_id: str):
    
    try:
        standalone_question = get_standalone_question(user_question, session_id)
        print(f"Standalone Question: {standalone_question}")

    except Exception as e:
        logger.error(f"Rewriter Failed: {e}")
        print("Fallback: Using original question.")
        standalone_question = user_question

    try:
        context_docs = retriver.invoke(standalone_question)
        print(f"Contextual Docs Found: {len(context_docs)}")

        if not context_docs:
            return LLM_Response_Format(
                answer="I couldn't find any recent updates on this topic in my database.",
                source=[] 
            )
        
        context_string = format_docs(context_docs)
        curr_date = datetime.now().strftime("%A, %B %d, %Y")

        response = chain.invoke({
            "curr_date": curr_date,
            "context": context_string,
            "question": standalone_question
        })

        if session_id and session_id != "null":
            save_message_to_redis(session_id, "user", user_question)
            save_message_to_redis(session_id, "ai", response.answer)

        return response

    except Exception as e:
        logger.critical(f"Engine Critical Error: {e}")
        
        return LLM_Response_Format(
            answer="I am currently experiencing high traffic or a temporary system error. Please try again in a moment.",
            sources=[]
        )


# print("Hello here in the retriver!!")
# print(generate_llm_response("The much-awaited Union Budget for the financial year 2026-27 will be presented by" , "vms-user-chat-123"))
# print(generate_llm_response("latest news related to the monday holiday is ?" , "12356"))
# print(get_response("Who will win today maxverstappen or lando norris?"))
# print(get_response("what is the latest news related to the tariffs?"))
# print(get_response("What happened about the netflix and warner bros deal?"))
