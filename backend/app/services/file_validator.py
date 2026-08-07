"""
File validator service for DataCleanAI.
Validates uploaded dataset files for allowed extension, file size limits, and CSV encoding.
"""

import os
import io
import pathlib
from typing import Tuple, Dict, Any, Optional, Union

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json"}
MAX_FILE_SIZE_MB = 1024.0  # 1 GB (1024 MB) limit


class ValidationResult(tuple):
    """
    Subclass of tuple (is_valid: bool, error_message: str, metadata: dict)
    that allows both tuple unpacking and dict-style key access.
    """
    def __new__(cls, is_valid: bool, error_message: str, metadata: dict):
        return super().__new__(cls, (is_valid, error_message, metadata))

    def __init__(self, is_valid: bool, error_message: str, metadata: dict):
        self.is_valid = is_valid
        self.error_message = error_message
        self.metadata = metadata

    def __getitem__(self, item):
        if isinstance(item, int):
            return super().__getitem__(item)
        if isinstance(item, str):
            if item == "is_valid":
                return self.is_valid
            elif item in ("error_message", "error"):
                return self.error_message
            elif item in self.metadata:
                return self.metadata[item]
            elif item == "metadata":
                return self.metadata
            elif item == "errors":
                return [self.error_message] if self.error_message else []
        raise KeyError(f"Invalid key '{item}' in ValidationResult")

    def get(self, key: str, default: Any = None) -> Any:
        try:
            return self[key]
        except (KeyError, TypeError):
            return default


def detect_encoding(file_input: Any, sample_bytes: int = 10000) -> str:
    """
    Detects encoding for a file path or file-like object.
    Defaults to 'utf-8' if detection fails or file is empty.
    """
    raw_sample = b""
    
    if isinstance(file_input, (str, pathlib.Path)):
        filepath = str(file_input)
        if os.path.isfile(filepath):
            try:
                with open(filepath, "rb") as f:
                    raw_sample = f.read(sample_bytes)
            except Exception:
                pass
    elif hasattr(file_input, "read"):
        try:
            current_pos = 0
            if hasattr(file_input, "tell"):
                try:
                    current_pos = file_input.tell()
                except Exception:
                    current_pos = 0

            raw_sample = file_input.read(sample_bytes)

            if hasattr(file_input, "seek"):
                try:
                    file_input.seek(current_pos)
                except Exception:
                    pass
        except Exception:
            pass

    if not raw_sample:
        return "utf-8"

    try:
        import chardet
        res = chardet.detect(raw_sample)
        if res and res.get("encoding") and res.get("confidence", 0) > 0.5:
            enc = res["encoding"].lower()
            if enc == "ascii":
                return "utf-8"
            return enc
    except Exception:
        pass

    for enc in ["utf-8", "utf-8-sig", "cp1252", "latin-1", "iso-8859-1"]:
        try:
            raw_sample.decode(enc)
            return enc
        except Exception:
            continue

    return "utf-8"


def get_file_info(file_input: Any) -> Tuple[str, str, int]:
    """
    Extracts filename, extension, and file size in bytes from file path or file-like object.
    """
    if isinstance(file_input, (str, pathlib.Path)):
        filepath = str(file_input)
        filename = os.path.basename(filepath)
        ext = os.path.splitext(filename)[1].lower()
        size_bytes = os.path.getsize(filepath) if os.path.exists(filepath) else 0
        return filename, ext, size_bytes

    filename = getattr(file_input, "filename", getattr(file_input, "name", "uploaded_file"))
    ext = os.path.splitext(filename)[1].lower()

    size_bytes = getattr(file_input, "size", 0)
    if size_bytes == 0 and hasattr(file_input, "seek") and hasattr(file_input, "tell"):
        try:
            current_pos = file_input.tell()
            file_input.seek(0, os.SEEK_END)
            size_bytes = file_input.tell()
            file_input.seek(current_pos)
        except Exception:
            size_bytes = 0

    return filename, ext, size_bytes


