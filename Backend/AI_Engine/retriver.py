from langchain_core.prompts import PromptTemplate
from Backend.AI_Engine.vector_store import get_vector_store
from langchain_core.output_parsers import StrOutputParser
from Backend.AI_Engine.llm import get_gemini_flash , get_ollama_local

RAG_PROMPT_TEMPLATE = """
You are a senior financial analyst at VeloMarketSense. 
Your job is to analyze the provided news snippets and answer the user's question concisely.

STRICT RULES:
1. Use ONLY the context provided below. Do not use outside knowledge.
2. If the answer is not in the context, say "I do not have enough information."
3. Mention the "Source" (from metadata) if possible to build trust.
4. Keep the tone professional and data-driven.

--- CONTEXT START ---
{context}
--- CONTEXT END ---

Question: {question}

Answer:
"""



def get_rag_prompt():
   
    template =  PromptTemplate(
        template=RAG_PROMPT_TEMPLATE, 
        input_variables=["context", "question"]
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
        url = doc.metadata.get("source", "Unknown Source")
        content = doc.page_content
        
        formatted_text += f"Source: {url}\nContent: {content}\n\n---\n\n"
        
    return formatted_text


def get_response(query):
   
    prompt_template = get_rag_prompt()
    llm = get_ollama_local()
    parser = StrOutputParser()
    retriever = get_retriever("similarity" , 2)

    print(f"Thinking about: '{query}'")

    context_docs = retriever.invoke(query)
    
    if not context_docs:
        return "I could not find any relevant news in the database to answer that."

    context_string = format_docs(context_docs)

 
    chain = prompt_template | llm | parser

    response = chain.invoke({
        "context": context_string,
        "question": query
    })

    return response


# print(get_response("What happened about the netflix and warner bros deal?"))
# print(get_response("Who will win today maxverstappen or lando norris?"))
# print(get_response("what is the latest news related to the tariffs?"))
# print(get_response("What happened about the netflix and warner bros deal?"))
