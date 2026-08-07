"""
Pydantic v2 request and response schemas for DataCleanAI REST API.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, ConfigDict


# -------------------------------------------------------------------
# Upload Schemas
# -------------------------------------------------------------------
class UploadSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    upload_id: int
    filename: str
    file_size: Optional[int] = 0
    row_count: Optional[int] = 0
    column_count: Optional[int] = 0
    columns: List[str] = Field(default_factory=list)
    uploaded_at: Optional[datetime] = None
    message: str = "File uploaded successfully"


# -------------------------------------------------------------------
# Profile Schemas
# -------------------------------------------------------------------
class ColumnProfile(BaseModel):
    name: str
    dtype: str
    missing_count: int
    missing_pct: float
    unique_count: int
    sample_values: List[Any] = Field(default_factory=list)
    min: Optional[Any] = None
    max: Optional[Any] = None
    mean: Optional[float] = None
    std: Optional[float] = None
    median: Optional[float] = None


class DatasetProfileResponse(BaseModel):
    upload_id: int
    filename: str
    row_count: int
    col_count: int
    memory_bytes: int
    memory_usage: str
    columns: Dict[str, ColumnProfile]
    sample_rows: List[Dict[str, Any]] = Field(default_factory=list)


# -------------------------------------------------------------------
# Quality Score Schemas
# -------------------------------------------------------------------
class DimensionScores(BaseModel):
    completeness: float
    validity: float
    uniqueness: float
    consistency: float


class ColumnQualityScore(BaseModel):
    completeness: float
    validity: float
    uniqueness: float
    consistency: float
    overall: float


class QualityScoreResponse(BaseModel):
    upload_id: int
    overall_score: float
    dimensions: DimensionScores
    column_scores: Dict[str, ColumnQualityScore]


# -------------------------------------------------------------------
# Custom Rule Schemas
# -------------------------------------------------------------------
class CustomRuleCreate(BaseModel):
    name: str = Field(..., description="Descriptive rule name")
    rule_type: str = Field(..., description="Operator (e.g., 'gt', '<', '==', 'contains', 'regex', 'in')")
    target_column: str = Field(..., description="Target DataFrame column name")
    parameters: Optional[Union[Dict[str, Any], str, int, float, list]] = Field(
        default=None, description="Parameters or comparison value"
    )
    is_active: bool = True


class CustomRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    rule_type: str
    target_column: str
    parameters: Optional[Union[Dict[str, Any], str, int, float, list]] = None
    is_active: bool
    created_at: datetime


class RuleEvaluateRequest(BaseModel):
    rule_ids: Optional[List[int]] = Field(
        default=None, description="List of rule IDs saved in database to evaluate"
    )
    rules: Optional[List[CustomRuleCreate]] = Field(
        default=None, description="List of ad-hoc custom rule definitions to evaluate"
    )


class RuleEvaluationItem(BaseModel):
    rule_id: Optional[int] = None
    name: str
    column: str
    rule_type: str
    total_rows: int
    violating_count: int
    violating_pct: float
    violating_indices: Optional[List[int]] = Field(default_factory=list)
    error: Optional[str] = None


class RuleEvaluationResponse(BaseModel):
    upload_id: int
    total_rules: int
    total_violations: int
    unique_violating_rows: int
    evaluated_rules: List[RuleEvaluationItem]


# -------------------------------------------------------------------
# Cleaning Options & Result Schemas
# -------------------------------------------------------------------
class CleaningOptionsRequest(BaseModel):
    remove_duplicates: bool = False
    duplicate_cols: Optional[List[str]] = None
    duplicate_keep: str = "first"  # 'first', 'last', False

    trim_whitespace: bool = False
    whitespace_cols: Optional[List[str]] = None

    handle_missing: bool = False
    missing_strategy: str = "drop"  # 'drop', 'mean', 'median', 'mode', 'custom'
    missing_cols: Optional[List[str]] = None
    missing_custom_val: Optional[Any] = None

    convert_numeric: bool = False
    numeric_cols: Optional[List[str]] = None

    convert_datetime: bool = False
    datetime_cols: Optional[List[str]] = None

    remove_outliers: bool = False
    outlier_method: str = "iqr"  # 'iqr', 'zscore'
    outlier_cols: Optional[List[str]] = None


class ChangelogItem(BaseModel):
    action: str
    column_name: Optional[str] = None
    details: str
    rows_affected: int = 0


class CleaningResponse(BaseModel):
    upload_id: int
    original_row_count: int
    original_col_count: int
    cleaned_row_count: int
    cleaned_col_count: int
    original_quality_score: float
    cleaned_quality_score: float
    changelog: List[ChangelogItem]
    sample_rows: List[Dict[str, Any]] = Field(default_factory=list)


# -------------------------------------------------------------------
# History Schemas
# -------------------------------------------------------------------
class CleaningLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    upload_id: Optional[int] = None
    action: str
    column_name: Optional[str] = None
    details: Optional[str] = None
    rows_affected: int
    timestamp: datetime


class UploadHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    file_size: Optional[int] = 0
    row_count: Optional[int] = 0
    column_count: Optional[int] = 0
    uploaded_at: Optional[datetime] = None
    logs_count: int = 0


class CleaningLogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    upload_id: Optional[int] = None
    action: str
    column_name: Optional[str] = None
    details: Optional[str] = None
    rows_affected: int = 0
    timestamp: datetime


class HistoryResponse(BaseModel):
    uploads: List[UploadSummaryResponse]
    cleaning_logs: List[CleaningLogResponse]


# -------------------------------------------------------------------
# Machine Learning & AI Schemas
# -------------------------------------------------------------------
class AnomalyDetectionRequest(BaseModel):
    contamination: float = Field(default=0.05, ge=0.001, le=0.5, description="Expected proportion of outliers")
    n_estimators: int = Field(default=100, ge=10, le=1000, description="Number of trees in Isolation Forest")
    columns: Optional[List[str]] = Field(default=None, description="Numerical columns to evaluate")
    auto_remove: bool = Field(default=False, description="Remove detected anomaly rows from dataset")


class AnomalyDetectionResponse(BaseModel):
    upload_id: int
    total_rows: int
    anomalies_count: int
    anomaly_pct: float
    outlier_indices: List[int] = Field(default_factory=list)
    anomaly_scores: Dict[str, float] = Field(default_factory=dict)
    evaluated_columns: List[str] = Field(default_factory=list)
    message: str = "Anomaly detection completed successfully"


class ImputeKNNRequest(BaseModel):
    n_neighbors: int = Field(default=5, ge=1, le=100, description="Number of neighbors for KNN imputation")
    columns: Optional[List[str]] = Field(default=None, description="Numerical columns to impute")
    apply_to_dataset: bool = Field(default=True, description="Save imputed dataset back to store")


class ImputeKNNResponse(BaseModel):
    upload_id: int
    imputed_cols: List[str] = Field(default_factory=list)
    imputed_cells_count: int = 0
    message: str = "KNN Imputation applied successfully"
    sample_rows: List[Dict[str, Any]] = Field(default_factory=list)


class ImputeMICERequest(BaseModel):
    max_iter: int = Field(default=10, ge=1, le=100, description="Maximum iterations for MICE imputation")
    columns: Optional[List[str]] = Field(default=None, description="Numerical columns to impute")
    apply_to_dataset: bool = Field(default=True, description="Save imputed dataset back to store")


class ImputeMICEResponse(BaseModel):
    upload_id: int
    imputed_cols: List[str] = Field(default_factory=list)
    imputed_cells_count: int = 0
    message: str = "MICE Iterative Imputation applied successfully"
    sample_rows: List[Dict[str, Any]] = Field(default_factory=list)


class FuzzyClusterItem(BaseModel):
    cluster_id: int
    primary_index: int
    duplicate_indices: List[int] = Field(default_factory=list)
    avg_similarity: float
    sample_values: Dict[str, Any] = Field(default_factory=dict)


class FuzzyDedupRequest(BaseModel):
    text_columns: Optional[List[str]] = Field(default=None, description="Text columns to compare")
    threshold: float = Field(default=85.0, ge=0.0, le=100.0, description="Similarity threshold (0-100)")
    auto_remove: bool = Field(default=False, description="Remove fuzzy duplicate rows")


class FuzzyDedupResponse(BaseModel):
    upload_id: int
    total_clusters: int
    total_duplicate_rows: int
    evaluated_columns: List[str] = Field(default_factory=list)
    clusters: List[FuzzyClusterItem] = Field(default_factory=list)
    message: str = "Fuzzy duplicate detection completed"


class SemanticTypeItem(BaseModel):
    predicted_type: str
    confidence: float
    detected_count: int
    total_sampled: int


class SemanticTypeResponse(BaseModel):
    upload_id: int
    columns: Dict[str, SemanticTypeItem]


