import os
from dotenv import load_dotenv
from langchain_ollama.llms import OllamaLLM

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

#model = OllamaLLM(model="deepseek-r1:7b")
model = OllamaLLM(model="qwen2.5-coder:latest")