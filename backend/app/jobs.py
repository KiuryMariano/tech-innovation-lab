import threading
import uuid
from pathlib import Path

from . import pipeline

_LOCK = threading.Lock()
_JOBS: dict[str, dict] = {}


def _set(job_id: str, **fields) -> None:
    with _LOCK:
        _JOBS[job_id].update(fields)


def get_job(job_id: str) -> dict | None:
    with _LOCK:
        job = _JOBS.get(job_id)
        return dict(job) if job else None


def _worker(job_id: str, video_id: str, url: str) -> None:
    try:
        def download_progress(share: float) -> None:
            _set(job_id, progress=round(share * 45.0, 1))

        def analysis_progress(**kwargs):
            share = kwargs.get("analysis_share", 0.0)
            phase = kwargs.get("phase")
            fields: dict = {"progress": round(45.0 + share * 55.0, 1)}
            if phase:
                fields["phase"] = phase
            _set(job_id, **fields)

        video_path = pipeline.download_video(video_id, on_progress=download_progress)
        _set(job_id, phase="analyzing", progress=45.0)
        timeline = pipeline.analyze_video(video_path, analysis_progress)

        out = pipeline.timeline_path(video_id)
        with open(out, "w", encoding="utf-8") as fh:
            import json

            json.dump(timeline, fh, ensure_ascii=False)

        try:
            video_path.unlink()
        except OSError:
            pass

        _set(
            job_id,
            phase="done",
            progress=100.0,
            model=timeline["model"],
            durationSec=timeline["durationSec"],
            detRate=timeline["analysisFps"],
        )
    except Exception as exc:  # noqa: BLE001 - refletimos o erro no status do job
        _set(job_id, phase="error", error=str(exc))


def start_job(url: str) -> dict | None:
    video_id = pipeline.parse_video_id(url)
    if not video_id:
        return None

    cached = pipeline.load_cached_timeline(video_id)
    if cached:
        job_id = uuid.uuid4().hex
        with _LOCK:
            _JOBS[job_id] = {
                "jobId": job_id,
                "videoId": video_id,
                "phase": "done",
                "progress": 100.0,
                "model": cached.get("model"),
                "durationSec": cached.get("durationSec"),
                "detRate": cached.get("analysisFps"),
                "cached": True,
            }
        return get_job(job_id)

    job_id = uuid.uuid4().hex
    with _LOCK:
        _JOBS[job_id] = {
            "jobId": job_id,
            "videoId": video_id,
            "phase": "downloading",
            "progress": 0.0,
        }
    thread = threading.Thread(target=_worker, args=(job_id, video_id, url), daemon=True)
    thread.start()
    return get_job(job_id)


def load_timeline(video_id: str) -> dict | None:
    return pipeline.load_cached_timeline(video_id)
