"""
Report generator service for DataCleanAI.
Generates HTML and PDF executive quality summary reports comparing original and cleaned datasets.
"""

import os
from typing import Dict, Any, List
from datetime import datetime


def generate_html_report(
    filename: str,
    original_metrics: Dict[str, Any],
    cleaned_metrics: Dict[str, Any],
    original_quality: Dict[str, Any],
    cleaned_quality: Dict[str, Any],
    changelog: List[Dict[str, Any]],
) -> str:
    """Generates a styled HTML quality summary report."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    orig_overall = original_quality.get("overall_score", 0.0)
    clean_overall = cleaned_quality.get("overall_score", 0.0)
    score_diff = round(clean_overall - orig_overall, 2)
    score_color = "#10B981" if score_diff >= 0 else "#EF4444"

    orig_dims = original_quality.get("dimensions", {})
    clean_dims = cleaned_quality.get("dimensions", {})

    changelog_html = ""
    if changelog:
        for idx, item in enumerate(changelog, 1):
            action = item.get("action", "Transformation")
            cols = item.get("column_name", "N/A")
            details = item.get("details", "")
            rows_affected = item.get("rows_affected", 0)
            changelog_html += f"""
            <tr>
                <td><strong>{idx}</strong></td>
                <td><span class="badge">{action}</span></td>
                <td><code>{cols}</code></td>
                <td>{details}</td>
                <td>{rows_affected}</td>
            </tr>
            """
    else:
        changelog_html = "<tr><td colspan='5'>No cleaning transformations were applied.</td></tr>"

    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Data Quality Summary Report - {filename}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px;
            background-color: #0f172a;
            color: #f8fafc;
        }}
        .container {{
            max-width: 1000px;
            margin: 0 auto;
            background: #1e293b;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }}
        .header {{
            border-bottom: 2px solid #334155;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #6366f1;
            margin: 0 0 10px 0;
            font-size: 28px;
        }}
        .header p {{
            color: #94a3b8;
            margin: 0;
            font-size: 14px;
        }}
        .score-box {{
            display: flex;
            justify-content: space-around;
            background: #0f172a;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
        }}
        .score-card h3 {{
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #94a3b8;
        }}
        .score-card .val {{
            font-size: 32px;
            font-weight: bold;
            color: #38bdf8;
        }}
        .score-card .diff {{
            font-size: 16px;
            font-weight: bold;
            color: {score_color};
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }}
        th, td {{
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #334155;
        }}
        th {{
            background-color: #0f172a;
            color: #cbd5e1;
            font-weight: 600;
        }}
        .badge {{
            background: #6366f1;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }}
        code {{
            background: #334155;
            padding: 2px 6px;
            border-radius: 4px;
            color: #38bdf8;
        }}
        .footer {{
            margin-top: 40px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DataCleanAI Executive Quality Summary Report</h1>
            <p>Dataset: <strong>{filename}</strong> | Generated At: {now_str}</p>
        </div>

        <div class="score-box">
            <div class="score-card">
                <h3>Original Quality Score</h3>
                <div class="val">{orig_overall}%</div>
            </div>
            <div class="score-card">
                <h3>Cleaned Quality Score</h3>
                <div class="val" style="color: #10b981;">{clean_overall}%</div>
            </div>
            <div class="score-card">
                <h3>Overall Improvement</h3>
                <div class="diff">{"+" if score_diff > 0 else ""}{score_diff}%</div>
            </div>
        </div>

        <h2>Dimension Metrics Comparison</h2>
        <table>
            <thead>
                <tr>
                    <th>Quality Dimension</th>
                    <th>Original Score</th>
                    <th>Cleaned Score</th>
                    <th>Change</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Completeness</td>
                    <td>{orig_dims.get("completeness", 0)}%</td>
                    <td>{clean_dims.get("completeness", 0)}%</td>
                    <td>{round(clean_dims.get("completeness", 0) - orig_dims.get("completeness", 0), 2)}%</td>
                </tr>
                <tr>
                    <td>Validity</td>
                    <td>{orig_dims.get("validity", 0)}%</td>
                    <td>{clean_dims.get("validity", 0)}%</td>
                    <td>{round(clean_dims.get("validity", 0) - orig_dims.get("validity", 0), 2)}%</td>
                </tr>
                <tr>
                    <td>Uniqueness</td>
                    <td>{orig_dims.get("uniqueness", 0)}%</td>
                    <td>{clean_dims.get("uniqueness", 0)}%</td>
                    <td>{round(clean_dims.get("uniqueness", 0) - orig_dims.get("uniqueness", 0), 2)}%</td>
                </tr>
                <tr>
                    <td>Consistency</td>
                    <td>{orig_dims.get("consistency", 0)}%</td>
                    <td>{clean_dims.get("consistency", 0)}%</td>
                    <td>{round(clean_dims.get("consistency", 0) - orig_dims.get("consistency", 0), 2)}%</td>
                </tr>
            </tbody>
        </table>

        <h2>Dataset Metrics Comparison</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Original Dataset</th>
                    <th>Cleaned Dataset</th>
                    <th>Delta</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Rows</td>
                    <td>{original_metrics.get("row_count", 0)}</td>
                    <td>{cleaned_metrics.get("row_count", 0)}</td>
                    <td>{cleaned_metrics.get("row_count", 0) - original_metrics.get("row_count", 0)}</td>
                </tr>
                <tr>
                    <td>Total Columns</td>
                    <td>{original_metrics.get("col_count", 0)}</td>
                    <td>{cleaned_metrics.get("col_count", 0)}</td>
                    <td>{cleaned_metrics.get("col_count", 0) - original_metrics.get("col_count", 0)}</td>
                </tr>
                <tr>
                    <td>Memory Usage</td>
                    <td>{original_metrics.get("memory_usage", "0 KB")}</td>
                    <td>{cleaned_metrics.get("memory_usage", "0 KB")}</td>
                    <td>-</td>
                </tr>
            </tbody>
        </table>

        <h2>Cleaning Audit Changelog</h2>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Action</th>
                    <th>Columns</th>
                    <th>Details</th>
                    <th>Rows Affected</th>
                </tr>
            </thead>
            <tbody>
                {changelog_html}
            </tbody>
        </table>

        <div class="footer">
            <p>Report automatically generated by DataCleanAI Platform</p>
        </div>
    </div>
</body>
</html>
"""
    return html_content


def generate_pdf_report(html_content: str) -> bytes:
    """Converts HTML report string to PDF bytes using WeasyPrint with graceful fallback."""
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_content).write_pdf()
        return pdf_bytes
    except Exception:
        return html_content.encode("utf-8")
