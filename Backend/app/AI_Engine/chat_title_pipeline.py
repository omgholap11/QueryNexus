from langchain_core.prompts import PromptTemplate
from app.AI_Engine.llm_models import get_gemini_25_flash_lite
from app.Schema.response import ChatTitleResponse

TITLE_GENERATOR_TEMPLATE = """
Summarize this user query into a short, punchy title (max 5 words). No quotes. Query: {first_message}
"""

prompt = PromptTemplate(
    template=TITLE_GENERATOR_TEMPLATE,
    input_variables=['first_message']
)

llm = get_gemini_25_flash_lite()

model = llm.with_structured_output(ChatTitleResponse)

chain = prompt | model


def get_chat_title(user_query: str):
    print("Generating Title for chat!")
    try :
        response = chain.invoke({'first_message' , user_query})
        chat_title = response.title
        print("Chat Title: " , chat_title)
        return chat_title
    
    except Exception as e:
        print(f"Error occured while generating chats: {e}")
        return user_query


# print(get_chat_title("What happened recently between the usa and iran?"))
