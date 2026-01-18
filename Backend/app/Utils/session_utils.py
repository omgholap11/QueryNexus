import uuid

def generate_session_id(prefix: str = "guest") -> str:

    unique_id = uuid.uuid4()
    
    return f"{prefix}_{unique_id}"