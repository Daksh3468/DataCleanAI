"""
Database connection setup and table initialization helper for DataCleanAI FastAPI backend.
Handles PostgreSQL connection with automatic graceful fallback to SQLite.
"""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, scoped_session
from app.core.config import DATABASE_URL, DEFAULT_SQLITE_URL
from app.database.models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database.connection")


def create_db_engine():
    """
    Creates and tests a SQLAlchemy engine.
    Falls back gracefully to SQLite if PostgreSQL connection fails.
    """
    target_url = DATABASE_URL
    
    if target_url.startswith("sqlite"):
        logger.info(f"Connecting to SQLite database at {target_url}")
        return create_engine(target_url, connect_args={"check_same_thread": False})
    
    try:
        logger.info("Attempting connection to primary database...")
        engine_obj = create_engine(target_url, pool_pre_ping=True)
        with engine_obj.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to primary database.")
        return engine_obj
    except Exception as e:
        logger.warning(
            f"Failed to connect to primary database using '{target_url}': {e}. "
            f"Falling back gracefully to SQLite at '{DEFAULT_SQLITE_URL}'."
        )
        return create_engine(DEFAULT_SQLITE_URL, connect_args={"check_same_thread": False})


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db_session = scoped_session(SessionLocal)


def get_db():
    """
    FastAPI dependency for acquiring a database session per request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database schema by creating all defined tables.
    If initialization against the active engine fails, retries with SQLite fallback.
    """
    global engine, SessionLocal, db_session
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.warning(f"Error initializing database: {e}. Retrying with SQLite database fallback.")
        engine = create_engine(DEFAULT_SQLITE_URL, connect_args={"check_same_thread": False})
        SessionLocal.configure(bind=engine)
        db_session = scoped_session(SessionLocal)
        Base.metadata.create_all(bind=engine)
        logger.info("SQLite database fallback initialized successfully.")