def validate_file(
    file_input: Any, 
    max_size_mb: float = MAX_FILE_SIZE_MB, 
    allowed_extensions: Optional[set] = None
) -> ValidationResult:
    """
    Validates an uploaded dataset file or path.

    Checks:
      1. File existence / non-null.
      2. File size limit (default: 1024MB / 1GB).
      3. Allowed extension (.csv, .xlsx, .xls, .json).
      4. Encoding detection for CSV files.
    """
    if allowed_extensions is None:
        allowed_extensions = ALLOWED_EXTENSIONS
    else:
        allowed_extensions = {ext.lower() if ext.startswith(".") else f".{ext.lower()}" for ext in allowed_extensions}

    if file_input is None:
        return ValidationResult(False, "No file provided.", {
            "filename": "", "extension": "", "size_bytes": 0, "size_mb": 0.0, "encoding": None, "is_valid": False
        })

    if isinstance(file_input, (str, pathlib.Path)):
        filepath = str(file_input)
        if not os.path.exists(filepath):
            return ValidationResult(False, f"File not found: '{filepath}'", {
                "filename": os.path.basename(filepath), "extension": os.path.splitext(filepath)[1].lower(),
                "size_bytes": 0, "size_mb": 0.0, "encoding": None, "is_valid": False
            })

    filename, ext, size_bytes = get_file_info(file_input)
    size_mb = round(size_bytes / (1024 * 1024), 2)

    if size_bytes == 0 and not isinstance(file_input, (str, pathlib.Path)):
        if hasattr(file_input, "getvalue") and len(file_input.getvalue()) > 0:
            size_bytes = len(file_input.getvalue())
            size_mb = round(size_bytes / (1024 * 1024), 2)

    if size_bytes == 0:
        return ValidationResult(False, f"File '{filename}' is empty (0 bytes).", {
            "filename": filename, "extension": ext, "size_bytes": 0, "size_mb": 0.0, "encoding": None, "is_valid": False
        })

    max_bytes = max_size_mb * 1024 * 1024
    if size_bytes > max_bytes:
        return ValidationResult(
            False,
            f"File size ({size_mb:.2f} MB) exceeds maximum allowed limit of {max_size_mb} MB.",
            {
                "filename": filename,
                "extension": ext,
                "size_bytes": size_bytes,
                "size_mb": size_mb,
                "encoding": None,
                "is_valid": False
            }
        )

    if ext not in allowed_extensions:
        return ValidationResult(
            False,
            f"Unsupported file format '{ext}'. Allowed extensions: {', '.join(sorted(allowed_extensions))}",
            {
                "filename": filename,
                "extension": ext,
                "size_bytes": size_bytes,
                "size_mb": size_mb,
                "encoding": None,
                "is_valid": False
            }
        )

    encoding = None
    if ext == ".csv":
        encoding = detect_encoding(file_input)

    metadata = {
        "filename": filename,
        "extension": ext,
        "size_bytes": size_bytes,
        "size_mb": size_mb,
        "encoding": encoding,
        "is_valid": True,
        "errors": []
    }

    return ValidationResult(True, "", metadata)


def read_dataset(uploaded_file: Any, encoding: Optional[str] = None) -> Optional[Any]:
    """
    Reads an uploaded file or path into a pandas DataFrame.
    """
    import pandas as pd
    
    if uploaded_file is None:
        return None

    filename, ext, _ = get_file_info(uploaded_file)

    if hasattr(uploaded_file, "seek"):
        try:
            uploaded_file.seek(0)
        except Exception:
            pass

    try:
        if ext == ".csv":
            enc = encoding or detect_encoding(uploaded_file)
            try:
                df = pd.read_csv(uploaded_file, encoding=enc)
            except UnicodeDecodeError:
                if hasattr(uploaded_file, "seek"):
                    uploaded_file.seek(0)
                df = pd.read_csv(uploaded_file, encoding="latin-1")
            return df

        elif ext in [".xlsx", ".xls"]:
            return pd.read_excel(uploaded_file)

        elif ext == ".json":
            return pd.read_json(uploaded_file)

        else:
            return None
    except Exception as e:
        raise ValueError(f"Failed to parse '{filename}': {str(e)}")
