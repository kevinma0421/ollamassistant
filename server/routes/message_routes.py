from flask import Blueprint, request, jsonify
from db.database import db
from models.chat_session import ChatSession

message_bp = Blueprint('message_bp', __name__)


@message_bp.route('/append_message', methods=['POST'])
def append_message():
    data = request.get_json()
    session_id = data.get('session_id')
    user_message = data.get('user_message')
    ai_message = data.get('ai_message')

    if not session_id or user_message is None or ai_message is None:
        return jsonify({"error": "Missing fields"}), 400

    chat_session = ChatSession.query.get(session_id)

    if not chat_session:
        return jsonify({"error": "Session not found"}), 404

    current_messages = chat_session.messages if chat_session.messages else []

    current_messages.append({"type": "human", "content": user_message})
    current_messages.append({"type": "ai", "content": ai_message})

    chat_session.messages = current_messages
    db.session.commit()

    return jsonify({"success": True, "messages": chat_session.messages})


@message_bp.route('/get_chat/<session_id>', methods=['GET'])
def get_chat(session_id):
    chat_session = ChatSession.query.get(session_id)

    if not chat_session:
        return jsonify({"error": "Session not found"}), 404

    return jsonify(chat_session.messages)
