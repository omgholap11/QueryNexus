from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

def get_ollama_embedding_model(model_name):
    print("Loading Embedding Model...")
    return HuggingFaceEmbeddings(model_name=model_name)

def get_gemini_001_embedding_model():
    print("Loading Gemini Model....")
    return GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

def get_gemini_004_embedding_model():
    print("Loading gemini Model..")
    return GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
