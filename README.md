# DataCleanAI 🧬
> **AI & Machine Learning-Powered Automated Data Quality Assessment & Dataset Cleaning Platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.3.0+-F7931E.svg?style=flat&logo=scikit-learn)](https://scikit-learn.org/)
[![DuckDB](https://img.shields.io/badge/DuckDB-0.9.0+-FFF000.svg?style=flat)](https://duckdb.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python)](https://www.python.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-red.svg?style=flat)](https://www.sqlalchemy.org/)

---

## 🌟 Overview

**DataCleanAI** is an enterprise data quality assessment and automated dataset cleaning platform. It empowers data teams, analysts, and engineers to profile large tabular datasets, compute 4-dimensional quality scores, enforce custom business validation rules, execute AI-driven data remediation, run in-memory DuckDB SQL queries, and generate executive audit reports.

---

## 🤖 Machine Learning & AI Capabilities

- **🌲 Isolation Forest Anomaly Detection**: Unsupervised multi-variable numerical outlier detection (`sklearn.ensemble.IsolationForest`) that scores anomaly likelihood across correlated columns.
- **🎯 KNN & MICE Smart Imputation**: Machine learning prediction of missing values based on feature correlations (`sklearn.impute.KNNImputer` & `IterativeImputer`).
- **🔗 Fuzzy Entity Linkage & Deduplication**: Near-duplicate entity clustering (`rapidfuzz` / Levenshtein string distance with Union-Find graph clustering).
- **🔍 Semantic PII Classifier**: Automated pattern and heuristic classifier detecting `EMAIL`, `PHONE`, `CREDIT_CARD`, `IP_ADDRESS`, `UUID`, `CURRENCY`, `DATE`, `SSN`, and flagging PII attributes.

---

## ✨ Core Features

- **⚡ 1 GB File Upload Support**: Multi-gigabyte stream processing for `.csv`, `.xlsx`, `.xls`, and `.json` datasets up to **1 GB**.
- **🦆 DuckDB In-Memory SQL Console**: Execute high-speed raw SQL queries (`SELECT`, `GROUP BY`, aggregate functions) directly against table `dataset` in the web UI.
- **📊 4-Dimension Quality Scoring Engine**:
  - **Completeness**: Analyzes missing and empty cell ratios.
  - **Validity**: Evaluates data type mismatches and custom rule violations.
  - **Uniqueness**: Calculates exact duplicate row frequencies.
  - **Consistency**: Evaluates numerical distribution outliers using Interquartile Range (IQR).
- **📏 Custom Validation Rules Builder**: Define business constraints (`Age >= 18`, `Salary > 0`, `Email contains @`, Regex) with persistent DB storage and live violation row previews.
- **🧹 Interactive Cleaning Workbench**:
  - Machine learning null imputation (KNN, MICE, Mean, Median, Mode, Constant, or Row Drop).
  - Row deduplication with column subset selection.
  - Outlier capping and filtering (Isolation Forest / IQR).
  - String normalization (trimming whitespace, case standardization, regex cleaning).
  - Type casting & format coercion.
- **📋 Multi-Format Executive Reports**:
  - Export clean datasets as `.csv` or formatted `.xlsx`.
  - 1-click generation of self-contained **HTML Audit Reports** and **WeasyPrint PDF Reports** with before/after score gains.
- **📁 Persistent Audit History**: PostgreSQL / SQLite database integration tracking upload history, row metrics, and per-action transformation audit logs.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Launch Backend API Server
```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Launch FastAPI backend on port 8000
python run.py
```
- Server: **`http://localhost:8000`**
- Interactive Swagger API Docs: **`http://localhost:8000/docs`**

### 2. Launch React Frontend SPA
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
- Open **`http://localhost:5173`** in your browser!

---

## 🧪 Testing

Run backend unit and integration tests (including AI suite) using `pytest`:
```bash
cd backend
pytest
```

Run frontend production build verification:
```bash
cd frontend
npm run build
```
