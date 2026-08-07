"""
Automated unit and integration tests for DataCleanAI ML & AI capabilities.
"""

import io
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
import pandas as pd
import numpy as np

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.main import app
from app.database.connection import init_db
from app.services.ai_engine import (
    detect_anomalies_isolation_forest,
    impute_knn,
    impute_mice,
    detect_fuzzy_duplicates,
    classify_semantic_types,
)

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()


def test_ai_engine_services_unit():
    # 1. Test Isolation Forest Anomaly Detection
    df_anomaly = pd.DataFrame({
        "val1": [10.0, 11.0, 10.5, 9.8, 10.2, 1000.0],
        "val2": [5.0, 5.2, 4.9, 5.1, 5.0, 500.0]
    })
    res_anom = detect_anomalies_isolation_forest(df_anomaly, contamination=0.2)
    assert res_anom["total_rows"] == 6
    assert res_anom["anomalies_count"] > 0
    assert 5 in res_anom["outlier_indices"]  # Index 5 is the extreme outlier (1000, 500)

    # 2. Test KNN Imputation
    df_knn = pd.DataFrame({
        "a": [1.0, 2.0, np.nan, 4.0, 5.0],
        "b": [10.0, np.nan, 30.0, 40.0, 50.0]
    })
    df_knn_imputed, cols_knn, count_knn = impute_knn(df_knn, n_neighbors=2)
    assert count_knn == 2
    assert set(cols_knn) == {"a", "b"}
    assert not df_knn_imputed.isna().any().any()

    # 3. Test MICE Imputation
    df_mice = pd.DataFrame({
        "x": [10.0, 20.0, 30.0, np.nan, 50.0],
        "y": [100.0, np.nan, 300.0, 400.0, 500.0]
    })
    df_mice_imputed, cols_mice, count_mice = impute_mice(df_mice, max_iter=5)
    assert count_mice == 2
    assert not df_mice_imputed.isna().any().any()

    # 4. Test Fuzzy Duplicates
    df_fuzzy = pd.DataFrame({
        "name": ["Johnathan Smith", "Jonathan Smith", "Alice Walker", "Bob Marley", "Jonathan  Smith"],
        "city": ["New York", "New York", "Chicago", "London", "New York"]
    })
    res_fuzzy = detect_fuzzy_duplicates(df_fuzzy, text_columns=["name", "city"], threshold=80.0)
    assert res_fuzzy["total_clusters"] >= 1
    assert res_fuzzy["total_duplicate_rows"] >= 1

    # 5. Test Semantic Types Classification
    df_semantic = pd.DataFrame({
        "user_email": ["john@example.com", "alice@domain.org", "support@company.co.uk"],
        "user_phone": ["+1-555-0199", "+44 20 7946 0912", "555-123-4567"],
        "ip_addr": ["192.168.1.1", "10.0.0.1", "172.16.254.1"],
        "price": ["$19.99", "$100.00", "$5.50"],
        "created_date": ["2023-01-15", "2023-02-20", "2023-03-25"]
    })
    res_sem = classify_semantic_types(df_semantic)
    assert res_sem["user_email"]["predicted_type"] == "email"
    assert res_sem["user_phone"]["predicted_type"] == "phone"
    assert res_sem["ip_addr"]["predicted_type"] == "ip_address"
    assert res_sem["price"]["predicted_type"] == "currency"
    assert res_sem["created_date"]["predicted_type"] == "date"


def test_ai_api_endpoints_integration():
    # Prepare CSV dataset with missing values, anomalies, fuzzy duplicates, and semantic columns
    csv_data = (
        "id,email,phone,salary,score\n"
        "1,john.doe@example.com,+1-555-0123,50000,85\n"
        "2,jon.doe@example.com,+1-555-0123,50500,86\n"
        "3,alice@company.org,+1-555-9876,60000,N/A\n"
        "4,bob@company.org,+1-555-4321,N/A,90\n"
        "5,outlier@test.com,+1-555-0000,999999,999\n"
    )
    file_bytes = csv_data.encode("utf-8")
    files = {"file": ("ai_test_dataset.csv", io.BytesIO(file_bytes), "text/csv")}

    # Upload dataset
    res_upload = client.post("/api/upload", files=files)
    assert res_upload.status_code == 201
    upload_id = res_upload.json()["upload_id"]

    # 1. GET /api/dataset/{upload_id}/ai/semantic-types
    res_sem = client.get(f"/api/dataset/{upload_id}/ai/semantic-types")
    assert res_sem.status_code == 200
    sem_data = res_sem.json()
    assert sem_data["upload_id"] == upload_id
    assert sem_data["columns"]["email"]["predicted_type"] == "email"
    assert sem_data["columns"]["phone"]["predicted_type"] == "phone"

    # 2. POST /api/dataset/{upload_id}/ai/detect-anomalies
    anom_payload = {
        "contamination": 0.2,
        "n_estimators": 50,
        "auto_remove": False
    }
    res_anom = client.post(f"/api/dataset/{upload_id}/ai/detect-anomalies", json=anom_payload)
    assert res_anom.status_code == 200
    anom_data = res_anom.json()
    assert anom_data["upload_id"] == upload_id
    assert "anomalies_count" in anom_data
    assert len(anom_data["outlier_indices"]) >= 0

    # 3. POST /api/dataset/{upload_id}/ai/impute-knn
    knn_payload = {
        "n_neighbors": 2,
        "apply_to_dataset": True
    }
    res_knn = client.post(f"/api/dataset/{upload_id}/ai/impute-knn", json=knn_payload)
    assert res_knn.status_code == 200
    knn_data = res_knn.json()
    assert knn_data["upload_id"] == upload_id
    assert knn_data["imputed_cells_count"] >= 1

    # 4. POST /api/dataset/{upload_id}/ai/fuzzy-dedup
    fuzzy_payload = {
        "text_columns": ["email"],
        "threshold": 75.0,
        "auto_remove": False
    }
    res_fuzzy = client.post(f"/api/dataset/{upload_id}/ai/fuzzy-dedup", json=fuzzy_payload)
    assert res_fuzzy.status_code == 200
    fuzzy_data = res_fuzzy.json()
    assert fuzzy_data["upload_id"] == upload_id
    assert fuzzy_data["total_clusters"] >= 1
