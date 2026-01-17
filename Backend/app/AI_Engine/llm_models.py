from langchain_huggingface import ChatHuggingFace , HuggingFacePipeline
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

def get_ollama_local():
    llm = HuggingFacePipeline.from_model_id(
    model_id="TinyLlama/TinyLlama-1.1B-Chat-v1.0" , 
    task = 'text-generation' , 
    pipeline_kwargs=dict(
        temperature=0.5 , 
        max_new_tokens = 100
    )
    )
    model = ChatHuggingFace(llm = llm)
    return model

def get_gemini_25_flash_lite():
    model = init_chat_model('google_genai:gemini-2.5-flash-lite')
    return model

def get_gemini_25_flash():
    model = init_chat_model('google_genai:gemini-2.5-flash')
    return model

