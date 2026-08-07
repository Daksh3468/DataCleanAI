"""
Quality API router for DataCleanAI.
GET /api/dataset/{upload_id}/quality - Returns 4D quality scores (completeness, validity, uniqueness, consistency + per-column scores).
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Upload
from app.schemas.pydantic_models import QualityScoreResponse, DimensionScores, ColumnQualityScore
from app.services.quality_scorer import calculate_quality_scores
from app.services.dataset_store import dataset_store

router = APIRouter(tags=["Quality Scores"])


@router.get("/dataset/{upload_id}/quality", response_model=QualityScoreResponse)
async def get_dataset_quality(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """
    Computes and returns overall quality score, 4 core dimension scores
    (completeness, validity, uniqueness, consistency), and per-column quality metrics.
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

    quality_data = calculate_quality_scores(df)

    dims = quality_data.get("dimensions", {})
    dimension_scores = DimensionScores(
        completeness=dims.get("completeness", 100.0),
        validity=dims.get("validity", 100.0),
        uniqueness=dims.get("uniqueness", 100.0),
        consistency=dims.get("consistency", 100.0),
    )

    column_scores = {}
    for col_name, col_data in quality_data.get("column_scores", {}).items():
        column_scores[col_name] = ColumnQualityScore(
            completeness=col_data.get("completeness", 100.0),
            validity=col_data.get("validity", 100.0),
            uniqueness=col_data.get("uniqueness", 100.0),
            consistency=col_data.get("consistency", 100.0),
            overall=col_data.get("overall", 100.0),
        )

    return QualityScoreResponse(
        upload_id=upload_id,
        overall_score=quality_data.get("overall_score", 100.0),
        dimensions=dimension_scores,
        column_scores=column_scores
    )
