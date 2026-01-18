from pydantic import BaseModel , Field
from typing import Annotated , List , Optional

class LLM_Response_Format(BaseModel):
    answer : Annotated[str , Field(title="The direct answer to the user's question. Use Markdown bolding for prices/metrics. Do NOT include a 'Sources' section here.")]
    source : Annotated[List[str] , Field(title="A list of unique source URLs used to generate the answer.")]

class user_chat_payload_fields(BaseModel):
    question: Annotated[str , Field(title="Question by the user.")]
    session_id : Annotated[Optional[str] , Field(
        default=None , 
        title="Session ID. Send null or omit for first request.")]

class User_Chat_Payload(BaseModel):
    payload : user_chat_payload_fields
