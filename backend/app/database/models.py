"""
SQLAlchemy models for DataCleanAI.
Supports PostgreSQL and SQLite backends.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Upload(Base):
    """Model tracking uploaded files and basic dataset metrics."""
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=True)
    file_size = Column(Integer, nullable=True)  # file size in bytes
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    cleaning_logs = relationship("CleaningLog", back_populates="upload", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Upload(id={self.id}, filename='{self.filename}', rows={self.row_count}, cols={self.column_count})>"


class CleaningLog(Base):
    """Model logging each data cleaning transformation applied to a dataset."""
    __tablename__ = "cleaning_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    upload_id = Column(Integer, ForeignKey("uploads.id", ondelete="CASCADE"), nullable=True)
    action = Column(String(100), nullable=False)  # e.g., 'remove_duplicates', 'fill_missing', 'trim_whitespace'
    column_name = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)  # Detailed summary or JSON string of changes
    rows_affected = Column(Integer, default=0, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    upload = relationship("Upload", back_populates="cleaning_logs")

    def __repr__(self):
        return f"<CleaningLog(id={self.id}, upload_id={self.upload_id}, action='{self.action}', column='{self.column_name}')>"


class CustomRule(Base):
    """Model storing custom validation rules defined by users."""
    __tablename__ = "custom_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    rule_type = Column(String(100), nullable=False)  # e.g., 'gt', '<', 'regex', 'range', 'enum'
    target_column = Column(String(255), nullable=False)
    parameters = Column(Text, nullable=True)  # JSON-encoded parameters or raw scalar value string
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<CustomRule(id={self.id}, name='{self.name}', target_column='{self.target_column}', type='{self.rule_type}')>"
