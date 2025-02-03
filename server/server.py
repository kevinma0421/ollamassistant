from flask import Flask, request, jsonify
from flask_cors import CORS

import ollama
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message", "")

    response = ollama.chat(
        model="deepseek-r1:7b",
        messages=[{"role": "user", "content": user_message}]
    )

    return jsonify({"response": response["message"]["content"]})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
