from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM

import ollama
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

model = OllamaLLM(model="deepseek-r1:7b")

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message", "")
    response = model.invoke(user_message)

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

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
