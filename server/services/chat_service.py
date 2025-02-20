from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain_community.chat_message_histories import SQLChatMessageHistory
from db.database import engine
from config.settings import model


def create_chat_chain(session_id):
    chat_history = SQLChatMessageHistory(
        session_id=session_id,
        connection=engine
    )

    memory = ConversationBufferMemory(
        chat_memory=chat_history,
        return_messages=True
    )

    conversation = ConversationChain(
        llm=model,
        memory=memory
    )

    return conversation


def run_chat(session_id, user_message):
    conversation = create_chat_chain(session_id)
    response = conversation.run(user_message)

    return response

