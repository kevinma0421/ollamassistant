import os
import ollama
import uuid

from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_json import mutable_json_type
from sqlalchemy.dialects.postgresql import JSONB


# load secret keys
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')


# setup Flask/CORS
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# POSTGRE SQL configuration
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
db = SQLAlchemy(app)

class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'

    session_id = db.Column(db.String(36), primary_key=True)
    messages = db.Column(mutable_json_type(dbtype=JSONB, nested=True), nullable=False, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# set LLM model
model = OllamaLLM(model="deepseek-r1:7b")

@app.route('/')
def home():
    return 'Hello, PostgreSQL is connected!'

# sessionID creation/calling
@app.route('/latest_session', methods=['GET'])
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

@app.route('/new_session', methods=['POST'])
def new_session():
    session_id = str(uuid.uuid4())

    new_session = ChatSession(
        session_id=session_id,
        messages=[]
    )

    db.session.add(new_session)
    db.session.commit()

    return jsonify({
        "session_id": new_session.session_id,
        "messages": new_session.messages,
        "created_at": new_session.created_at.isoformat()
    })

# store user and AI messages in database
@app.route('/append_message', methods=['POST'])
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
    print("Before:", chat_session.messages)

    current_messages.append({"user": user_message, "ai": ai_message})

    print("After:", chat_session.messages)

    db.session.commit()

    return jsonify({"success": True, "messages": chat_session.messages})



# fetch chat history
@app.route('/get_chat/<session_id>', methods=['GET'])
def get_chat(session_id):
    chat_session = ChatSession.query.get(session_id)

    if not chat_session:
        return jsonify({"error": "Session not found"}), 404

    return jsonify(chat_session.messages)



@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    sessionID = data.get("session_id")
    user_message = data.get("message", "")
    #response = model.invoke(user_message)

    #dummy response
    response = "session ID is: " + str(sessionID)
    return jsonify({"response": response})
    #return response, 200, {"Content-Type": "text/markdown; charset=utf-8"}

#@app.route('/chat', methods=['POST'])
#def chat():
#    data = request.json
#    user_message = data.get("message", "")
#
#    response = ollama.chat(
#        model="deepseek-r1:7b",
#        messages=[{"role": "user", "content": user_message}]
#    )

#    return jsonify({"response": response["message"]["content"]})

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
