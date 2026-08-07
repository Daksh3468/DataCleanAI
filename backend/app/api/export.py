"""
Export API router for DataCleanAI.
GET /api/dataset/{upload_id}/export/{format} - Returns downloadable CSV, Excel, HTML report, or PDF report.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Response
from sqlalchemy.orm import Session
import io
import pandas as pd

from app.database.connection import get_db
from app.database.models import Upload, CleaningLog
from app.services.dataset_store import dataset_store
from app.services.profiler import profile_dataset
from app.services.quality_scorer import calculate_quality_scores
from app.services.report_generator import generate_html_report, generate_pdf_report

router = APIRouter(tags=["Export"])


@router.get("/dataset/{upload_id}/export/{format}")
async def export_dataset(
    upload_id: int,
    format: str,
    db: Session = Depends(get_db)
):
    """
    Exports dataset or executive quality report in specified format:
    - 'csv': Cleaned dataset CSV file download
    - 'excel' / 'xlsx': Cleaned dataset Excel file download
    - 'html': Executive quality summary report HTML file download
    - 'pdf': Executive quality summary report PDF file download
    """
    fmt = format.strip().lower()
    if fmt not in ["csv", "excel", "xlsx", "html", "pdf"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported export format. Supported formats: csv, excel, html, pdf."
        )

    db_upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not db_upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Upload record with id {upload_id} not found."
        )

    base_name = db_upload.filename.rsplit(".", 1)[0] if "." in db_upload.filename else db_upload.filename

    try:
        df_cleaned = dataset_store.get_dataset(upload_id, original=False)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset file for upload_id {upload_id} not found in store."
        )

    # 1. Export CSV
    if fmt == "csv":
        csv_str = df_cleaned.to_csv(index=False)
        return Response(
            content=csv_str.encode("utf-8"),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={base_name}_cleaned.csv"}
        )

    # 2. Export Excel
    elif fmt in ["excel", "xlsx"]:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df_cleaned.to_excel(writer, index=False, sheet_name="Cleaned Data")
        output.seek(0)
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={base_name}_cleaned.xlsx"}
        )

    # 3. Export HTML or PDF Executive Report
    elif fmt in ["html", "pdf"]:
        try:
            df_original = dataset_store.get_dataset(upload_id, original=True)
        except FileNotFoundError:
            df_original = df_cleaned

        orig_profile = profile_dataset(df_original)
        cleaned_profile = profile_dataset(df_cleaned)
        orig_quality = calculate_quality_scores(df_original)
        cleaned_quality = calculate_quality_scores(df_cleaned)

        # Retrieve cleaning logs from DB
        db_logs = db.query(CleaningLog).filter(CleaningLog.upload_id == upload_id).order_by(CleaningLog.timestamp.asc()).all()
        changelog = [
            {
                "action": log.action,
                "column_name": log.column_name,
                "details": log.details,
                "rows_affected": log.rows_affected
            }
            for log in db_logs
        ]

        html_content = generate_html_report(
            filename=db_upload.filename,
            original_metrics=orig_profile,
            cleaned_metrics=cleaned_profile,
            original_quality=orig_quality,
            cleaned_quality=cleaned_quality,
            changelog=changelog
        )

        if fmt == "html":
            return Response(
                content=html_content.encode("utf-8"),
                media_type="text/html",
                headers={"Content-Disposition": f"attachment; filename={base_name}_quality_report.html"}
            )
        else:
            pdf_bytes = generate_pdf_report(html_content)
            media_type = "application/pdf" if pdf_bytes.startswith(b"%PDF") else "text/html"
            ext = "pdf" if media_type == "application/pdf" else "html"
            return Response(
                content=pdf_bytes,
                media_type=media_type,
                headers={"Content-Disposition": f"attachment; filename={base_name}_quality_report.{ext}"}
            )
