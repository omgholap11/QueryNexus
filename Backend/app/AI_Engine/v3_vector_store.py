from langchain_chroma import Chroma
from app.AI_Engine.embedding_models import get_gemini_001_embedding_model , get_gemini_004_embedding_model , get_ollama_embedding_model

PERSIST_DIRECTORY = "infra_data/chroma_db"

def get_vector_store():
    # embedding_model = get_ollama_embedding_model()
    # embedding_model = get_gemini_001_embedding_model()
    embedding_model = get_gemini_004_embedding_model()
    vector_store = Chroma(
    embedding_function=embedding_model,
    persist_directory=PERSIST_DIRECTORY,
    collection_name="market_news_collection"
    )
    return vector_store


