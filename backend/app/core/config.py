"""
Configuration settings for DataCleanAI FastAPI Backend.
"""

import os
from pathlib import Path
from typing import List

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Application details
PROJECT_NAME: str = "DataCleanAI API"
VERSION: str = "1.0.0"
API_PREFIX: str = "/api"

# CORS configuration: Allow localhost dev servers (5173, 3000) and configurable env list
CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
env_cors = os.getenv("CORS_ORIGINS")
if env_cors:
    CORS_ORIGINS.extend([origin.strip() for origin in env_cors.split(",") if origin.strip()])

# 1 GB file size limit in bytes (1073741824 bytes = 1024 * 1024 * 1024)
MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", 1073741824))

# Load environment variables from .env and .env.example files
def _load_env_files():
    candidates = [
        BASE_DIR / ".env",
        BASE_DIR / ".env.example",
        BASE_DIR / "backend" / ".env",
        BASE_DIR / "backend" / ".env.example",
    ]
    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'").strip('"')
                            if k and not os.getenv(k):
                                os.environ[k] = v
            except Exception:
                pass

_load_env_files()

# Security & External API Keys
SECRET_KEY: str = os.getenv("SECRET_KEY", "datacleanai-secret-key-change-in-production")
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

# Database URL
DEFAULT_DB_PATH = BASE_DIR / "datacleanai.db"
DEFAULT_SQLITE_URL = f"sqlite:///{DEFAULT_DB_PATH}"

def get_database_url() -> str:
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return db_url
    
    pg_user = os.getenv("POSTGRES_USER")
    pg_pass = os.getenv("POSTGRES_PASSWORD")
    pg_host = os.getenv("POSTGRES_HOST", "localhost")
    pg_port = os.getenv("POSTGRES_PORT", "5432")
    pg_db = os.getenv("POSTGRES_DB", "datacleanai")

    if pg_user and pg_pass:
        return f"postgresql://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"
    
    return DEFAULT_SQLITE_URL

DATABASE_URL: str = get_database_url()

# Data store directory for persistent/session dataset storage
DATA_STORE_DIR: Path = BASE_DIR / "data_store"
DATA_STORE_DIR.mkdir(parents=True, exist_ok=True)


class Settings:
    PROJECT_NAME: str = PROJECT_NAME
    VERSION: str = VERSION
    API_PREFIX: str = API_PREFIX
    CORS_ORIGINS: List[str] = CORS_ORIGINS
    MAX_UPLOAD_SIZE: int = MAX_UPLOAD_SIZE
    SECRET_KEY: str = SECRET_KEY
    GROQ_API_KEY: str = GROQ_API_KEY
    DATABASE_URL: str = DATABASE_URL
    DATA_STORE_DIR: Path = DATA_STORE_DIR


settings = Settings()

