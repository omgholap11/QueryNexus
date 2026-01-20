from sqlalchemy import  Column , String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship  
import uuid   
from app.Config.Database.database import Base

class UserModel(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid = True) , primary_key=True , default=uuid.uuid4)
    name = Column(String , nullable=False)
    email = Column(String , unique=True , nullable=False)
    password = Column(String , nullable=False)

    sessions = relationship('ChatSession' , back_populates="user" , cascade="all, delete")  

    