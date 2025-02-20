from flask import Flask
from flask_cors import CORS
from db.database import db
from routes.session_routes import session_bp
from routes.message_routes import message_bp
from routes.chat_routes import chat_bp
from dotenv import load_dotenv
from sqlalchemy import create_engine

import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL


engine = create_engine(DATABASE_URL)
db.init_app(app)

app.register_blueprint(session_bp)
app.register_blueprint(message_bp)
app.register_blueprint(chat_bp)

@app.route('/')
def home():
    return 'Hello, PostgreSQL is connected!'

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
