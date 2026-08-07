"""
Profile API router for DataCleanAI.
GET /api/dataset/{upload_id}/profile - Returns dataset summary, column statistics, and sample rows.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
import pandas as pd
import json

from app.database.connection import get_db
from app.database.models import Upload
from app.schemas.pydantic_models import DatasetProfileResponse, ColumnProfile
from app.services.profiler import profile_dataset, _make_serializable
from app.services.dataset_store import dataset_store

router = APIRouter(tags=["Profile"])


def _clean_sample_rows(df: pd.DataFrame, limit: int = 10):
    """Converts DataFrame sample rows to JSON-serializable list of dicts."""
    sample_df = df.head(limit)
    records = []
    for _, row in sample_df.iterrows():
        cleaned_row = {}
        for col, val in row.items():
            cleaned_row[str(col)] = _make_serializable(val)
        records.append(cleaned_row)
    return records


@router.get("/dataset/{upload_id}/profile", response_model=DatasetProfileResponse)
async def get_dataset_profile(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """
    Returns dataset profile including row count, column count, memory usage,
    column-level statistics (min, max, mean, std, median, missing, unique), and sample rows.
    """
    db_upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not db_upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload record with id {upload_id} not found."
        )

    try:
        df = dataset_store.get_dataset(upload_id, original=False)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset file for upload_id {upload_id} not found in store."
        )

    profile_data = profile_dataset(df)
    sample_rows = _clean_sample_rows(df, limit=10)

    # Convert columns dict to ColumnProfile Pydantic schema objects
    columns_dict = {}
    for col_name, cstats in profile_data.get("columns", {}).items():
        columns_dict[col_name] = ColumnProfile(
            name=cstats["name"],
            dtype=cstats["dtype"],
            missing_count=cstats["missing_count"],
            missing_pct=cstats["missing_pct"],
            unique_count=cstats["unique_count"],
            sample_values=cstats["sample_values"],
            min=cstats["min"],
            max=cstats["max"],
            mean=cstats["mean"],
            std=cstats["std"],
            median=cstats["median"]
        )

    return DatasetProfileResponse(
        upload_id=upload_id,
        filename=db_upload.filename,
        row_count=profile_data["row_count"],
        col_count=profile_data["col_count"],
        memory_bytes=profile_data["memory_bytes"],
        memory_usage=profile_data["memory_usage"],
        columns=columns_dict,
        sample_rows=sample_rows
    )
