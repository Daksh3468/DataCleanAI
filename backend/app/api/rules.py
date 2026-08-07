"""
Rules API router for DataCleanAI.
GET/POST /api/rules, DELETE /api/rules/{rule_id}, POST /api/dataset/{upload_id}/evaluate-rules
"""

import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import CustomRule, Upload
from app.schemas.pydantic_models import (
    CustomRuleCreate,
    CustomRuleResponse,
    RuleEvaluateRequest,
    RuleEvaluationResponse,
    RuleEvaluationItem,
)
from app.services.rule_validator import evaluate_all_rules
from app.services.dataset_store import dataset_store

router = APIRouter(tags=["Rules"])


def _serialize_params(params) -> str:
    if params is None:
        return ""
    if isinstance(params, (dict, list)):
        return json.dumps(params)
    return str(params)


def _deserialize_params(params_str: Optional[str]):
    if not params_str:
        return None
    try:
        return json.loads(params_str)
    except Exception:
        return params_str


@router.get("/rules", response_model=List[CustomRuleResponse])
async def list_rules(db: Session = Depends(get_db)):
    """
    Returns all defined custom validation rules.
    """
    rules = db.query(CustomRule).all()
    results = []
    for r in rules:
        results.append(
            CustomRuleResponse(
                id=r.id,
                name=r.name,
                rule_type=r.rule_type,
                target_column=r.target_column,
                parameters=_deserialize_params(r.parameters),
                is_active=r.is_active,
                created_at=r.created_at,
            )
        )
    return results


@router.post("/rules", response_model=CustomRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(rule_in: CustomRuleCreate, db: Session = Depends(get_db)):
    """
    Creates and saves a new custom validation rule.
    """
    params_str = _serialize_params(rule_in.parameters)

    db_rule = CustomRule(
        name=rule_in.name,
        rule_type=rule_in.rule_type,
        target_column=rule_in.target_column,
        parameters=params_str,
        is_active=rule_in.is_active,
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)

    return CustomRuleResponse(
        id=db_rule.id,
        name=db_rule.name,
        rule_type=db_rule.rule_type,
        target_column=db_rule.target_column,
        parameters=_deserialize_params(db_rule.parameters),
        is_active=db_rule.is_active,
        created_at=db_rule.created_at,
    )


@router.delete("/rules/{rule_id}", status_code=status.HTTP_200_OK)
async def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    """
    Deletes a custom validation rule by ID.
    """
    db_rule = db.query(CustomRule).filter(CustomRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule with id {rule_id} not found."
        )

    db.delete(db_rule)
    db.commit()
    return {"message": f"Rule {rule_id} deleted successfully."}


@router.post("/dataset/{upload_id}/evaluate-rules", response_model=RuleEvaluationResponse)
async def evaluate_rules_on_dataset(
    upload_id: int,
    request: Optional[RuleEvaluateRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Evaluates custom validation rules against a dataset.
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

    rules_to_eval = []

    if request and request.rule_ids:
        db_rules = db.query(CustomRule).filter(CustomRule.id.in_(request.rule_ids)).all()
        for r in db_rules:
            rules_to_eval.append({
                "id": r.id,
                "name": r.name,
                "column": r.target_column,
                "operator": r.rule_type,
                "parameters": _deserialize_params(r.parameters),
            })

    if request and request.rules:
        for r_item in request.rules:
            rules_to_eval.append({
                "id": None,
                "name": r_item.name,
                "column": r_item.target_column,
                "operator": r_item.rule_type,
                "parameters": r_item.parameters,
            })

    # If no specific rules provided in request, load all active DB rules
    if not rules_to_eval:
        db_rules = db.query(CustomRule).filter(CustomRule.is_active == True).all()
        for r in db_rules:
            rules_to_eval.append({
                "id": r.id,
                "name": r.name,
                "column": r.target_column,
                "operator": r.rule_type,
                "parameters": _deserialize_params(r.parameters),
            })

    eval_summary = evaluate_all_rules(df, rules_to_eval)

    eval_items = []
    all_failed_indices = set()

    for item in eval_summary.get("rule_results", []):
        failed_mask = item.get("failed_mask")
        violating_indices = df.index[failed_mask].tolist() if failed_mask is not None else []
        all_failed_indices.update(violating_indices)

        eval_items.append(
            RuleEvaluationItem(
                rule_id=item.get("rule_id"),
                name=item.get("name", "Custom Rule"),
                column=item.get("column", ""),
                rule_type=item.get("operator", ""),
                total_rows=item.get("total_rows", len(df)),
                violating_count=item.get("violations_count", 0),
                violating_pct=item.get("violations_percentage", 0.0),
                violating_indices=violating_indices[:100],  # cap indices preview
                error=item.get("error"),
            )
        )

    return RuleEvaluationResponse(
        upload_id=upload_id,
        total_rules=eval_summary.get("total_rules", 0),
        total_violations=eval_summary.get("overall_violations_count", 0),
        unique_violating_rows=len(all_failed_indices),
        evaluated_rules=eval_items,
    )
