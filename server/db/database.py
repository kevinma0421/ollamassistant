from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from config.settings import DATABASE_URL

db = SQLAlchemy()
engine = create_engine(DATABASE_URL)
