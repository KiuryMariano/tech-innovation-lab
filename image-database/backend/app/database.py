import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "images.db"


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                content_type TEXT NOT NULL,
                size INTEGER NOT NULL,
                data BLOB NOT NULL,
                uploaded_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            )
            """
        )
