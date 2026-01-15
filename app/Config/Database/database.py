from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

db_url = os.environ("DATABASE_URL")
engine = create_engine(db_url)
session = sessionmaker(autoflush=False , autocommit = False , bind=engine)

def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()