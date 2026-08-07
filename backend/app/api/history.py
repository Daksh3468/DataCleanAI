"""
History API router for DataCleanAI.
GET /api/history - Returns past uploads and cleaning action audit logs.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.database.models import Upload, CleaningLog
from app.schemas.pydantic_models import (
    HistoryResponse,
    UploadSummaryResponse,
    UploadHistoryItem,
    CleaningLogItem,
    CleaningLogResponse,
)

router = APIRouter(tags=["History"])


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Returns history of past dataset uploads and executed data cleaning operations.
    """
    uploads = db.query(Upload).order_by(Upload.uploaded_at.desc()).limit(limit).all()
    cleaning_logs = db.query(CleaningLog).order_by(CleaningLog.timestamp.desc()).limit(limit).all()

    upload_summaries = [
        UploadSummaryResponse(
            upload_id=u.id,
            filename=u.filename,
            file_size=u.file_size or 0,
            row_count=u.row_count or 0,
            column_count=u.column_count or 0,
            uploaded_at=u.uploaded_at,
            message="Past upload record"
        )
        for u in uploads
    ]

    log_responses = [
        CleaningLogResponse(
            id=log.id,
            upload_id=log.upload_id,
            action=log.action,
            column_name=log.column_name,
            details=log.details,
            rows_affected=log.rows_affected,
            timestamp=log.timestamp
        )
        for log in cleaning_logs
    ]

    return HistoryResponse(
        uploads=upload_summaries,
        cleaning_logs=log_responses
    )


@router.get("/history/uploads", response_model=List[UploadHistoryItem])
async def get_upload_history(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Returns list of past upload records with associated cleaning log counts.
    """
    uploads = db.query(Upload).order_by(Upload.uploaded_at.desc()).limit(limit).all()
    
    result = []
    for u in uploads:
        logs_count = db.query(CleaningLog).filter(CleaningLog.upload_id == u.id).count()
        result.append(UploadHistoryItem(
            id=u.id,
            filename=u.filename,
            file_size=u.file_size or 0,
            row_count=u.row_count or 0,
            column_count=u.column_count or 0,
            uploaded_at=u.uploaded_at,
            logs_count=logs_count
        ))
    return result


@router.get("/history/{upload_id}/logs", response_model=List[CleaningLogItem])
async def get_cleaning_logs_by_upload(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns cleaning action audit logs for a specific upload_id.
    """
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail=f"Upload ID '{upload_id}' not found.")
        
    logs = db.query(CleaningLog).filter(CleaningLog.upload_id == upload_id).order_by(CleaningLog.timestamp.desc()).all()
    
    return [
        CleaningLogItem(
            id=l.id,
            upload_id=l.upload_id,
            action=l.action,
            column_name=l.column_name,
            details=l.details,
            rows_affected=l.rows_affected,
            timestamp=l.timestamp
        )
        for l in logs
    ]
