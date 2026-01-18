from app.AI_Engine.v3_vector_store import get_vector_store

vector_store = get_vector_store()

res = vector_store.get(include=['embeddings' , 'documents' , 'metadatas'])

print(res)


