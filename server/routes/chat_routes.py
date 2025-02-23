import chromadb
import fitz  # PyMuPDF
import re
from sentence_transformers import SentenceTransformer
from flask import Blueprint, request, jsonify
from services.chat_service import run_chat

# PDF file path
pdf_path = "2024-sa_cup_dteg_v1.1.3_10-22-24.pdf"

chat_bp = Blueprint("chat_bp", __name__)

# Init Model
embed_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Init ChromaDB
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="document_chunks")

def split_text_into_chunks(text, chunk_size=200):
    words = text.split()
    chunks = [" ".join(words[i : i + chunk_size]) for i in range(0, len(words), chunk_size)]
    return chunks

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text_chunks = []

    for page_num, page in enumerate(doc):
        text = page.get_text("text")
        if not text.strip():
            continue
        
        chunks = split_text_into_chunks(text, chunk_size=200)
        
        for chunk in chunks:
            text_chunks.append({"text": chunk, "page": page_num + 1})

    return text_chunks

def index_pdf():
    """Extracts text, generates embeddings, and stores in ChromaDB."""
    text_chunks = extract_text_from_pdf(pdf_path)

    for i, chunk in enumerate(text_chunks):
        embedding = embed_model.encode(chunk["text"]).tolist()
        collection.add(
            ids=[str(i)],
            documents=[chunk["text"]],
            embeddings=[embedding],
            metadatas=[{"page": chunk["page"]}],
        )
        #print(chunk)

def search_chroma(query, k=3):
    """Searches ChromaDB for relevant chunks."""
    results = collection.query(query_texts=[query], n_results=k)
    retrieved_texts = results["documents"][0] if results["documents"] else ["No relevant information found."]
    
    return retrieved_texts

@chat_bp.route("/chat", methods=["POST"])
def chat():
    """Chatbot with ChromaDB-enhanced retrieval."""
    data = request.json
    session_id = data.get("session_id")
    user_message = data.get("user_message", "")

    if not session_id:
        return jsonify({"error": "Session ID required"}), 400

    try:
        retrieved_docs = search_chroma(user_message, k=3)

        # Format LLM prompt
        context = "\n".join(retrieved_docs)
        prompt = f"Based on the document, answer the query: {user_message} \n\n Relevant Information: {context}"

        # Generate response
        ai_response = run_chat(session_id, prompt)

        return jsonify({"response": ai_response, "retrieved_docs": retrieved_docs})
    except Exception as e:
        return jsonify({"error": f"Chat failed: {str(e)}"}), 500

# Index the PDF on startup
index_pdf()

