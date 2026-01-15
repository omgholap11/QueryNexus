from sqlalchemy import  Column , String , Integer
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class UserModel(Base):
    id = Column(Integer , primary_key=True , autoincrement=True)
    name = Column(String , nullable=False)
    email = Column(String , unique=True , nullable=False)
    password = Column(String , nullable=False)
