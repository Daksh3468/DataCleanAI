"""
DataCleanAI — FastAPI Production Backend Application.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.connection import init_db
from app.api import upload, profile, quality, rules, clean, export, history, ai, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database tables on application startup."""
    try:
        init_db()
    except Exception as e:
        print(f"[Warning] Database initialization notice: {e}")
    yield


app = FastAPI(
    title="DataCleanAI API",
    description="Production Data Quality Assessment & Cleaning REST API Engine",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware (allowing React Vite dev server & production domains)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api prefix
app.include_router(upload.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(quality.router, prefix="/api")
app.include_router(rules.router, prefix="/api")
app.include_router(clean.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "DataCleanAI API",
        "app": "DataCleanAI API",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "DataCleanAI Engine"}
