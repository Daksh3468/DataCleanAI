"""
Data Quality Scorer engine for DataCleanAI.
Calculates 4 dimensions of quality: Completeness, Validity, Uniqueness, Consistency.
"""

from typing import Dict, Any, Union, Optional
import pandas as pd
import numpy as np


def score_completeness(df: pd.DataFrame) -> float:
    """Calculates overall completeness percentage based on proportion of non-null cells."""
    if df is None or df.empty:
        return 100.0

    total_cells = df.size
    if total_cells == 0:
        return 100.0

    null_cells = int(df.isna().sum().sum())
    completeness = ((total_cells - null_cells) / total_cells) * 100.0
    return round(float(completeness), 2)


def score_validity(
    df: pd.DataFrame,
    type_issues: Optional[Union[int, Dict[str, int]]] = None,
    rule_violations: int = 0
) -> float:
    """Calculates overall data validity percentage."""
    if df is None or df.empty:
        return 100.0

    total_cells = df.size
    if total_cells == 0:
        return 100.0

    total_invalid = 0

    if isinstance(type_issues, int):
        total_invalid += type_issues
    elif isinstance(type_issues, dict):
        total_invalid += sum(type_issues.values())

    total_invalid += rule_violations

    invalid_placeholders = {"n/a", "na", "null", "none", "undefined", "?", "-", "--", "missing"}
    for col in df.columns:
        if pd.api.types.is_string_dtype(df[col]) or pd.api.types.is_object_dtype(df[col]):
            s_str = df[col].astype(str).str.strip().str.lower()
            placeholder_matches = s_str.isin(invalid_placeholders).sum()
            total_invalid += int(placeholder_matches)

    valid_cells = max(0, total_cells - total_invalid)
    validity = (valid_cells / total_cells) * 100.0
    return round(float(min(100.0, max(0.0, validity))), 2)


def score_uniqueness(df: pd.DataFrame) -> float:
    """Calculates overall uniqueness percentage based on duplicate rows."""
    if df is None or df.empty:
        return 100.0

    total_rows = len(df)
    if total_rows <= 1:
        return 100.0

    duplicate_rows = int(df.duplicated().sum())
    uniqueness = ((total_rows - duplicate_rows) / total_rows) * 100.0
    return round(float(uniqueness), 2)


def score_consistency(df: pd.DataFrame) -> float:
    """Calculates overall consistency percentage based on formatting, whitespace, casing, and outliers."""
    if df is None or df.empty or len(df.columns) == 0:
        return 100.0

    col_scores = []
    for col in df.columns:
        series = df[col]
        non_null_count = series.dropna().count()
        if non_null_count == 0:
            col_scores.append(100.0)
            continue

        inconsistencies = 0

        if pd.api.types.is_string_dtype(series) or pd.api.types.is_object_dtype(series):
            s_str = series.dropna().astype(str)
            has_whitespace = (s_str != s_str.str.strip()).sum()
            inconsistencies += has_whitespace

            lowercased = s_str.str.lower()
            if lowercased.nunique() < s_str.nunique():
                casing_inconsistency = s_str.nunique() - lowercased.nunique()
                inconsistencies += casing_inconsistency * 2

        elif pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            if iqr > 0:
                outliers = ((series < (q1 - 3 * iqr)) | (series > (q3 + 3 * iqr))).sum()
                inconsistencies += outliers

        col_score = max(0.0, 100.0 - (inconsistencies / non_null_count) * 100.0)
        col_scores.append(col_score)

    avg_consistency = float(np.mean(col_scores)) if col_scores else 100.0
    return round(float(min(100.0, max(0.0, avg_consistency))), 2)


def calculate_quality_scores(df: pd.DataFrame, rule_violations_count: int = 0) -> Dict[str, Any]:
    """Calculates overall quality score, dimension scores, and column-level quality scores."""
    if df is None or df.empty:
        empty_dims = {"completeness": 100.0, "validity": 100.0, "uniqueness": 100.0, "consistency": 100.0}
        return {
            "overall_score": 100.0,
            "dimensions": empty_dims,
            "column_scores": {}
        }

    total_rows = len(df)

    comp_score = score_completeness(df)
    val_score = score_validity(df, rule_violations=rule_violations_count)
    uniq_score = score_uniqueness(df)
    cons_score = score_consistency(df)

    overall = (comp_score * 0.30) + (val_score * 0.30) + (uniq_score * 0.20) + (cons_score * 0.20)
    overall_score = round(float(overall), 2)

    column_scores = {}

    for col in df.columns:
        series = df[col]
        c_nulls = series.isna().sum()
        c_comp = round(float(((total_rows - c_nulls) / total_rows) * 100.0), 2)

        c_invalid = 0
        invalid_placeholders = {"n/a", "na", "null", "none", "undefined", "?", "-", "--", "missing"}
        if pd.api.types.is_string_dtype(series) or pd.api.types.is_object_dtype(series):
            s_str = series.dropna().astype(str).str.strip().str.lower()
            c_invalid += int(s_str.isin(invalid_placeholders).sum())
        c_val = round(float(max(0.0, 100.0 - (c_invalid / max(1, total_rows)) * 100.0)), 2)

        non_null_cnt = series.dropna().count()
        if non_null_cnt > 0:
            c_uniq = round(float((series.nunique() / non_null_cnt) * 100.0), 2)
        else:
            c_uniq = 100.0

        c_inconsistencies = 0
        if non_null_cnt > 0:
            if pd.api.types.is_string_dtype(series) or pd.api.types.is_object_dtype(series):
                s_str = series.dropna().astype(str)
                c_inconsistencies += (s_str != s_str.str.strip()).sum()
                lowercased = s_str.str.lower()
                if lowercased.nunique() < s_str.nunique():
                    c_inconsistencies += (s_str.nunique() - lowercased.nunique()) * 2
            elif pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
                q1 = series.quantile(0.25)
                q3 = series.quantile(0.75)
                iqr = q3 - q1
                if iqr > 0:
                    c_inconsistencies += ((series < (q1 - 3 * iqr)) | (series > (q3 + 3 * iqr))).sum()

            c_cons = round(float(max(0.0, 100.0 - (c_inconsistencies / max(1, non_null_cnt)) * 100.0)), 2)
        else:
            c_cons = 100.0

        c_overall = round(float((c_comp * 0.30) + (c_val * 0.30) + (c_uniq * 0.20) + (c_cons * 0.20)), 2)

        column_scores[str(col)] = {
            "completeness": c_comp,
            "validity": c_val,
            "uniqueness": c_uniq,
            "consistency": c_cons,
            "overall": c_overall,
        }

    return {
        "overall_score": overall_score,
        "dimensions": {
            "completeness": comp_score,
            "validity": val_score,
            "uniqueness": uniq_score,
            "consistency": cons_score,
        },
        "column_scores": column_scores,
    }
