from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

db_url = os.getenv("DATABASE_URL")
print("Database Url: " , db_url)


engine = create_engine(db_url)
session = sessionmaker(autoflush=False , autocommit = False , bind=engine)

def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()