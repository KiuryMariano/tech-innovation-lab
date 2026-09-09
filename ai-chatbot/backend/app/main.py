import os
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import database

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

AI_API_KEY = os.environ.get("AI_API_KEY", "")
AI_MODEL = os.environ.get("AI_MODEL", "glm-4.5-flash")
AI_BASE_URL = os.environ.get("AI_BASE_URL", "https://api.z.ai/api/paas/v4")
AI_CHAT_URL = f"{AI_BASE_URL.rstrip('/')}/chat/completions"
REQUEST_TIMEOUT_SEC = 60.0
TITLE_MAX_CHARS = 60

SYSTEM_PROMPT = (
    "Você é o assistente do Tech Innovation Lab, um projeto de atividades da disciplina. "
    "Responda sempre em português do Brasil, de forma clara, objetiva e amigável."
)


def truncate_title(text: str) -> str:
    if len(text) <= TITLE_MAX_CHARS:
        return text
    return text[:TITLE_MAX_CHARS] + "…"


def require_conversation(connection: sqlite3.Connection, conversation_id: int) -> None:
    conversation = connection.execute(
        "SELECT id FROM conversations WHERE id = ?", (conversation_id,)
    ).fetchone()
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield


app = FastAPI(title="AI Chatbot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class SendMessageRequest(BaseModel):
    conversationId: int | None = None
    content: str


class RenameConversationRequest(BaseModel):
    title: str


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/chat/conversations")
def list_conversations():
    with database.get_connection() as connection:
        rows = connection.execute(
            "SELECT id, title, created_at, updated_at "
            "FROM conversations ORDER BY updated_at DESC, id DESC"
        ).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/chat/conversations/{conversation_id}/messages")
def list_messages(conversation_id: int):
    with database.get_connection() as connection:
        require_conversation(connection, conversation_id)
        rows = connection.execute(
            "SELECT id, role, content, created_at "
            "FROM messages WHERE conversation_id = ? ORDER BY id",
            (conversation_id,),
        ).fetchall()
    return [dict(row) for row in rows]


@app.patch("/api/chat/conversations/{conversation_id}")
def rename_conversation(conversation_id: int, request: RenameConversationRequest):
    title = request.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="O título não pode ficar vazio.")

    with database.get_connection() as connection:
        require_conversation(connection, conversation_id)
        connection.execute(
            "UPDATE conversations SET title = ? WHERE id = ?",
            (truncate_title(title), conversation_id),
        )
    return {"id": conversation_id, "title": truncate_title(title)}


@app.delete("/api/chat/conversations/{conversation_id}")
def delete_conversation(conversation_id: int):
    with database.get_connection() as connection:
        require_conversation(connection, conversation_id)
        connection.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    return {"status": "ok"}


@app.post("/api/chat/messages")
def send_message(request: SendMessageRequest):
    content = request.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="A mensagem está vazia. Escreva algo antes de enviar.")
    if not AI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="A API de IA não está configurada. Defina a variável de ambiente AI_API_KEY.",
        )

    with database.get_connection() as connection:
        if request.conversationId is None:
            cursor = connection.execute(
                "INSERT INTO conversations (title) VALUES (?)", (truncate_title(content),)
            )
            conversation_id = cursor.lastrowid
        else:
            conversation_id = request.conversationId
            require_conversation(connection, conversation_id)
            database.touch_conversation(connection, conversation_id)

        connection.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)",
            (conversation_id, content),
        )
        history_rows = connection.execute(
            "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id",
            (conversation_id,),
        ).fetchall()

    payload = {
        "model": AI_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            *[{"role": row["role"], "content": row["content"]} for row in history_rows],
        ],
        "temperature": 0.7,
    }

    try:
        response = requests.post(
            AI_CHAT_URL,
            json=payload,
            headers={"Authorization": f"Bearer {AI_API_KEY}"},
            timeout=REQUEST_TIMEOUT_SEC,
        )
    except requests.exceptions.Timeout as exc:
        raise HTTPException(
            status_code=502,
            detail="A API de IA demorou demais para responder. Tente novamente.",
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Não foi possível falar com a API de IA: {exc}",
        ) from exc

    if not response.ok:
        try:
            reason = response.json().get("error", {}).get("message", "")
        except ValueError:
            reason = ""
        detail = f"A API de IA rejeitou a solicitação (HTTP {response.status_code})."
        if reason:
            detail += f" Motivo: {reason}"
        raise HTTPException(status_code=502, detail=detail)

    body = response.json()
    try:
        reply = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise HTTPException(
            status_code=502, detail="A API de IA devolveu uma resposta inesperada."
        ) from exc

    with database.get_connection() as connection:
        connection.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
            (conversation_id, reply),
        )
        database.touch_conversation(connection, conversation_id)

    return {"conversationId": conversation_id, "reply": reply, "model": body.get("model", AI_MODEL)}
