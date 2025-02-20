from flask import Blueprint, request, jsonify
from services.chat_service import run_chat

chat_bp = Blueprint('chat_bp', __name__)


@chat_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    session_id = data.get("session_id")
    user_message = data.get("user_message", "")

    if not session_id:
        return jsonify({"error": "Session ID required"}), 400

    try:
        ai_response = run_chat(session_id, user_message)
        return jsonify({"response": ai_response})
    except Exception as e:
        return jsonify({"error": f"Chat failed: {str(e)}"}), 500
