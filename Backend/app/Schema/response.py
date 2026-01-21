from pydantic import BaseModel , Field
from typing import Annotated , List , Optional
from uuid import UUID
from datetime import datetime

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


class SearchQuery(BaseModel):
    standalone_query: str = Field(..., description="Optimized keyword search query")
    is_date_specific: bool = Field(..., description="True if user mentioned a specific time")
    start_date: Optional[str] = Field(None, description="ISO format (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="ISO format (YYYY-MM-DD)")


class ChatTitleResponse(BaseModel):
    title : Annotated[str , Field(title="Title of the user query.")]


class ChatSessionsSchemaForClient(BaseModel):
    session_id : Annotated[UUID , Field(title="Session_id of the session or chat..")]
    title : Annotated[str , Field(title="Title of the chat..")]
    created_at : Annotated[datetime , Field(title="Chat created or started at...")]

    class Config:
        from_attributes : True   ## pydantic can read the sqlalchemy object using this 
        populate_by_name : True


class ChatMessagesSchemaForClient(BaseModel):
    role : Annotated[str , Field(title="Message created by (AI OR USER).")]
    content : Annotated[str , Field(title="Content od the message.")]
    created_at : Annotated[datetime , Field(title="Timestamp when the message was created.")]

    class Config:
        from_attribute : True
        populate_by_name : True
        