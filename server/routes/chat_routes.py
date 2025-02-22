import faiss
import numpy as np
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer
from flask import Blueprint, request, jsonify
from services.chat_service import run_chat

# PDF file path (directly given)
pdf_path = "2024-sa_cup_dteg_v1.1.3_10-22-24.pdf"

chat_bp = Blueprint('chat_bp', __name__)
embed_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# FAISS Index Initialization
dimension = 384  # Same as MiniLM embedding size
index = faiss.IndexFlatL2(dimension)
pdf_text_chunks = []  # Stores extracted text for retrieval


def extract_text_from_pdf(pdf_path):
    """Extract text from the given PDF and split into chunks"""
    doc = fitz.open(pdf_path)
    text_chunks = []
    for page in doc:
        text = page.get_text("text")
        if text.strip():  # Skip empty pages
            text_chunks.append(text)
    return text_chunks


def index_pdf():
    """Extract text, generate embeddings, and store in FAISS"""
    global index, pdf_text_chunks
    pdf_text_chunks = extract_text_from_pdf(pdf_path)
    
    # Convert text chunks to embeddings
    embeddings = embed_model.encode(pdf_text_chunks)
    index.add(np.array(embeddings).astype("float32"))
    print(f"Indexed {len(pdf_text_chunks)} chunks from PDF.")


def search_faiss(query, k=2):
    """Search FAISS index and return relevant text chunks"""
    if index.ntotal == 0:
        return ["No documents indexed yet."]
    
    query_embedding = embed_model.encode([query]).astype("float32")
    distances, indices = index.search(query_embedding, k)

    retrieved_texts = [pdf_text_chunks[i] for i in indices[0]]
    return retrieved_texts


@chat_bp.route('/chat', methods=['POST'])
def chat():
    """Chatbot with FAISS-enhanced retrieval"""
    data = request.json
    session_id = data.get("session_id")
    user_message = data.get("user_message", "")

    if not session_id:
        return jsonify({"error": "Session ID required"}), 400

    try:
        # Search FAISS for relevant context
        retrieved_docs = search_faiss(user_message, k=2)

        # Format prompt for LLM
        context = " ".join(retrieved_docs)
        prompt = f"Based on the following information, answer the query: {user_message} \n\n Context: {context}"

        # Generate response using LLM
        ai_response = run_chat(session_id, prompt)

        return jsonify({"response": ai_response, "retrieved_docs": retrieved_docs})
    except Exception as e:
        return jsonify({"error": f"Chat failed: {str(e)}"}), 500


# Index the PDF on startup
index_pdf()
