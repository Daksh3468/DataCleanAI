<div align="center">

<img src="assets/logo.jpg" alt="DataCleanAI Logo" width="340" />

### AI & Machine Learning-Powered Automated Data Quality Assessment & Cleaning Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.3.0+-F7931E.svg?style=for-the-badge&logo=scikit-learn)](https://scikit-learn.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=for-the-badge&logo=python)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=for-the-badge&logo=docker)](https://www.docker.com/)

**[Live Demo](#quick-start) · [API Docs](http://localhost:8000/docs) · [Report Bug](https://github.com/Daksh3468/DataCleanAI/issues)**

</div>

---

## 🔍 The Problem

> **80% of time in data science is spent cleaning data — not building models.**

Raw datasets arrive with missing values, duplicate records, type mismatches, outliers, PII exposure risks, and business rule violations. Manual cleaning is slow, error-prone, and leaves no audit trail.

---

## ✅ The Solution — DataCleanAI

DataCleanAI is an **enterprise-grade automated data quality and cleaning engine** that transforms raw, messy tabular datasets into clean, validated, production-ready data in minutes — with a full ML-powered pipeline, visual quality scores, and auditable transformation history.

```
Upload CSV/Excel  →  Profile & Score  →  Validate Rules  →  ML Clean  →  Export
```

---

## ✨ Features

| Feature | Description |
|---|---|
| ⚡ **1 GB Upload Support** | Stream-process CSV, Excel, JSON datasets up to 1 GB |
| 📊 **4D Quality Scoring** | Completeness, Validity, Uniqueness, Consistency scoring engine |
| 🤖 **Isolation Forest** | Unsupervised ML multi-column outlier detection |
| 🎯 **KNN & MICE Imputation** | Predict missing values using feature correlation ML models |
| 🔗 **Fuzzy Deduplication** | RapidFuzz Levenshtein distance near-duplicate entity clustering |
| 🔍 **PII Classifier** | Semantic detection of EMAIL, PHONE, SSN, CREDIT_CARD, IP fields |
| 📏 **Custom Rules Builder** | Define business constraints (`Age >= 18`, `Salary > 0`, regex) |
| 🦆 **DuckDB SQL Console** | Run raw SQL queries in-browser against your dataset |
| 📋 **HTML Audit Reports** | Self-contained before/after quality comparison reports |
| 🗂️ **Data Lineage Graph** | Visual versioning trail from Raw → Cleaned dataset |
| 🐳 **Docker Ready** | One-command `docker compose up` deployment |

---

## 🚀 Quick Start

### Option 1 — Docker (Recommended) 🐳

```bash
git clone https://github.com/Daksh3468/DataCleanAI.git
cd DataCleanAI

# Start entire stack (PostgreSQL + Backend + Frontend)
docker compose up --build
```

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost |
| ⚙️ Backend API | http://localhost:8000 |
| 📖 API Docs (Swagger) | http://localhost:8000/docs |

---

### Option 2 — Local Development

**Prerequisites:** Python 3.11+, Node.js 18+, npm

```bash
git clone https://github.com/Daksh3468/DataCleanAI.git
cd DataCleanAI
```

**1. Backend**
```bash
cd backend
cp ../.env.example ../.env

pip install -r requirements.txt
python run.py
# → http://localhost:8000
```

**2. Frontend**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---



## 🧪 Testing

```bash
# Backend — pytest suite
cd backend
pytest

# Frontend — TypeScript type check + Vite production build
cd frontend
npm run build
```

**Current test coverage:** 8/8 backend integration tests passing ✅

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

<div align="center">
  <strong>Built by <a href="https://github.com/Daksh3468">Daksh</a></strong>
</div>
