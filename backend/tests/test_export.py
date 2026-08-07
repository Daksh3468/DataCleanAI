"""
Unit & Integration Tests for DataCleanAI Export Router.
Tests CSV, Excel, and HTML file download responses.
"""

import pytest
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app
from app.services.dataset_store import dataset_store

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_dataset():
    """Seed dataset_store with a test dataset."""
    sample_data = {
        "id": [1, 2, 3, 4, 5],
        "name": ["Alice", "Bob", "Charlie", "David", "Eve"],
        "age": [25, 30, 35, None, 45],
        "income": [50000, 60000, 70000, 80000, 90000]
    }
    df = pd.DataFrame(sample_data)
    dataset_store.save_dataset("upl_test123", df)
    dataset_store.save_dataset("default", df)


def test_export_csv_query():
    response = client.get("/api/export/csv?upload_id=upl_test123")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment" in response.headers["content-disposition"]
    assert "Alice" in response.text


def test_export_excel_query():
    response = client.get("/api/export/xlsx?upload_id=upl_test123")
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers["content-type"]
    assert "attachment" in response.headers["content-disposition"]


def test_export_html_report_query():
    response = client.get("/api/export/html?upload_id=upl_test123")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/html; charset=utf-8"
    assert "<html" in response.text.lower()


def test_export_dataset_path():
    response = client.get("/api/dataset/upl_test123/export/csv")
    assert response.status_code == 200
    assert "attachment" in response.headers["content-disposition"]
