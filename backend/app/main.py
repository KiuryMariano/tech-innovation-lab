from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import jobs

app = FastAPI(title="YOLO Video Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    url: str


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest):
    job = jobs.start_job(request.url)
    if job is None:
        raise HTTPException(status_code=422, detail="URL do YouTube inválida.")
    return job


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str):
    job = jobs.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job não encontrado.")
    return job


@app.get("/api/jobs/{job_id}/timeline")
def job_timeline(job_id: str):
    job = jobs.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job não encontrado.")
    if job["phase"] != "done":
        raise HTTPException(status_code=409, detail="Análise ainda não concluída.")
    timeline = jobs.load_timeline(job["videoId"])
    if timeline is None:
        raise HTTPException(status_code=404, detail="Timeline não encontrada.")
    return timeline


@app.get("/api/health")
def health():
    return {"status": "ok"}
