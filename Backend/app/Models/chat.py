from sqlalchemy import String , Column , ForeignKey
from sqlalchemy.dialects.postgresql import UUID 
from sqlalchemy.ext.declarative import declarative_base
import uuid
from sqlalchemy.orm import relationship

Base = declarative_base()

class ChatSession(Base):
    

    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid = True) , primary_key=True , default = uuid.uuid4)
    user_id = Column(UUID(as_uuid=True) , ForeignKey("users.id") , nullable = False)
    title = Column(String , nullable=False)

    user = relationship("UserModel" , back_populates="sessions")    # connect the chatsion to the users
    messages = relationship("ChatMessage",back_populates="session" , cascade="all, delete")  ## creates the bidirectional paths like user.session >> all sessions   session.user >>  user  can be get


class ChatMessage(Base):

    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid = True) , ForeignKey("chat_sessions.id") , nullable = False)
    role = Column(String, nullable=False)
    content = Column(String , nullable=False)

    session = relationship("ChatSession" , back_populates="messages")  ## now i can do messages.session   and session.messages


    