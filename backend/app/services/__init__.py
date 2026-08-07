"""
Services package for DataCleanAI FastAPI Backend.
"""
from app.services.file_validator import validate_file, read_dataset, detect_encoding
from app.services.profiler import profile_dataset
from app.services.quality_scorer import calculate_quality_scores
from app.services.rule_validator import evaluate_all_rules, evaluate_rules, evaluate_rule
from app.services.cleaner import clean_dataset
from app.services.report_generator import generate_html_report, generate_pdf_report
from app.services.dataset_store import dataset_store

__all__ = [
    "validate_file",
    "read_dataset",
    "detect_encoding",
    "profile_dataset",
    "calculate_quality_scores",
    "evaluate_all_rules",
    "evaluate_rules",
    "evaluate_rule",
    "clean_dataset",
    "generate_html_report",
    "generate_pdf_report",
    "dataset_store",
]
