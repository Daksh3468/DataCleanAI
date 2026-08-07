# 📂 Sample Datasets for Testing & Quality Profiling

This directory contains real-world and synthetic sample datasets for testing **DataCleanAI**'s automated profiling, machine learning cleaning pipelines, custom rule validation, and DuckDB SQL console features.

---

### 📊 Available Test Datasets

| Dataset File | Description & Domain | Size / Rows | Key Testing Use Case |
|---|---|---|---|
| 📁 [`Messy_Employee_dataset.csv`](Messy_Employee_dataset.csv) | HR & Payroll Dataset | ~1,020 rows | Outlier salaries, missing email/age, whitespace normalization, custom rule validation |
| 📁 [`crime_incidents_messy.csv`](crime_incidents_messy.csv) | Law Enforcement & Incident Logs | ~5,250 rows | High missingness, weapon classification, date format normalization, group-by SQL analytics |
| 📁 [`online_retail_real_world.csv`](online_retail_real_world.csv) | E-Commerce Sales & Orders | ~3,000 rows | Unit price outliers, quantity anomalies, missing customer IDs, revenue correlation |
| 📁 [`gender_submission.csv`](gender_submission.csv) | Kaggle Classification Benchmark | ~418 rows | Uniqueness verification, binary type casting, ID duplicate detection |

---

### 🚀 How to Use

1. Launch **DataCleanAI** (`http://localhost:5173`).
2. Go to **Upload Dataset** and drag & drop any file from `sample_datasets/`.
3. Explore **Quality Profile**, run **Custom Rules**, apply **AI/ML Cleaning**, and execute **DuckDB SQL queries**!
