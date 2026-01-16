from app.AI_Engine.vector_store import get_vector_store

def add_documents_to_vectordb(documents):
    if not documents:
        print("No documents to add.")
        return
    try:
        vector_store = get_vector_store()
        vector_store.add_documents(documents)
        print(f"Stored {len(documents)} chunks in VectorDB.")
        
    except Exception as e:
        print(f"Error while adding documents to the vectordb {e}")
    return 