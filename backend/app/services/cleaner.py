"""
Data cleaning engine service for DataCleanAI.
Applies transformations (duplicates, missing values, whitespace, data types, outliers)
and returns cleaned DataFrame + detailed changelog.
"""

import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any


def log_cleaning_action(action_type: str, column_name: str, details: str, rows_affected: int = 0) -> Dict[str, Any]:
    """Creates a standardized changelog dictionary entry for a cleaning action."""
    return {
        "action": action_type,
        "column_name": column_name,
        "details": details,
        "rows_affected": rows_affected
    }


def clean_dataset(df: pd.DataFrame, config: Dict[str, Any]) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
    """
    Applies configurable cleaning transformations to a pandas DataFrame.
    """
    if df is None or df.empty:
        return df, []

    cleaned_df = df.copy()
    changelog = []

    # 1. Remove duplicate rows
    if config.get("remove_duplicates", False):
        initial_rows = len(cleaned_df)
        cols_to_check = config.get("duplicate_cols") or cleaned_df.columns.tolist()
        keep_opt = config.get("duplicate_keep", "first")
        
        cols_to_check = [c for c in cols_to_check if c in cleaned_df.columns]
        
        if cols_to_check:
            dup_mask = cleaned_df.duplicated(subset=cols_to_check, keep=keep_opt)
            dups_count = int(dup_mask.sum())
            if dups_count > 0:
                cleaned_df = cleaned_df[~dup_mask].reset_index(drop=True)
                changelog.append({
                    "action": "remove_duplicates",
                    "column_name": ", ".join(cols_to_check),
                    "details": f"Removed {dups_count} duplicate rows using columns: {cols_to_check} (keep='{keep_opt}')",
                    "rows_affected": dups_count
                })

    # 2. Trim whitespace in text columns
    if config.get("trim_whitespace", False):
        target_cols = config.get("whitespace_cols")
        if not target_cols:
            target_cols = [c for c in cleaned_df.columns if pd.api.types.is_string_dtype(cleaned_df[c]) or pd.api.types.is_object_dtype(cleaned_df[c])]
        else:
            target_cols = [c for c in target_cols if c in cleaned_df.columns]

        total_trimmed = 0
        for c in target_cols:
            if pd.api.types.is_string_dtype(cleaned_df[c]) or pd.api.types.is_object_dtype(cleaned_df[c]):
                s_orig = cleaned_df[c].astype(str)
                s_trimmed = s_orig.str.strip()
                trimmed_count = int((s_orig != s_trimmed).sum())
                if trimmed_count > 0:
                    cleaned_df[c] = cleaned_df[c].apply(lambda x: x.strip() if isinstance(x, str) else x)
                    total_trimmed += trimmed_count

        if total_trimmed > 0:
            changelog.append({
                "action": "trim_whitespace",
                "column_name": ", ".join(target_cols),
                "details": f"Trimmed whitespace in {len(target_cols)} text column(s). Modified {total_trimmed} cell values.",
                "rows_affected": total_trimmed
            })

    # 3. Handle missing values
    if config.get("handle_missing", False):
        strategy = config.get("missing_strategy", "drop")
        target_cols = config.get("missing_cols")
        if not target_cols:
            target_cols = cleaned_df.columns.tolist()
        else:
            target_cols = [c for c in target_cols if c in cleaned_df.columns]

        if strategy == "drop":
            initial_rows = len(cleaned_df)
            cleaned_df = cleaned_df.dropna(subset=target_cols).reset_index(drop=True)
            dropped_rows = initial_rows - len(cleaned_df)
            if dropped_rows > 0:
                changelog.append({
                    "action": "fill_missing",
                    "column_name": ", ".join(target_cols),
                    "details": f"Dropped {dropped_rows} rows containing missing values in target columns.",
                    "rows_affected": dropped_rows
                })
        else:
            total_filled = 0
            for c in target_cols:
                missing_cnt = int(cleaned_df[c].isna().sum())
                if missing_cnt > 0:
                    fill_val = None
                    if strategy == "mean" and pd.api.types.is_numeric_dtype(cleaned_df[c]):
                        fill_val = cleaned_df[c].mean()
                    elif strategy == "median" and pd.api.types.is_numeric_dtype(cleaned_df[c]):
                        fill_val = cleaned_df[c].median()
                    elif strategy == "mode":
                        mode_s = cleaned_df[c].mode(dropna=True)
                        if not mode_s.empty:
                            fill_val = mode_s.iloc[0]
                    elif strategy == "custom":
                        fill_val = config.get("missing_custom_val", "")

                    if fill_val is not None:
                        cleaned_df[c] = cleaned_df[c].fillna(fill_val)
                        total_filled += missing_cnt

            if total_filled > 0:
                changelog.append({
                    "action": "fill_missing",
                    "column_name": ", ".join(target_cols),
                    "details": f"Filled {total_filled} missing cells using strategy '{strategy}'.",
                    "rows_affected": total_filled
                })

    # 4. Fix data types
    if config.get("convert_numeric", False):
        num_cols = config.get("numeric_cols") or []
        num_cols = [c for c in num_cols if c in cleaned_df.columns]
        converted_cnt = 0
        for c in num_cols:
            cleaned_df[c] = pd.to_numeric(cleaned_df[c], errors="coerce")
            converted_cnt += 1
        if converted_cnt > 0:
            changelog.append({
                "action": "convert_dtype",
                "column_name": ", ".join(num_cols),
                "details": f"Converted column(s) {num_cols} to numeric type.",
                "rows_affected": 0
            })

    if config.get("convert_datetime", False):
        dt_cols = config.get("datetime_cols") or []
        dt_cols = [c for c in dt_cols if c in cleaned_df.columns]
        for c in dt_cols:
            cleaned_df[c] = pd.to_datetime(cleaned_df[c], errors="coerce")
        if dt_cols:
            changelog.append({
                "action": "convert_dtype",
                "column_name": ", ".join(dt_cols),
                "details": f"Converted column(s) {dt_cols} to datetime type.",
                "rows_affected": 0
            })

    # 5. Remove outliers
    if config.get("remove_outliers", False):
        method = config.get("outlier_method", "iqr")
        outlier_cols = config.get("outlier_cols")
        if not outlier_cols:
            outlier_cols = [c for c in cleaned_df.columns if pd.api.types.is_numeric_dtype(cleaned_df[c])]
        else:
            outlier_cols = [c for c in outlier_cols if c in cleaned_df.columns and pd.api.types.is_numeric_dtype(cleaned_df[c])]

        if outlier_cols:
            outlier_mask = pd.Series(False, index=cleaned_df.index)

            for c in outlier_cols:
                series = cleaned_df[c].dropna()
                if series.empty:
                    continue
                if method == "iqr":
                    q1 = series.quantile(0.25)
                    q3 = series.quantile(0.75)
                    iqr = q3 - q1
                    if iqr > 0:
                        lower_bound = q1 - 1.5 * iqr
                        upper_bound = q3 + 1.5 * iqr
                        c_outliers = (cleaned_df[c] < lower_bound) | (cleaned_df[c] > upper_bound)
                        outlier_mask = outlier_mask | c_outliers
                elif method == "zscore":
                    mean_val = series.mean()
                    std_val = series.std()
                    if std_val > 0:
                        z_scores = (cleaned_df[c] - mean_val).abs() / std_val
                        outlier_mask = outlier_mask | (z_scores > 3.0)

            outlier_rows_count = int(outlier_mask.sum())
            if outlier_rows_count > 0:
                cleaned_df = cleaned_df[~outlier_mask].reset_index(drop=True)
                changelog.append({
                    "action": "remove_outliers",
                    "column_name": ", ".join(outlier_cols),
                    "details": f"Removed {outlier_rows_count} outlier rows using method '{method.upper()}' on columns: {outlier_cols}",
                    "rows_affected": outlier_rows_count
                })

    return cleaned_df, changelog
