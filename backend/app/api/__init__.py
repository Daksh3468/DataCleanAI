"""
API package for DataCleanAI REST API routers.
"""
from app.api.upload import router as upload_router
from app.api.profile import router as profile_router
from app.api.quality import router as quality_router
from app.api.rules import router as rules_router
from app.api.clean import router as clean_router
from app.api.export import router as export_router
from app.api.history import router as history_router

__all__ = [
    "upload_router",
    "profile_router",
    "quality_router",
    "rules_router",
    "clean_router",
    "export_router",
    "history_router",
]
