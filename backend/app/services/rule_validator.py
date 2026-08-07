"""
Rule validator service for DataCleanAI.
Evaluates custom validation rules against pandas DataFrames and returns violation metrics.
"""

import re
import json
from typing import List, Dict, Any, Union
import pandas as pd
import numpy as np


def evaluate_rule(
    df: pd.DataFrame, 
    column_name: str, 
    operator: str, 
    value: Any
) -> pd.Series:
    """
    Evaluates a single rule against a DataFrame column and returns a boolean Series.
    True indicates the row PASSED the rule condition.
    False indicates a rule violation (or missing value where condition failed).
    """
    if df is None or not isinstance(df, pd.DataFrame):
        raise ValueError("Input must be a valid pandas DataFrame.")

    if column_name not in df.columns:
        raise KeyError(f"Column '{column_name}' not found in DataFrame.")

    series = df[column_name]
    op_clean = str(operator).strip().lower()

    if len(df) == 0:
        return pd.Series(dtype=bool, index=df.index)

    if op_clean in [">", "gt", "greater_than"]:
        target_num = float(value)
        num_series = pd.to_numeric(series, errors="coerce")
        return (num_series > target_num) & num_series.notna()

    elif op_clean in ["<", "lt", "less_than"]:
        target_num = float(value)
        num_series = pd.to_numeric(series, errors="coerce")
        return (num_series < target_num) & num_series.notna()

    elif op_clean in [">=", "gte", "greater_equal"]:
        target_num = float(value)
        num_series = pd.to_numeric(series, errors="coerce")
        return (num_series >= target_num) & num_series.notna()

    elif op_clean in ["<=", "lte", "less_equal"]:
        target_num = float(value)
        num_series = pd.to_numeric(series, errors="coerce")
        return (num_series <= target_num) & num_series.notna()

    elif op_clean in ["==", "eq", "equals", "equal"]:
        direct_match = series == value
        str_match = series.astype(str) == str(value)
        try:
            num_series = pd.to_numeric(series, errors="coerce")
            num_match = (num_series == float(value)) & num_series.notna()
            return direct_match | str_match | num_match
        except (ValueError, TypeError):
            return direct_match | str_match

    elif op_clean in ["!=", "ne", "not_equals", "not_equal"]:
        eq_mask = evaluate_rule(df, column_name, "==", value)
        return ~eq_mask & series.notna()

    elif op_clean in ["contains", "contain"]:
        str_series = series.fillna("").astype(str)
        target_str = str(value)
        return str_series.str.contains(target_str, case=False, regex=False) & series.notna()

    elif op_clean in ["not_contains", "not_contain", "not contains"]:
        str_series = series.fillna("").astype(str)
        target_str = str(value)
        contains_mask = str_series.str.contains(target_str, case=False, regex=False)
        return ~contains_mask & series.notna()

    elif op_clean in ["regex", "regex_match", "matches"]:
        str_series = series.fillna("").astype(str)
        pattern = str(value)
        return str_series.str.contains(pattern, case=False, regex=True, na=False) & series.notna()

    elif op_clean in ["in", "in_list", "enum"]:
        if isinstance(value, (list, tuple, set)):
            allowed = list(value)
        elif isinstance(value, str):
            if value.startswith("[") and value.endswith("]"):
                try:
                    allowed = json.loads(value)
                except Exception:
                    allowed = [x.strip() for x in value.strip("[]").split(",") if x.strip()]
            else:
                allowed = [x.strip() for x in value.split(",") if x.strip()]
        else:
            allowed = [value]

        allowed_strs = [str(x) for x in allowed]
        in_direct = series.isin(allowed)
        in_str = series.astype(str).isin(allowed_strs)
        return (in_direct | in_str) & series.notna()

    else:
        raise ValueError(f"Unsupported operator: '{operator}'")


