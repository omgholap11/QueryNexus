from app.AI_Engine.chunking import get_chunks
from app.AI_Engine.embedding import add_documents_to_vectordb

def process_and_store_news(text , url):
    if not text:
        print(f"Skipping empty text for: {url}")
        return
    
    print(f"AI Engine processing: {url}")
    chunks = get_chunks(text, url)

    if chunks:
        add_documents_to_vectordb(chunks)
        print(f"Successfully processed {len(chunks)} chunks.")
    else:
        print("No chunks created (Text might be too short or invalid).")



