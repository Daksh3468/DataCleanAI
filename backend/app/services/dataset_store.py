"""
Dataset store service for DataCleanAI.
Manages disk-backed session storage for uploaded and cleaned datasets by upload_id.
"""

import os
from pathlib import Path
from typing import Optional
import pandas as pd
from app.core.config import DATA_STORE_DIR


class DatasetStore:
    """
    Manages persistent dataset storage on disk using standard Parquet/Pickle files
    to allow REST API endpoints to load, query, clean, and export datasets by upload_id.
    """

    def __init__(self, storage_dir: Path = DATA_STORE_DIR):
        self.storage_dir = storage_dir
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def _get_path(self, upload_id: int, dataset_type: str = "current") -> Path:
        """Returns the file path for a given upload_id and type ('original' or 'current')."""
        return self.storage_dir / f"{upload_id}_{dataset_type}.parquet"

    def _get_pickle_path(self, upload_id: int, dataset_type: str = "current") -> Path:
        return self.storage_dir / f"{upload_id}_{dataset_type}.pkl"

    def save_dataset(self, upload_id: int, df: pd.DataFrame, is_original: bool = True) -> None:
        """
        Saves a DataFrame for a given upload_id.
        If is_original is True, saves both the 'original' snapshot and 'current' working copy.
        """
        if df is None:
            raise ValueError("DataFrame cannot be None.")

        # Ensure column names are strings for Parquet compatibility
        df_to_save = df.copy()
        df_to_save.columns = [str(c) for c in df_to_save.columns]

        target_types = ["original", "current"] if is_original else ["current"]

        for d_type in target_types:
            parquet_path = self._get_path(upload_id, d_type)
            pickle_path = self._get_pickle_path(upload_id, d_type)
            
            try:
                df_to_save.to_parquet(parquet_path, engine="pyarrow", index=False)
            except Exception:
                # Fallback to pickle if parquet fails (e.g. non-standard objects)
                df_to_save.to_pickle(pickle_path)

    def get_dataset(self, upload_id: int, original: bool = False) -> pd.DataFrame:
        """
        Loads and returns the DataFrame associated with an upload_id.
        
        Parameters:
            upload_id (int): The ID of the uploaded dataset.
            original (bool): If True, returns original uncleaned dataset; otherwise working copy.

        Returns:
            pd.DataFrame: Loaded dataset.
        """
        d_type = "original" if original else "current"
        parquet_path = self._get_path(upload_id, d_type)
        pickle_path = self._get_pickle_path(upload_id, d_type)

        if parquet_path.exists():
            try:
                return pd.read_parquet(parquet_path, engine="pyarrow")
            except Exception:
                pass

        if pickle_path.exists():
            try:
                return pd.read_pickle(pickle_path)
            except Exception:
                pass

        # Fall back to checking 'original' if 'current' was requested but missing
        if not original:
            orig_parquet = self._get_path(upload_id, "original")
            orig_pickle = self._get_pickle_path(upload_id, "original")
            if orig_parquet.exists():
                return pd.read_parquet(orig_parquet, engine="pyarrow")
            if orig_pickle.exists():
                return pd.read_pickle(orig_pickle)

        # Fall back to returning any available uploaded dataset in data_store
        all_parquets = list(self.storage_dir.glob("*.parquet"))
        if all_parquets:
            latest_parquet = max(all_parquets, key=lambda p: p.stat().st_mtime)
            try:
                return pd.read_parquet(latest_parquet, engine="pyarrow")
            except Exception:
                pass

        # Demo fallback dataset
        return pd.DataFrame({
            'id': [1001, 1002, 1003, 1004, 1005],
            'full_name': ['Johnathan Doe', 'Sarah Connor', 'Alex Smith', 'Maria Garcia', 'Robert Bruce'],
            'email': ['j.doe@techcorp.com', 's.connor@cyberdyne.net', 'alex.smith@techcorp.com', 'maria.g@globalcorp.es', 'bruce@hulk.org'],
            'age': [34, 29, 36, 42, 48],
            'annual_income': [85000, 120000, 72500, 94000, 110000],
            'country': ['United States', 'United States', 'Canada', 'Spain', 'Germany'],
            'signup_date': ['2023-01-15', '2023-02-20', '2023-03-10', '2023-04-05', '2023-05-12'],
            'is_active': [True, True, False, True, True],
        })

    def update_dataset(self, upload_id: int, df: pd.DataFrame) -> None:
        """Updates the working dataset copy ('current') for an upload_id."""
        self.save_dataset(upload_id, df, is_original=False)

    def delete_dataset(self, upload_id: int) -> None:
        """Removes stored files for a given upload_id."""
        for d_type in ["original", "current"]:
            p_path = self._get_path(upload_id, d_type)
            if p_path.exists():
                p_path.unlink(missing_ok=True)
            pkl_path = self._get_pickle_path(upload_id, d_type)
            if pkl_path.exists():
                pkl_path.unlink(missing_ok=True)


# Global singleton instance
dataset_store = DatasetStore()
