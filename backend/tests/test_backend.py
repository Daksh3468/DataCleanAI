"""
Comprehensive automated tests for DataCleanAI FastAPI REST API backend.
"""

import sys
from pathlib import Path
import io
import pytest
from fastapi.testclient import TestClient

# Ensure backend path is in sys.path
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.main import app
from app.database.connection import init_db

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "DataCleanAI" in data["service"]


def test_upload_and_pipeline():
    # 1. Test POST /api/upload
    csv_content = (
        "name,age,salary,city\n"
        "Alice, 25 , 50000 , New York\n"
        "Bob,30,60000,Chicago\n"
        "Alice, 25 , 50000 , New York\n"
        "Charlie,N/A,70000,Seattle\n"
        "David,40,invalid,Boston\n"
    )
    file_bytes = csv_content.encode("utf-8")

    files = {"file": ("test_dataset.csv", io.BytesIO(file_bytes), "text/csv")}
    res_upload = client.post("/api/upload", files=files)
    assert res_upload.status_code == 201
    upload_data = res_upload.json()
    assert "upload_id" in upload_data
    upload_id = upload_data["upload_id"]
    assert upload_data["filename"] == "test_dataset.csv"
    assert upload_data["row_count"] == 5
    assert upload_data["column_count"] == 4

    # 2. Test GET /api/dataset/{upload_id}/profile
    res_profile = client.get(f"/api/dataset/{upload_id}/profile")
    assert res_profile.status_code == 200
    profile_data = res_profile.json()
    assert profile_data["upload_id"] == upload_id
    assert profile_data["row_count"] == 5
    assert profile_data["col_count"] == 4
    assert "name" in profile_data["columns"]
    assert len(profile_data["sample_rows"]) > 0

    # 3. Test GET /api/dataset/{upload_id}/quality
    res_quality = client.get(f"/api/dataset/{upload_id}/quality")
    assert res_quality.status_code == 200
    quality_data = res_quality.json()
    assert "overall_score" in quality_data
    assert "dimensions" in quality_data
    assert "completeness" in quality_data["dimensions"]

    # 4. Test Rules Endpoints
    # Create rule
    rule_payload = {
        "name": "Age > 18",
        "rule_type": "gt",
        "target_column": "age",
        "parameters": {"value": 18},
        "is_active": True
    }
    res_rule_create = client.post("/api/rules", json=rule_payload)
    assert res_rule_create.status_code == 201
    rule_data = res_rule_create.json()
    rule_id = rule_data["id"]

    # List rules
    res_rules_list = client.get("/api/rules")
    assert res_rules_list.status_code == 200
    assert any(r["id"] == rule_id for r in res_rules_list.json())

    # Evaluate rules on dataset
    res_eval = client.post(f"/api/dataset/{upload_id}/evaluate-rules", json={"rule_ids": [rule_id]})
    assert res_eval.status_code == 200
    eval_data = res_eval.json()
    assert eval_data["upload_id"] == upload_id
    assert eval_data["total_rules"] >= 1

    # Delete rule
    res_del_rule = client.delete(f"/api/rules/{rule_id}")
    assert res_del_rule.status_code == 200

    # 5. Test POST /api/dataset/{upload_id}/clean
    clean_options = {
        "remove_duplicates": True,
        "trim_whitespace": True,
        "handle_missing": True,
        "missing_strategy": "drop",
    }
    res_clean = client.post(f"/api/dataset/{upload_id}/clean", json=clean_options)
    assert res_clean.status_code == 200
    clean_data = res_clean.json()
    assert clean_data["upload_id"] == upload_id
    assert clean_data["cleaned_row_count"] < 5  # duplicate removed
    assert len(clean_data["changelog"]) > 0

    # 6. Test GET /api/dataset/{upload_id}/export/{format}
    for fmt in ["csv", "excel", "html", "pdf"]:
        res_export = client.get(f"/api/dataset/{upload_id}/export/{fmt}")
        assert res_export.status_code == 200
        assert len(res_export.content) > 0

    # 7. Test GET /api/history
    res_history = client.get("/api/history")
    assert res_history.status_code == 200
    history_data = res_history.json()
    assert len(history_data["uploads"]) > 0
    assert len(history_data["cleaning_logs"]) > 0
