from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

CHUNK_SIZE = 800
splitter = RecursiveCharacterTextSplitter(
    chunk_size = CHUNK_SIZE,
    chunk_overlap = 150
)

def get_chunks(text , metadata):

    if len(text) < CHUNK_SIZE:
        # Don't split. Just return it as one document.
        return [Document(page_content=text, metadata=metadata)]

    try:
        chunks = splitter.create_documents([text], metadatas=[metadata])

        print(f"Chunkking Done!... length: {len(chunks)}")
        return chunks
    
    except Exception as e:
        print(f"Error while chunking: {e}")
        return None
