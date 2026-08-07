"""
Machine Learning & AI Engine Service for DataCleanAI.
Provides production-grade AI tools for anomaly detection (Isolation Forest),
missing value imputation (KNN & MICE), fuzzy duplicate clustering (RapidFuzz),
and semantic type classification (Regex & Heuristics).
"""

import math
import re
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np

# RapidFuzz fallback handling
try:
    import rapidfuzz.fuzz as rf_fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    import difflib
    HAS_RAPIDFUZZ = False

# Scikit-learn imports
try:
    from sklearn.ensemble import IsolationForest
    from sklearn.impute import KNNImputer, SimpleImputer
    from sklearn.experimental import enable_iterative_imputer  # noqa: F401
    from sklearn.impute import IterativeImputer
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False


# -------------------------------------------------------------------
# 1. Anomaly Detection via Isolation Forest
# -------------------------------------------------------------------
def detect_anomalies_isolation_forest(
    df: pd.DataFrame,
    contamination: float = 0.05,
    n_estimators: int = 100,
    columns: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Computes multi-column anomaly scores and identifies outlier row indices
    using sklearn.ensemble.IsolationForest.

    Parameters:
        df (pd.DataFrame): Target dataset.
        contamination (float): Expected proportion of outliers in the dataset (0.001 to 0.5).
        n_estimators (int): Number of trees in Isolation Forest ensemble.
        columns (List[str], optional): Specific numeric columns to evaluate.

    Returns:
        Dict[str, Any]: Detailed anomaly report containing outlier indices, anomaly scores,
                        total anomalies count, and anomaly percentage.
    """
    total_rows = len(df)
    if total_rows == 0:
        return {
            "total_rows": 0,
            "anomalies_count": 0,
            "anomaly_pct": 0.0,
            "outlier_indices": [],
            "anomaly_scores": {},
            "evaluated_columns": [],
            "contamination": contamination,
            "n_estimators": n_estimators
        }

    # Select numerical columns
    if columns:
        valid_cols = [c for c in columns if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]
    else:
        valid_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    if not valid_cols:
        return {
            "total_rows": total_rows,
            "anomalies_count": 0,
            "anomaly_pct": 0.0,
            "outlier_indices": [],
            "anomaly_scores": {},
            "evaluated_columns": [],
            "contamination": contamination,
            "n_estimators": n_estimators
        }

    # Prepare matrix X
    X_numeric = df[valid_cols].copy()

    # Check scikit-learn availability
    if not HAS_SKLEARN:
        # Fallback Z-score based anomaly detection if sklearn is missing
        X_filled = X_numeric.fillna(X_numeric.median()).values
        mean_vals = np.mean(X_filled, axis=0)
        std_devs = np.std(X_filled, axis=0)
        std_devs[std_devs == 0] = 1.0
        z_scores = np.abs((X_filled - mean_vals) / std_devs)
        max_z = np.max(z_scores, axis=1) if len(valid_cols) > 0 else np.zeros(total_rows)
        outlier_mask = max_z >= 2.0  # Threshold for fallback Z-score
        outlier_indices = np.where(outlier_mask)[0].tolist()
        scores_dict = {str(i): round(float(max_z[i]), 4) for i in range(total_rows)}
        anom_count = len(outlier_indices)
        return {
            "total_rows": total_rows,
            "anomalies_count": anom_count,
            "anomaly_pct": round((anom_count / total_rows) * 100.0, 2),
            "outlier_indices": outlier_indices,
            "anomaly_scores": scores_dict,
            "evaluated_columns": valid_cols,
            "contamination": contamination,
            "n_estimators": n_estimators
        }

    # Impute missing values temporarily for IsolationForest fit using SimpleImputer
    if X_numeric.isna().any().any():
        imputer = SimpleImputer(strategy="median")
        X_imputed = imputer.fit_transform(X_numeric)
    else:
        X_imputed = X_numeric.values


    # Clamp contamination to valid scikit-learn range [0.001, 0.5]
    clamped_contamination = max(0.001, min(0.5, float(contamination)))

    model = IsolationForest(
        contamination=clamped_contamination,
        n_estimators=int(n_estimators),
        random_state=42,
        n_jobs=-1
    )

    preds = model.fit_predict(X_imputed)  # -1 for outliers, 1 for inliers
    raw_scores = model.score_samples(X_imputed)  # Lower score = more anomalous

    # Normalize raw decision scores to [0.0, 1.0] where 1.0 is most anomalous
    min_s, max_s = np.min(raw_scores), np.max(raw_scores)
    if max_s > min_s:
        norm_scores = (max_s - raw_scores) / (max_s - min_s)
    else:
        norm_scores = np.zeros(len(raw_scores))

    outlier_indices = np.where(preds == -1)[0].tolist()
    scores_dict = {str(i): round(float(norm_scores[i]), 4) for i in range(total_rows)}
    anom_count = len(outlier_indices)

    return {
        "total_rows": total_rows,
        "anomalies_count": anom_count,
        "anomaly_pct": round((anom_count / total_rows) * 100.0, 2),
        "outlier_indices": outlier_indices,
        "anomaly_scores": scores_dict,
        "evaluated_columns": valid_cols,
        "contamination": clamped_contamination,
        "n_estimators": n_estimators
    }


# -------------------------------------------------------------------
# 2. KNN Imputation
# -------------------------------------------------------------------
def impute_knn(
    df: pd.DataFrame,
    n_neighbors: int = 5,
    cols: Optional[List[str]] = None
) -> Tuple[pd.DataFrame, List[str], int]:
    """
    Imputes missing numerical values using sklearn.impute.KNNImputer based on feature correlations.

    Parameters:
        df (pd.DataFrame): Input dataset.
        n_neighbors (int): Number of nearest neighbors to consider.
        cols (List[str], optional): Specific numerical columns to impute.

    Returns:
        Tuple[pd.DataFrame, List[str], int]: Imputed DataFrame copy, list of imputed column names,
                                             and total number of cells imputed.
    """
    df_imputed = df.copy()

    if cols:
        target_cols = [c for c in cols if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]
    else:
        target_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    if not target_cols or len(df_imputed) == 0:
        return df_imputed, [], 0

    # Identify columns that actually have missing values
    cols_with_missing = [c for c in target_cols if df_imputed[c].isna().sum() > 0]
    if not cols_with_missing:
        return df_imputed, [], 0

    total_cells_imputed = int(sum(df_imputed[c].isna().sum() for c in cols_with_missing))

    if HAS_SKLEARN:
        imputer = KNNImputer(n_neighbors=max(1, int(n_neighbors)))
        imputed_array = imputer.fit_transform(df_imputed[target_cols])
        imputed_sub_df = pd.DataFrame(imputed_array, columns=target_cols, index=df_imputed.index)
        for c in target_cols:
            df_imputed[c] = imputed_sub_df[c]
    else:
        # Fallback mean imputation if sklearn is missing
        for c in cols_with_missing:
            mean_val = df_imputed[c].mean()
            df_imputed[c] = df_imputed[c].fillna(mean_val)

    return df_imputed, cols_with_missing, total_cells_imputed


# -------------------------------------------------------------------
# 3. MICE Iterative Imputation
# -------------------------------------------------------------------
def impute_mice(
    df: pd.DataFrame,
    max_iter: int = 10,
    cols: Optional[List[str]] = None
) -> Tuple[pd.DataFrame, List[str], int]:
    """
    Imputes missing numerical values using sklearn.impute.IterativeImputer (MICE algorithm).

    Parameters:
        df (pd.DataFrame): Input dataset.
        max_iter (int): Maximum number of imputation iterations.
        cols (List[str], optional): Specific numerical columns to impute.

    Returns:
        Tuple[pd.DataFrame, List[str], int]: Imputed DataFrame copy, list of imputed column names,
                                             and total number of cells imputed.
    """
    df_imputed = df.copy()

    if cols:
        target_cols = [c for c in cols if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]
    else:
        target_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    if not target_cols or len(df_imputed) == 0:
        return df_imputed, [], 0

    cols_with_missing = [c for c in target_cols if df_imputed[c].isna().sum() > 0]
    if not cols_with_missing:
        return df_imputed, [], 0

    total_cells_imputed = int(sum(df_imputed[c].isna().sum() for c in cols_with_missing))

    if HAS_SKLEARN:
        imputer = IterativeImputer(max_iter=max(1, int(max_iter)), random_state=42)
        imputed_array = imputer.fit_transform(df_imputed[target_cols])
        imputed_sub_df = pd.DataFrame(imputed_array, columns=target_cols, index=df_imputed.index)
        for c in target_cols:
            df_imputed[c] = imputed_sub_df[c]
    else:
        # Fallback mean imputation
        for c in cols_with_missing:
            median_val = df_imputed[c].median()
            df_imputed[c] = df_imputed[c].fillna(median_val)

    return df_imputed, cols_with_missing, total_cells_imputed


# -------------------------------------------------------------------
# 4. Fuzzy Duplicate Detection
# -------------------------------------------------------------------
class UnionFind:
    def __init__(self, size: int):
        self.parent = list(range(size))

    def find(self, i: int) -> int:
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, i: int, j: int):
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i != root_j:
            self.parent[root_b := max(root_i, root_j)] = min(root_i, root_j)


def _compute_string_similarity(s1: str, s2: str) -> float:
    """Computes similarity percentage (0.0 to 100.0) between two strings."""
    if s1 == s2:
        return 100.0
    if not s1 or not s2:
        return 0.0

    if HAS_RAPIDFUZZ:
        return float(rf_fuzz.token_sort_ratio(s1, s2))
    else:
        return float(difflib.SequenceMatcher(None, s1, s2).ratio() * 100.0)


def detect_fuzzy_duplicates(
    df: pd.DataFrame,
    text_columns: Optional[List[str]] = None,
    threshold: float = 85.0
) -> Dict[str, Any]:
    """
    Uses RapidFuzz / Levenshtein string distance to identify near-duplicate entity rows
    and group them into duplicate clusters using Disjoint Set Union (Union-Find).

    Parameters:
        df (pd.DataFrame): Input dataset.
        text_columns (List[str], optional): String columns to include in string matching.
        threshold (float): Similarity threshold percentage (0.0 to 100.0).

    Returns:
        Dict[str, Any]: Clusters report containing cluster groups, primary indices, duplicate indices,
                        and similarity metrics.
    """
    total_rows = len(df)
    if total_rows == 0:
        return {
            "total_clusters": 0,
            "total_duplicate_rows": 0,
            "evaluated_columns": [],
            "clusters": []
        }

    # Select text columns
    if text_columns:
        valid_cols = [c for c in text_columns if c in df.columns]
    else:
        # Auto-select string/object/categorical columns
        valid_cols = df.select_dtypes(include=["object", "string", "category"]).columns.tolist()
        if not valid_cols:
            # Fall back to all columns if no object columns exist
            valid_cols = list(df.columns)

    if not valid_cols:
        return {
            "total_clusters": 0,
            "total_duplicate_rows": 0,
            "evaluated_columns": [],
            "clusters": []
        }

    # Construct combined string representation for each row
    row_strings: List[str] = []
    for _, row in df[valid_cols].iterrows():
        parts = [str(val).strip().lower() for val in row if pd.notna(val) and str(val).strip() != ""]
        row_strings.append(" ".join(parts))

    uf = UnionFind(total_rows)
    pair_similarities: Dict[Tuple[int, int], float] = {}

    # Limit comparisons for very large datasets to prevent extreme execution times
    max_compare_rows = min(total_rows, 2000)

    for i in range(max_compare_rows):
        s1 = row_strings[i]
        if not s1:
            continue
        for j in range(i + 1, max_compare_rows):
            s2 = row_strings[j]
            if not s2:
                continue
            
            # Quick length heuristic optimization
            len_ratio = len(s1) / len(s2) if len(s2) > 0 else 0
            if len_ratio < 0.5 or len_ratio > 2.0:
                continue

            sim = _compute_string_similarity(s1, s2)
            if sim >= threshold:
                uf.union(i, j)
                pair_similarities[(i, j)] = sim

    # Group rows into clusters
    cluster_groups: Dict[int, List[int]] = {}
    for idx in range(max_compare_rows):
        root = uf.find(idx)
        if root not in cluster_groups:
            cluster_groups[root] = []
        cluster_groups[root].append(idx)

    # Filter out clusters with only 1 item (no duplicates)
    multi_item_clusters = [members for members in cluster_groups.values() if len(members) > 1]

    formatted_clusters = []
    total_duplicate_rows = 0

    for cluster_id, members in enumerate(multi_item_clusters, start=1):
        primary_idx = members[0]
        dup_indices = members[1:]
        total_duplicate_rows += len(dup_indices)

        # Calculate average similarity relative to primary index
        sims = []
        for d_idx in dup_indices:
            key = (min(primary_idx, d_idx), max(primary_idx, d_idx))
            sims.append(pair_similarities.get(key, threshold))
        avg_sim = round(float(np.mean(sims)), 2) if sims else threshold

        # Extract sample values from primary row
        sample_vals = {}
        for c in valid_cols[:5]:
            val = df.iloc[primary_idx][c]
            sample_vals[c] = None if pd.isna(val) else str(val)

        formatted_clusters.append({
            "cluster_id": cluster_id,
            "primary_index": int(primary_idx),
            "duplicate_indices": [int(x) for x in dup_indices],
            "avg_similarity": avg_sim,
            "sample_values": sample_vals
        })

    return {
        "total_clusters": len(formatted_clusters),
        "total_duplicate_rows": total_duplicate_rows,
        "evaluated_columns": valid_cols,
        "clusters": formatted_clusters
    }


# -------------------------------------------------------------------
# 5. Semantic Data Type Classification
# -------------------------------------------------------------------
# Order patterns by specificity so specific patterns match before general ones
SEMANTIC_PATTERNS = {
    "email": re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"),
    "uuid": re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"),
    "ip_address": re.compile(r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"),
    "ssn": re.compile(r"^\d{3}-\d{2}-\d{4}$"),
    "credit_card": re.compile(r"^(?:\d[ -]*?){13,19}$"),
    "currency": re.compile(r"^\s*[\$\€\£\¥\₹]\s*-?\d+(?:\,\d{3})*(?:\.\d{1,4})?\s*$|^\s*-?\d+(?:\,\d{3})*(?:\.\d{1,4})?\s*[\$\€\£\¥\₹]\s*$"),
    "url": re.compile(r"^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$"),
    "date": re.compile(r"^\d{4}[-/]\d{1,2}[-/]\d{1,2}$|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$|^\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}$", re.IGNORECASE),
    "phone": re.compile(r"^\+?\d{1,4}?[\s.\-]?\(?\d{1,4}?\)?[\s.\-]?\d{1,4}[\s.\-]?\d{1,4}[\s.\-]?\d{1,9}$"),
}


def classify_semantic_types(df: pd.DataFrame, sample_limit: int = 200) -> Dict[str, Dict[str, Any]]:
    """
    Classifies dataset columns into semantic data types (email, phone, credit_card,
    ip_address, uuid, currency, url, date, ssn).

    Parameters:
        df (pd.DataFrame): Input dataset.
        sample_limit (int): Maximum non-null rows to sample per column.

    Returns:
        Dict[str, Dict[str, Any]]: Semantic type classification dictionary per column.
    """
    results = {}

    for col in df.columns:
        series = df[col].dropna()
        total_sampled = min(len(series), sample_limit)

        if total_sampled == 0:
            results[col] = {
                "predicted_type": "unknown",
                "confidence": 0.0,
                "detected_count": 0,
                "total_sampled": 0
            }
            continue

        sample_series = series.head(sample_limit)
        sample_str = sample_series.astype(str).str.strip()

        col_name_lower = str(col).lower()
        best_type = "text"
        best_confidence = 0.0
        best_detected_count = 0

        # Check native dtypes first
        if pd.api.types.is_numeric_dtype(df[col]):
            best_type = "numeric"
            best_confidence = 1.0
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            best_type = "date"
            best_confidence = 1.0
        elif pd.api.types.is_bool_dtype(df[col]):
            best_type = "boolean"
            best_confidence = 1.0

        # Evaluate semantic patterns for string / object columns or column name hints
        for stype, pattern in SEMANTIC_PATTERNS.items():
            matches = sample_str.apply(lambda x: bool(pattern.match(x)))
            match_count = int(matches.sum())
            match_ratio = match_count / total_sampled

            # Add header hint bonus if column name strongly matches
            if stype in col_name_lower or (stype == "credit_card" and "card" in col_name_lower) or (stype == "ip_address" and "ip" in col_name_lower):
                match_ratio = min(1.0, match_ratio + 0.15)

            # Prioritize specific pattern matches over native text/numeric or lower confidence
            if match_count > 0:
                if best_type in ["text", "unknown", "numeric"] or match_ratio > best_confidence:
                    best_confidence = match_ratio
                    best_type = stype
                    best_detected_count = match_count


        # Fallback date parsing check if regex missed standard date strings
        if best_type in ["text", "unknown"] and best_confidence < 0.5:
            try:
                parsed_dates = pd.to_datetime(sample_str, errors="coerce")
                valid_dates_count = int(parsed_dates.notna().sum())
                date_ratio = valid_dates_count / total_sampled
                if date_ratio >= 0.7:
                    best_type = "date"
                    best_confidence = round(date_ratio, 2)
                    best_detected_count = valid_dates_count
            except Exception:
                pass

        # Final score rounding
        results[col] = {
            "predicted_type": best_type,
            "confidence": round(float(best_confidence), 2),
            "detected_count": best_detected_count,
            "total_sampled": total_sampled
        }

    return results
