"""
Clean API router for DataCleanAI.
POST /api/dataset/{upload_id}/clean - Applies cleaning transformations, updates dataset in store, logs to DB, and returns before/after summary.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
import pandas as pd

from app.database.connection import get_db
from app.database.models import Upload, CleaningLog
from app.schemas.pydantic_models import (
    CleaningOptionsRequest,
    CleaningResponse,
    ChangelogItem,
)
from app.services.cleaner import clean_dataset
from app.services.quality_scorer import calculate_quality_scores
from app.services.profiler import _make_serializable
from app.services.dataset_store import dataset_store

router = APIRouter(tags=["Cleaning"])


def _clean_sample_rows(df: pd.DataFrame, limit: int = 10):
    sample_df = df.head(limit)
    records = []
    for _, row in sample_df.iterrows():
        cleaned_row = {}
        for col, val in row.items():
            cleaned_row[str(col)] = _make_serializable(val)
        records.append(cleaned_row)
    return records


@router.post("/dataset/{upload_id}/clean", response_model=CleaningResponse)
async def clean_dataset_endpoint(
    upload_id: int,
    options: CleaningOptionsRequest,
    db: Session = Depends(get_db)
):
    """
    Applies configurable cleaning transformations (remove duplicates, handle missing values,
    trim whitespace, convert data types, remove outliers) to the dataset.
    Logs each action to DB, persists updated working dataset, and returns before/after metrics.
    """
    db_upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not db_upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload record with id {upload_id} not found."
        )

    try:
        df_original = dataset_store.get_dataset(upload_id, original=False)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset file for upload_id {upload_id} not found in store."
        )

    orig_row_count = len(df_original)
    orig_col_count = len(df_original.columns)

    # Compute original quality score
    orig_quality_data = calculate_quality_scores(df_original)
    orig_quality_score = orig_quality_data.get("overall_score", 100.0)

    # Convert request options Pydantic model to dict
    config = options.model_dump()

    # Apply cleaning transformations
    cleaned_df, changelog = clean_dataset(df_original, config)

    cleaned_row_count = len(cleaned_df)
    cleaned_col_count = len(cleaned_df.columns)

    # Compute cleaned quality score
    cleaned_quality_data = calculate_quality_scores(cleaned_df)
    cleaned_quality_score = cleaned_quality_data.get("overall_score", 100.0)

    # Update working copy in dataset store
    dataset_store.update_dataset(upload_id, cleaned_df)

    # Update DB upload metrics
    db_upload.row_count = cleaned_row_count
    db_upload.column_count = cleaned_col_count

    # Log actions to DB
    changelog_items = []
    for item in changelog:
        c_log = CleaningLog(
            upload_id=upload_id,
            action=item["action"],
            column_name=item.get("column_name", ""),
            details=item.get("details", ""),
            rows_affected=item.get("rows_affected", 0)
        )
        db.add(c_log)
        changelog_items.append(
            ChangelogItem(
                action=item["action"],
                column_name=item.get("column_name"),
                details=item.get("details", ""),
                rows_affected=item.get("rows_affected", 0)
            )
        )

    db.commit()

    sample_rows = _clean_sample_rows(cleaned_df, limit=10)

    return CleaningResponse(
        upload_id=upload_id,
        original_row_count=orig_row_count,
        original_col_count=orig_col_count,
        cleaned_row_count=cleaned_row_count,
        cleaned_col_count=cleaned_col_count,
        original_quality_score=orig_quality_score,
        cleaned_quality_score=cleaned_quality_score,
        changelog=changelog_items,
        sample_rows=sample_rows
    )
