from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from . import database
from .database import get_connection

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield


app = FastAPI(title="Image Database API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/images")
def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Tipo de arquivo não suportado. Envie JPEG, PNG, GIF, WebP ou SVG.",
        )
    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")
    with get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO images (filename, content_type, size, data) VALUES (?, ?, ?, ?)",
            (file.filename, file.content_type, len(data), data),
        )
        image_id = cursor.lastrowid
    return {"id": image_id, "filename": file.filename, "size": len(data)}


@app.get("/api/images")
def list_images():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, filename, content_type, size, uploaded_at "
            "FROM images ORDER BY id DESC"
        ).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/images/{image_id}/preview")
def preview_image(image_id: int):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT data, content_type FROM images WHERE id = ?", (image_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Imagem não encontrada.")
    return Response(content=row["data"], media_type=row["content_type"])
