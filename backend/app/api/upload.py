"""
Upload API router for DataCleanAI.
POST /api/upload - Accepts multipart file upload up to 1GB, parses dataset, saves to DB & dataset store.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session
import io
import pandas as pd

from app.core.config import MAX_UPLOAD_SIZE
from app.database.connection import get_db
from app.database.models import Upload
from app.schemas.pydantic_models import UploadSummaryResponse
from app.services.file_validator import validate_file, read_dataset
from app.services.dataset_store import dataset_store

router = APIRouter(tags=["Upload"])


@router.post("/upload", response_model=UploadSummaryResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts multipart file upload (CSV, Excel, JSON) up to 1GB limit.
    Parses the dataset, stores metadata in DB, persists working dataset in data_store,
    and returns dataset summary with upload_id.
    """
    filename = file.filename or "uploaded_file"
    
    # Read file content into bytes
    content = await file.read()
    file_size = len(content)

    if file_size > MAX_UPLOAD_SIZE:
        max_gb = MAX_UPLOAD_SIZE / (1024 * 1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size / (1024*1024):.2f} MB) exceeds maximum allowed limit of {max_gb:.1f} GB."
        )

    # Wrap content in BytesIO for validation and reading
    file_obj = io.BytesIO(content)
    file_obj.name = filename

    # Validate file format and size
    val_res = validate_file(file_obj, max_size_mb=MAX_UPLOAD_SIZE / (1024 * 1024))
    if not val_res.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=val_res.error_message or "File validation failed."
        )

    # Read into pandas DataFrame
    file_obj.seek(0)
    try:
        df = read_dataset(file_obj, encoding=val_res.get("encoding"))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse uploaded dataset file: {str(e)}"
        )

    if df is None or not isinstance(df, pd.DataFrame):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Parsed dataset is empty or invalid."
        )

    row_count = len(df)
    col_count = len(df.columns)

    # Create DB entry
    db_upload = Upload(
        filename=filename,
        file_path="",
        file_size=file_size,
        row_count=row_count,
        column_count=col_count
    )
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)

    # Save to disk dataset store for session/API queries
    dataset_store.save_dataset(db_upload.id, df, is_original=True)

    # Update file_path in DB
    db_upload.file_path = str(dataset_store._get_path(db_upload.id, "current"))
    db.commit()

    return UploadSummaryResponse(
        upload_id=db_upload.id,
        filename=db_upload.filename,
        file_size=db_upload.file_size,
        row_count=db_upload.row_count,
        column_count=db_upload.column_count,
        columns=df.columns.tolist(),
        uploaded_at=db_upload.uploaded_at,
        message="Dataset uploaded and parsed successfully."
    )
