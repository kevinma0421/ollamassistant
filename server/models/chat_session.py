from db.database import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy_json import mutable_json_type


class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'

    session_id = db.Column(db.String(36), primary_key=True)
    messages = db.Column(mutable_json_type(dbtype=JSONB, nested=True), nullable=False, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

