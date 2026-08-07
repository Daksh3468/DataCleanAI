"""
Machine Learning & AI REST API Router for DataCleanAI.
Endpoints for anomaly detection, KNN imputation, MICE imputation,
fuzzy duplicate clustering, and semantic data type classification.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
import pandas as pd

from app.database.connection import get_db
from app.database.models import Upload, CleaningLog
from app.schemas.pydantic_models import (
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
    ImputeKNNRequest,
    ImputeKNNResponse,
    ImputeMICERequest,
    ImputeMICEResponse,
    FuzzyDedupRequest,
    FuzzyDedupResponse,
    FuzzyClusterItem,
    SemanticTypeResponse,
    SemanticTypeItem,
)
from app.services.dataset_store import dataset_store
from app.services.profiler import _make_serializable
from app.services.ai_engine import (
    detect_anomalies_isolation_forest,
    impute_knn,
    impute_mice,
    detect_fuzzy_duplicates,
    classify_semantic_types,
)

router = APIRouter(tags=["AI Engine"])


def _extract_sample_rows(df: pd.DataFrame, limit: int = 10) -> List[Dict[str, Any]]:
    """Helper function to return JSON-serializable sample rows from DataFrame."""
    sample_df = df.head(limit)
    records = []
    for _, row in sample_df.iterrows():
        cleaned_row = {}
        for col, val in row.items():
            cleaned_row[str(col)] = _make_serializable(val)
        records.append(cleaned_row)
    return records


@router.post("/dataset/{upload_id}/ai/detect-anomalies", response_model=AnomalyDetectionResponse)
async def detect_anomalies_endpoint(
    upload_id: int,
    request: AnomalyDetectionRequest,
    db: Session = Depends(get_db)
):
    """
    Detects multivariate numerical anomalies in dataset using Isolation Forest.
    Optionally removes identified outlier rows if auto_remove is True.
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

    anomaly_report = detect_anomalies_isolation_forest(
        df=df,
        contamination=request.contamination,
        n_estimators=request.n_estimators,
        columns=request.columns
    )

    outlier_indices = anomaly_report["outlier_indices"]
    msg = f"Detected {anomaly_report['anomalies_count']} outliers out of {len(df)} rows."

    # If auto_remove is requested, remove outliers and update dataset store
    if request.auto_remove and outlier_indices:
        df_cleaned = df.drop(index=outlier_indices).reset_index(drop=True)
        dataset_store.update_dataset(upload_id, df_cleaned)

        db_upload.row_count = len(df_cleaned)

        # Log action in database
        c_log = CleaningLog(
            upload_id=upload_id,
            action="AI Anomaly Removal",
            column_name="Multi-Column",
            details=f"Removed {len(outlier_indices)} anomaly rows detected via Isolation Forest (contamination={request.contamination})",
            rows_affected=len(outlier_indices)
        )
        db.add(c_log)
        db.commit()

        msg += f" Automatically removed {len(outlier_indices)} outlier rows from active dataset."

    return AnomalyDetectionResponse(
        upload_id=upload_id,
        total_rows=anomaly_report["total_rows"],
        anomalies_count=anomaly_report["anomalies_count"],
        anomaly_pct=anomaly_report["anomaly_pct"],
        outlier_indices=outlier_indices,
        anomaly_scores=anomaly_report["anomaly_scores"],
        evaluated_columns=anomaly_report["evaluated_columns"],
        message=msg
    )


