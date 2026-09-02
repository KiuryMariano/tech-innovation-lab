import json
import os
import re
from pathlib import Path

import cv2

BACKEND_DIR = Path(__file__).resolve().parent.parent
CACHE_DIR = BACKEND_DIR / "cache"
CACHE_DIR.mkdir(exist_ok=True)

MAX_DURATION_SEC = float(os.environ.get("YOLO_MAX_DURATION", "240"))
ANALYSIS_FPS = float(os.environ.get("YOLO_ANALYSIS_FPS", "5"))
CONF_THRESHOLD = float(os.environ.get("YOLO_CONF", "0.30"))
IMGSZ = int(os.environ.get("YOLO_IMGSZ", "512"))
MODEL_CANDIDATES = ["yolo11n.pt", "yolov8n.pt"]

ID_PATTERNS = [
    re.compile(r"youtube\.com/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})"),
    re.compile(r"youtu\.be/([A-Za-z0-9_-]{11})"),
    re.compile(r"youtube\.com/shorts/([A-Za-z0-9_-]{11})"),
    re.compile(r"youtube\.com/embed/([A-Za-z0-9_-]{11})"),
    re.compile(r"youtube\.com/live/([A-Za-z0-9_-]{11})"),
]


def parse_video_id(url: str) -> str | None:
    url = url.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url):
        return url
    for pattern in ID_PATTERNS:
        match = pattern.search(url)
        if match:
            return match.group(1)
    return None


def timeline_path(video_id: str) -> Path:
    return CACHE_DIR / f"{video_id}.timeline.json"


def load_cached_timeline(video_id: str) -> dict | None:
    path = timeline_path(video_id)
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def download_video(video_id: str, on_progress=None) -> Path:
    import yt_dlp

    target = CACHE_DIR / f"{video_id}.mp4"
    if target.exists():
        return target

    def hook(data):
        if data["status"] == "downloading" and on_progress:
            total = data.get("total_bytes") or data.get("total_bytes_estimate") or 0
            done = data.get("downloaded_bytes") or 0
            if total:
                on_progress(done / total)

    options = {
        "outtmpl": str(CACHE_DIR / f"{video_id}.%(ext)s"),
        # Sem ffmpeg no sistema: baixamos apenas o stream de vídeo (sem áudio),
        # pois a detecção não usa áudio e stream único dispensa merge.
        # H.264 (avc1) garante decodificação pelo OpenCV embutido; VP9/AV1 não são suportados.
        "format": "bv*[height<=720][vcodec^=avc1]/bv*[height<=1080][vcodec^=avc1]/bv*/b[ext=mp4]/b",
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "progress_hooks": [hook],
    }
    with yt_dlp.YoutubeDL(options) as ydl:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=True)
        filepath = None
        for entry in info.get("requested_downloads") or []:
            filepath = entry.get("filepath")
            break
    if filepath and Path(filepath).exists():
        return Path(filepath)
    if target.exists():
        return target
    raise RuntimeError("Download concluído mas arquivo não encontrado.")


def resolve_model():
    from ultralytics import YOLO

    import torch

    device = "cuda" if torch.cuda.is_available() else "cpu"
    errors = []
    for candidate in MODEL_CANDIDATES:
        local = BACKEND_DIR / candidate
        try:
            source = str(local) if local.exists() else candidate
            return YOLO(source), candidate, device
        except Exception as exc:  # noqa: BLE001 - tentamos o próximo candidato
            errors.append(f"{candidate}: {exc}")
    raise RuntimeError("Nenhum modelo YOLO disponível: " + "; ".join(errors))


def analyze_video(video_path: Path, job_update) -> dict:
    model, model_name, device = resolve_model()

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise RuntimeError("Não foi possível abrir o vídeo baixado.")

    fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    stride = max(1, round(fps / ANALYSIS_FPS))

    frames = []
    index = 0
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        t_sec = index / fps
        process_this = index % stride == 0
        if t_sec > MAX_DURATION_SEC:
            break
        if process_this:
            result = model.predict(
                frame, conf=CONF_THRESHOLD, imgsz=IMGSZ, device=device, verbose=False
            )[0]
            detections = []
            names = result.names
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append(
                    {
                        "label": names[int(box.cls[0])],
                        "confidence": round(float(box.conf[0]), 3),
                        "bbox": [
                            round(x1 / width, 4),
                            round(y1 / height, 4),
                            round((x2 - x1) / width, 4),
                            round((y2 - y1) / height, 4),
                        ],
                    }
                )
            frames.append({"t": round(t_sec * 1000), "d": detections})
            if job_update:
                share = min(t_sec / MAX_DURATION_SEC, 1.0)
                job_update(analysis_share=share, phase="analyzing")
        index += 1
    capture.release()

    analyzed_duration = min(index / fps, MAX_DURATION_SEC)
    counts: dict[str, int] = {}
    for frame in frames:
        for det in frame["d"]:
            counts[det["label"]] = counts.get(det["label"], 0) + 1

    return {
        "model": f"{model_name} ({device})",
        "analysisFps": ANALYSIS_FPS,
        "durationSec": round(analyzed_duration, 2),
        "frameSize": [width, height],
        "truncated": index / fps > analyzed_duration + 0.01,
        "counts": counts,
        "frames": frames,
    }
