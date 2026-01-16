from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

def get_embedding_model(model_name):
    print("Loading Embedding Model...")
    return HuggingFaceEmbeddings(model_name=model_name)

PERSIST_DIRECTORY = "app/vms-data/chroma_db"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def get_vector_store():
    embedding_model = get_embedding_model(MODEL_NAME)
    vector_store = Chroma(
    embedding_function=embedding_model,
    persist_directory=PERSIST_DIRECTORY,
    collection_name="market_news_collection"
    )
    return vector_store