@router.post("/dataset/{upload_id}/ai/impute-knn", response_model=ImputeKNNResponse)
async def impute_knn_endpoint(
    upload_id: int,
    request: ImputeKNNRequest,
    db: Session = Depends(get_db)
):
    """
    Imputes missing values in numerical columns using KNN (k-Nearest Neighbors) algorithm.
    Saves updated dataset back to store if apply_to_dataset is True.
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

    df_imputed, imputed_cols, total_imputed = impute_knn(
        df=df,
        n_neighbors=request.n_neighbors,
        cols=request.columns
    )

    msg = f"KNN Imputation completed. Imputed {total_imputed} missing cells across {len(imputed_cols)} columns."

    if request.apply_to_dataset and total_imputed > 0:
        dataset_store.update_dataset(upload_id, df_imputed)

        c_log = CleaningLog(
            upload_id=upload_id,
            action="AI KNN Imputation",
            column_name=", ".join(imputed_cols),
            details=f"Imputed {total_imputed} cells using KNNImputer (k={request.n_neighbors})",
            rows_affected=total_imputed
        )
        db.add(c_log)
        db.commit()

        msg += " Updated active dataset."

    sample_rows = _extract_sample_rows(df_imputed, limit=10)

    return ImputeKNNResponse(
        upload_id=upload_id,
        imputed_cols=imputed_cols,
        imputed_cells_count=total_imputed,
        message=msg,
        sample_rows=sample_rows
    )


@router.post("/dataset/{upload_id}/ai/impute-mice", response_model=ImputeMICEResponse)
async def impute_mice_endpoint(
    upload_id: int,
    request: ImputeMICERequest,
    db: Session = Depends(get_db)
):
    """
    Imputes missing values using MICE (Multivariate Imputation by Chained Equations / IterativeImputer).
    Saves updated dataset back to store if apply_to_dataset is True.
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

    df_imputed, imputed_cols, total_imputed = impute_mice(
        df=df,
        max_iter=request.max_iter,
        cols=request.columns
    )

    msg = f"MICE Iterative Imputation completed. Imputed {total_imputed} missing cells across {len(imputed_cols)} columns."

    if request.apply_to_dataset and total_imputed > 0:
        dataset_store.update_dataset(upload_id, df_imputed)

        c_log = CleaningLog(
            upload_id=upload_id,
            action="AI MICE Imputation",
            column_name=", ".join(imputed_cols),
            details=f"Imputed {total_imputed} cells using IterativeImputer (max_iter={request.max_iter})",
            rows_affected=total_imputed
        )
        db.add(c_log)
        db.commit()

        msg += " Updated active dataset."

    sample_rows = _extract_sample_rows(df_imputed, limit=10)

    return ImputeMICEResponse(
        upload_id=upload_id,
        imputed_cols=imputed_cols,
        imputed_cells_count=total_imputed,
        message=msg,
        sample_rows=sample_rows
    )


@router.post("/dataset/{upload_id}/ai/fuzzy-dedup", response_model=FuzzyDedupResponse)
async def fuzzy_dedup_endpoint(
    upload_id: int,
    request: FuzzyDedupRequest,
    db: Session = Depends(get_db)
):
    """
    Identifies near-duplicate entity rows using RapidFuzz string similarity and Union-Find clustering.
    Optionally removes fuzzy duplicate rows if auto_remove is True.
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

    dedup_report = detect_fuzzy_duplicates(
        df=df,
        text_columns=request.text_columns,
        threshold=request.threshold
    )

    clusters_data = [
        FuzzyClusterItem(
            cluster_id=c["cluster_id"],
            primary_index=c["primary_index"],
            duplicate_indices=c["duplicate_indices"],
            avg_similarity=c["avg_similarity"],
            sample_values=c["sample_values"]
        ) for c in dedup_report["clusters"]
    ]

    total_clusters = dedup_report["total_clusters"]
    total_dup_rows = dedup_report["total_duplicate_rows"]
    msg = f"Fuzzy deduplication analysis identified {total_clusters} duplicate clusters ({total_dup_rows} total duplicate rows)."

    if request.auto_remove and total_dup_rows > 0:
        all_dup_indices = []
        for c in dedup_report["clusters"]:
            all_dup_indices.extend(c["duplicate_indices"])

        df_cleaned = df.drop(index=all_dup_indices).reset_index(drop=True)
        dataset_store.update_dataset(upload_id, df_cleaned)

        db_upload.row_count = len(df_cleaned)

        c_log = CleaningLog(
            upload_id=upload_id,
            action="AI Fuzzy Deduplication",
            column_name=", ".join(dedup_report["evaluated_columns"]),
            details=f"Removed {len(all_dup_indices)} fuzzy duplicate rows (similarity threshold={request.threshold}%)",
            rows_affected=len(all_dup_indices)
        )
        db.add(c_log)
        db.commit()

        msg += f" Automatically removed {len(all_dup_indices)} duplicate rows."

    return FuzzyDedupResponse(
        upload_id=upload_id,
        total_clusters=total_clusters,
        total_duplicate_rows=total_dup_rows,
        evaluated_columns=dedup_report["evaluated_columns"],
        clusters=clusters_data,
        message=msg
    )


@router.get("/dataset/{upload_id}/ai/semantic-types", response_model=SemanticTypeResponse)
async def get_semantic_types_endpoint(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """
    Classifies dataset columns into semantic data types (email, phone, credit_card,
    ip_address, uuid, currency, url, date, ssn).
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

    semantic_results = classify_semantic_types(df)

    formatted_cols = {
        col: SemanticTypeItem(
            predicted_type=data["predicted_type"],
            confidence=data["confidence"],
            detected_count=data["detected_count"],
            total_sampled=data["total_sampled"]
        )
        for col, data in semantic_results.items()
    }

    return SemanticTypeResponse(
        upload_id=upload_id,
        columns=formatted_cols
    )
