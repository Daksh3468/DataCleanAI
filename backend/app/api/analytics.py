"""
Analytics REST API Router for DataCleanAI.
Endpoints for DuckDB SQL Query Execution and Correlation Matrix calculation.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from app.services.dataset_store import dataset_store
from app.services.analytics import execute_sql_query, calculate_correlation_matrix

router = APIRouter(prefix="/analytics", tags=["Analytics & SQL Engine"])


from typing import Dict, Any, List, Optional, Union

class SQLQueryRequest(BaseModel):
    upload_id: Optional[Union[int, str]] = None
    query: str = Field(default="SELECT * FROM dataset LIMIT 10")


@router.post("/sql")
async def api_execute_sql(req: SQLQueryRequest):
    """
    Executes raw SQL queries against the active dataset using in-memory DuckDB.
    """
    upload_id = req.upload_id
    if isinstance(upload_id, str) and upload_id.isdigit():
        upload_id = int(upload_id)

    df = dataset_store.get_dataset(upload_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset session not found. Please upload a dataset first.")

    res = execute_sql_query(df, req.query)
    return res


@router.get("/correlation")
async def api_correlation_matrix(
    upload_id: Optional[str] = Query(None),
    method: str = Query("pearson", regex="^(pearson|spearman)$")
):
    """
    Calculates pairwise numerical correlation matrix for visual EDA heatmaps.
    """
    df = dataset_store.get_dataset(upload_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset session not found. Please upload a dataset first.")

    res = calculate_correlation_matrix(df, method=method)
    return res