def evaluate_all_rules(
    df: pd.DataFrame, 
    rules: Union[List[Dict[str, Any]], Dict[str, Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Evaluates multiple rules against a DataFrame.
    """
    if df is None or not isinstance(df, pd.DataFrame):
        raise ValueError("Input must be a valid pandas DataFrame.")

    total_rows = len(df)
    
    rule_list = []
    if isinstance(rules, dict):
        for r_id, r_data in rules.items():
            r_copy = dict(r_data)
            r_copy.setdefault("id", r_id)
            rule_list.append(r_copy)
    elif isinstance(rules, list):
        rule_list = list(rules)
    else:
        rule_list = []

    if total_rows == 0 or not rule_list:
        empty_mask = pd.Series(True, index=df.index, dtype=bool) if df is not None else pd.Series(dtype=bool)
        return {
            "total_rows": total_rows,
            "total_rules": len(rule_list),
            "rule_results": [],
            "overall_passed_mask": empty_mask,
            "overall_failed_mask": ~empty_mask,
            "overall_violations_count": 0,
            "overall_violations_percentage": 0.0
        }

    overall_passed_mask = pd.Series(True, index=df.index, dtype=bool)
    rule_results = []

    for rule in rule_list:
        col = rule.get("column_name") or rule.get("column") or rule.get("target_column")
        op = rule.get("operator") or rule.get("rule_type")
        val = rule.get("value")
        
        params = rule.get("parameters")
        if val is None and isinstance(params, dict):
            val = params.get("value")
        elif val is None and isinstance(params, str):
            try:
                parsed = json.loads(params)
                val = parsed.get("value", params)
            except Exception:
                val = params

        name = rule.get("name") or f"{col} {op} {val}"
        rule_id = rule.get("id")

        try:
            passed_mask = evaluate_rule(df, col, op, val)
            failed_mask = ~passed_mask
            violations_count = int(failed_mask.sum())
            passed_count = int(passed_mask.sum())
            violations_pct = round((violations_count / total_rows) * 100.0, 2)
            passed = (violations_count == 0)

            overall_passed_mask = overall_passed_mask & passed_mask

            rule_results.append({
                "rule_id": rule_id,
                "name": name,
                "column": col,
                "operator": op,
                "value": val,
                "total_rows": total_rows,
                "passed_count": passed_count,
                "violations_count": violations_count,
                "violations_percentage": violations_pct,
                "passed": passed,
                "passed_mask": passed_mask,
                "failed_mask": failed_mask
            })
        except Exception as e:
            failed_mask = pd.Series(True, index=df.index, dtype=bool)
            rule_results.append({
                "rule_id": rule_id,
                "name": name,
                "column": col,
                "operator": op,
                "value": val,
                "total_rows": total_rows,
                "passed_count": 0,
                "violations_count": total_rows,
                "violations_percentage": 100.0,
                "passed": False,
                "error": str(e),
                "passed_mask": ~failed_mask,
                "failed_mask": failed_mask
            })
            overall_passed_mask = overall_passed_mask & (~failed_mask)

    overall_failed_mask = ~overall_passed_mask
    overall_violations_count = int(overall_failed_mask.sum())
    overall_violations_pct = round((overall_violations_count / total_rows) * 100.0, 2)

    return {
        "total_rows": total_rows,
        "total_rules": len(rule_list),
        "rule_results": rule_results,
        "overall_passed_mask": overall_passed_mask,
        "overall_failed_mask": overall_failed_mask,
        "overall_violations_count": overall_violations_count,
        "overall_violations_percentage": overall_violations_pct
    }


def evaluate_rules(df: pd.DataFrame, rules: list) -> dict:
    """Wrapper function maintaining compatibility with evaluate_rules format."""
    res = evaluate_all_rules(df, rules)
    all_failed_indices = set()
    evaluated_rules = []
    for r in res.get("rule_results", []):
        indices = df.index[r["failed_mask"]].tolist() if "failed_mask" in r else []
        all_failed_indices.update(indices)
        evaluated_rules.append({
            "rule_id": r.get("rule_id"),
            "name": r.get("name"),
            "column": r.get("column"),
            "rule_type": r.get("operator"),
            "total_rows": r.get("total_rows"),
            "violating_count": r.get("violations_count"),
            "violating_pct": r.get("violations_percentage"),
            "violating_indices": indices,
            "error": r.get("error")
        })
    return {
        "total_rules": res.get("total_rules", 0),
        "total_violations": res.get("overall_violations_count", 0),
        "unique_violating_rows": len(all_failed_indices),
        "evaluated_rules": evaluated_rules
    }
