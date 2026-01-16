from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
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


PERSIST_DIRECTORY = "app/vms-data/chroma_db"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def get_vector_store():
    # embedding_model = get_ollama_embedding_model(MODEL_NAME)
    # embedding_model = get_gemini_001_embedding_model()
    embedding_model = get_gemini_004_embedding_model()
    vector_store = Chroma(
    embedding_function=embedding_model,
    persist_directory=PERSIST_DIRECTORY,
    collection_name="market_news_collection"
    )
    return vector_store


