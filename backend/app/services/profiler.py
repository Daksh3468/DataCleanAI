"""
Dataset profiler service for DataCleanAI.
Computes row counts, column counts, memory usage, and column-level statistics.
"""

from typing import Dict, Any, List
import pandas as pd
import numpy as np


def _make_serializable(val: Any) -> Any:
    """Converts numpy/pandas data types into standard Python JSON-serializable types."""
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.floating, float)):
        if np.isinf(val) or np.isnan(val):
            return None
        return float(val)
    if isinstance(val, (pd.Timestamp, np.datetime64)):
        return str(val)
    if isinstance(val, (np.bool_, bool)):
        return bool(val)
    return str(val)


def _format_memory_size(bytes_num: int) -> str:
    """Formats bytes into human-readable string (KB, MB, GB)."""
    if bytes_num < 1024:
        return f"{bytes_num} Bytes"
    elif bytes_num < 1024 * 1024:
        return f"{bytes_num / 1024:.2f} KB"
    elif bytes_num < 1024 * 1024 * 1024:
        return f"{bytes_num / (1024 * 1024):.2f} MB"
    else:
        return f"{bytes_num / (1024 * 1024 * 1024):.2f} GB"


def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Profile a DataFrame and return comprehensive statistics.

    Parameters:
        df (pd.DataFrame): Input dataset to profile.

    Returns:
        Dict[str, Any]: Profile dictionary containing:
            - row_count: int
            - col_count: int
            - memory_bytes: int
            - memory_usage: str (formatted memory)
            - columns: Dict[str, Dict[str, Any]] (column-wise stats)
    """
    if df is None or not isinstance(df, pd.DataFrame):
        return {
            "row_count": 0,
            "col_count": 0,
            "memory_bytes": 0,
            "memory_usage": "0 Bytes",
            "columns": {},
        }

    row_count = len(df)
    col_count = len(df.columns)
    memory_bytes = int(df.memory_usage(deep=True).sum())
    memory_usage_str = _format_memory_size(memory_bytes)

    column_stats = {}

    for col in df.columns:
        series = df[col]
        col_dtype_str = str(series.dtype)
        missing_count = int(series.isna().sum())
        missing_pct = round((missing_count / max(1, row_count)) * 100, 2)
        unique_count = int(series.nunique(dropna=True))

        non_null_series = series.dropna()
        sample_raw = non_null_series.head(5).tolist() if not non_null_series.empty else []
        sample_values = [_make_serializable(v) for v in sample_raw]

        col_min = None
        col_max = None
        col_mean = None
        col_std = None
        col_median = None

        if not non_null_series.empty:
            if pd.api.types.is_numeric_dtype(series):
                try:
                    col_min = _make_serializable(series.min())
                    col_max = _make_serializable(series.max())
                    col_mean = _make_serializable(series.mean())
                    col_std = _make_serializable(series.std())
                    col_median = _make_serializable(series.median())
                except Exception:
                    pass
            elif pd.api.types.is_datetime64_any_dtype(series):
                try:
                    col_min = _make_serializable(series.min())
                    col_max = _make_serializable(series.max())
                except Exception:
                    pass
            else:
                try:
                    col_min = _make_serializable(non_null_series.min())
                    col_max = _make_serializable(non_null_series.max())
                except Exception:
                    pass

        column_stats[str(col)] = {
            "name": str(col),
            "dtype": col_dtype_str,
            "missing_count": missing_count,
            "missing_pct": missing_pct,
            "unique_count": unique_count,
            "sample_values": sample_values,
            "min": col_min,
            "max": col_max,
            "mean": col_mean,
            "std": col_std,
            "median": col_median,
        }

    return {
        "row_count": row_count,
        "col_count": col_count,
        "memory_bytes": memory_bytes,
        "memory_usage": memory_usage_str,
        "columns": column_stats,
    }
