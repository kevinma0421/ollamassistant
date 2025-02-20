from flask import Blueprint, jsonify
from db.database import db
from models.chat_session import ChatSession
import uuid

session_bp = Blueprint('session_bp', __name__)


@session_bp.route('/latest_session', methods=['GET'])
def latest_session():
    latest_session = ChatSession.query.order_by(ChatSession.created_at.desc()).first()
    if latest_session:
        return jsonify({
            "session_id": latest_session.session_id,
            "messages": latest_session.messages,
            "created_at": latest_session.created_at.isoformat()
        })
    else:
        return jsonify({"session_id": None}), 404


@session_bp.route('/new_session', methods=['POST'])
def new_session():
    session_id = str(uuid.uuid4())
    new_session = ChatSession(session_id=session_id, messages=[])
    db.session.add(new_session)
    db.session.commit()

    return jsonify({
        "session_id": new_session.session_id,
        "messages": new_session.messages,
        "created_at": new_session.created_at.isoformat()
    })
