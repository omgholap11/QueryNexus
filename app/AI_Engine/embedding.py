from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

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


def add_documents_to_vectordb(documents):
    if not documents:
        print("No documents to add.")
        return
    vector_store = get_vector_store()
    vector_store.add_documents(documents)
    print(f"Stored {len(documents)} chunks in VectorDB at {PERSIST_DIRECTORY}")