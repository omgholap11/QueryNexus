from sqlalchemy import  Column , String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID  
import uuid   
Base = declarative_base()

class UserModel(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid = True) , primary_key=True , default=uuid.uuid4)
    name = Column(String , nullable=False)
    email = Column(String , unique=True , nullable=False)
    password = Column(String , nullable=False)
