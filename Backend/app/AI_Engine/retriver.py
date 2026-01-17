from langchain_core.prompts import PromptTemplate , ChatPromptTemplate
from app.AI_Engine.vector_store import get_vector_store
from langchain_core.output_parsers import PydanticOutputParser 
from app.AI_Engine.llm import get_gemini_flash , get_ollama_local
from datetime import datetime
from app.Schema.response import LLM_Response


RAG_PROMPT_TEMPLATE = """
You are VeloMarketSense, a senior financial analyst AI. 
Your goal is to provide high-speed, accurate market insights based strictly on provided context.

--- CURRENT DATE: {curr_date}

--- CONTEXT (REAL-TIME NEWS) ---
{context}
--- END CONTEXT ---

USER QUESTION: {question}

--- INSTRUCTIONS ---
1. **Source of Truth:** Use ONLY the provided context. If the answer is not there, explicitly state: "I lack sufficient real-time data to answer this specific query."
2. **Citation Style:** You MUST cite your sources inline. Format: "News Headline (Source Name)".
3. **Tone:** Professional, objective, and direct. No fluff. Use bolding for **stock prices**, **percentages**.
4. **Time Awareness:** The news context contains dates, prioritize the most recent information.
5. **Key Details:** Use bullet points for specific metrics or events.
6. **Citations:** At the very bottom, list the unique Source URLs used for this answer.
   - Format: Source: [URL]
"""



def get_rag_prompt():
   
    template =  PromptTemplate(
        template=RAG_PROMPT_TEMPLATE, 
        input_variables=["curr_date" , "context", "question"]
    )

    return template



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


def get_response(query):
   
    prompt_template = get_rag_prompt()
    llm = get_gemini_flash()
    llm_wso = llm.with_structured_output(LLM_Response)
    # llm = get_ollama_local()

    retriever = get_retriever("mmr" , 5)

    print(f"Thinking about: '{query}'")

    context_docs = retriever.invoke(query)

    print("Contextual Documents >>>  \n")
    print(context_docs)
    print("\n\n\n\n\n\n")
    
    if not context_docs:
        return "I could not find any relevant news in the database to answer that."

    context_string = format_docs(context_docs)

    chain = prompt_template | llm_wso 

    curr_date = datetime.now().strftime("%A, %B %d, %Y")

    response = chain.invoke({
        "curr_date" : curr_date,
        "context": context_string,
        "question": query
    })

    return response

# print("Hello here in the retriver!!")
print(get_response("The much-awaited Union Budget for the financial year 2026-27 will be presented by"))
# print(get_response("latest news related to the monday holiday is ?"))
# print(get_response("Who will win today maxverstappen or lando norris?"))
# print(get_response("what is the latest news related to the tariffs?"))
# print(get_response("What happened about the netflix and warner bros deal?"))
