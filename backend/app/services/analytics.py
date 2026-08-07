"""
DataCleanAI — Advanced Analytics & SQL Console Service Engine.
Features:
- In-memory DuckDB SQL engine for running raw SQL queries on datasets.
- Pearson & Spearman correlation matrix generation for visual EDA.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional


def _clean_df_records(df_in: pd.DataFrame, limit: int = 500) -> List[Dict[str, Any]]:
    """Converts DataFrame to JSON-compliant list of dicts, replacing NaN/Inf with None."""
    subset = df_in.head(limit)
    cleaned = subset.astype(object).where(pd.notnull(subset), None)
    return cleaned.to_dict(orient="records")


# -------------------------------------------------------------------
# 1. DuckDB In-Memory SQL Query Engine
# -------------------------------------------------------------------
def execute_sql_query(df: pd.DataFrame, query: str) -> Dict[str, Any]:
    """
    Executes raw SQL queries against the dataset in-memory using DuckDB.
    Dataset table name is 'dataset'.
    """
    if df is None or len(df) == 0:
        return {"success": False, "error": "No active dataset session available to query."}

    clean_query = query.strip()
    if not clean_query:
        return {"success": False, "error": "Query string cannot be empty."}

    # Execute using DuckDB in-memory engine
    try:
        import duckdb
        con = duckdb.connect(database=":memory:")
        con.register("dataset", df)
        result_df = con.execute(clean_query).fetchdf()
        con.close()

        columns = result_df.columns.tolist()
        result_data = _clean_df_records(result_df, 500)

        return {
            "success": True,
            "engine": "DuckDB In-Memory SQL",
            "query": clean_query,
            "row_count": len(result_df),
            "columns": columns,
            "data": result_data,
            "message": f"Successfully returned {len(result_df)} rows."
        }
    except Exception as e:
        return {"success": False, "error": f"DuckDB SQL Execution Error: {str(e)}"}


# -------------------------------------------------------------------
# 2. Correlation Matrix Generator for EDA
# -------------------------------------------------------------------
def calculate_correlation_matrix(df: pd.DataFrame, method: str = "pearson") -> Dict[str, Any]:
    """
    Calculates pairwise correlation coefficients across all numerical columns.
    """
    if df is None:
        return {"success": False, "error": "No dataset available."}

    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty or len(numeric_df.columns) < 2:
        return {
            "success": False,
            "message": "At least 2 numerical columns are required to calculate a correlation matrix.",
            "columns": [],
            "matrix": []
        }

    corr_df = numeric_df.corr(method=method).fillna(0.0)
    columns = corr_df.columns.tolist()
    matrix = corr_df.round(3).values.tolist()

    return {
        "success": True,
        "method": method,
        "columns": columns,
        "matrix": matrix,
        "message": f"Calculated {method.title()} correlation matrix for {len(columns)} numerical features."
    }
