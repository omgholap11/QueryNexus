from app.AI_Engine.v3_vector_store import get_vector_store
from langchain_core.output_parsers import PydanticOutputParser 
from app.AI_Engine.llm_models import get_gemini_25_flash , get_gemini_25_flash_lite , get_ollama_local
from datetime import datetime
from app.Schema.response import LLM_Response_Format
from app.AI_Engine.prompt_with_str_output import get_prompt_with_str_output 
from app.AI_Engine.prompt_with_output_parser import get_prompt_with_output_parsers

def get_retriever(search_type , k):
   
    vector_store = get_vector_store()
    retriver = vector_store.as_retriever(
        search_type=search_type,
        search_kwargs = {'k' : k}
    )
    return retriver
   
def format_docs(docs):
    formatted_text = ""
    for doc in docs:
        date = doc.metadata.get("date")
        content = doc.page_content
        url = doc.metadata.get("url")
        
        formatted_text += f"News-Date: {date}\nSource URL: {url}\nContent: {content}\n\n---\n\n"
        
    return formatted_text



def get_closed_source_models():
    llm = get_gemini_25_flash()
    llm_wso = llm.with_structured_output(LLM_Response_Format)
    return llm_wso

def get_opened_source_models():
    return get_ollama_local()


def get_response(query):
    print("Fetching wso prompt Template: ")
    
    prompt_template = get_prompt_with_str_output()
    llm = get_closed_source_models()

    # prompt_template = get_prompt_with_output_parsers()
    # llm = get_opened_source_models()

    retriever = get_retriever("mmr" , 5)
    print(f"Thinking about: '{query}'")
    context_docs = retriever.invoke(query)
    print("Contextual Documents >>>  \n")
    print(context_docs)
    print("\n\n\n\n\n\n")
    
    if not context_docs:
        return "I could not find any relevant news in the database to answer that."
    context_string = format_docs(context_docs)
    chain = prompt_template | llm 

    curr_date = datetime.now().strftime("%A, %B %d, %Y")

    response = chain.invoke({
        "curr_date" : curr_date,
        "context": context_string,
        "question": query
    })

    return response



# print("Hello here in the retriver!!")
# print(get_response("The much-awaited Union Budget for the financial year 2026-27 will be presented by"))
# print(get_response("latest news related to the monday holiday is ?"))
# print(get_response("Who will win today maxverstappen or lando norris?"))
# print(get_response("what is the latest news related to the tariffs?"))
# print(get_response("What happened about the netflix and warner bros deal?"))
