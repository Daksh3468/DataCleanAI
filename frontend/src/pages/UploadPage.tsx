import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database,
  ShieldAlert,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { api } from '../services/api';
import { Dataset, UploadResponse } from '../types';

interface UploadPageProps {
  onDatasetUploaded: (dataset: Dataset) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onDatasetUploaded }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  const handleFile = async (file: File) => {
    // Validate format & max size (1GB)
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'json'].includes(ext || '')) {
      setError('Unsupported file type. Please upload a CSV, Excel (.xlsx, .xls), or JSON file.');
      return;
    }

    if (file.size > 1024 * 1024 * 1024) {
      setError('File size exceeds maximum threshold of 1 GB.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const res = await api.uploadDataset(file, (pct) => {
        setUploadProgress(Math.max(10, pct));
      });

      setUploadProgress(100);
      setUploadResult(res);

      const datasetObj: Dataset = {
        upload_id: res.upload_id,
        filename: res.filename,
        file_size: res.file_size,
        row_count: res.row_count,
        column_count: res.column_count,
        uploaded_at: new Date().toISOString(),
        columns: res.columns,
      };

      onDatasetUploaded(datasetObj);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload dataset. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleDataset = async () => {
    // Quick load sample dataset
    const sampleFile = new File(['sample_data'], 'enterprise_customer_leads.csv', { type: 'text/csv' });
    await handleFile(sampleFile);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Hero Title Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Step 1: Dataset Ingestion</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Upload & Profile Your <span className="gradient-text">Dataset</span>
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
          High-speed engine supporting files up to 1GB. Automated schema detection, missing value scanning, and 4D Quality Scoring.
        </p>
      </div>

      {/* Main Dropzone Card */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          accept=".csv,.xlsx,.xls,.json"
          className="hidden"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 sm:p-16 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center space-y-5 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30'
          }`}
        >
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 group-hover:scale-110 transition-transform shadow-xs">
            <Upload className="w-10 h-10" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600"></span>
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-lg font-bold text-slate-900">
              Drag & Drop your dataset here, or <span className="text-indigo-600 underline hover:text-indigo-700">Browse</span>
            </p>
            <p className="text-xs text-slate-500">
              Supports CSV, Excel (.xlsx, .xls), and JSON files up to <span className="font-semibold text-slate-700">1 GB</span>
            </p>
          </div>

          {/* Format Badges */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              .CSV
            </span>
            <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              .XLSX / .XLS
            </span>
            <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              .JSON
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>Uploading & Extracting Metadata...</span>
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-3 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Success Banner */}
        {uploadResult && (
          <div className="mt-8 p-6 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Dataset Successfully Uploaded!</h4>
                  <p className="text-xs text-slate-600 font-medium">{uploadResult.filename}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2"
              >
                <span>View Quality Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metadata Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Total Rows</div>
                <div className="text-lg font-bold text-slate-900 font-mono">{uploadResult.row_count.toLocaleString()}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Total Columns</div>
                <div className="text-lg font-bold text-slate-900 font-mono">{uploadResult.column_count}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                <div className="text-xs text-slate-500 font-medium">File Size</div>
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {(uploadResult.file_size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Status</div>
                <div className="text-lg font-bold text-emerald-600 font-mono">READY</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Sample Dataset Trigger */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Don't have a file ready? Try our pre-loaded enterprise dataset:</span>
          </div>
          <button
            onClick={handleSampleDataset}
            className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center space-x-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Load Demo Dataset</span>
          </button>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl space-y-2 border border-slate-200 shadow-xs">
          <div className="p-2.5 w-max rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <HardDrive className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">1GB Streaming Engine</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Chunked streaming parser optimized for processing multi-million row enterprise datasets without memory leaks.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl space-y-2 border border-slate-200 shadow-xs">
          <div className="p-2.5 w-max rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Automatic Anomaly Detection</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Instant evaluation of duplicate rows, null missing percentages, Z-score numerical outliers, and format errors.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl space-y-2 border border-slate-200 shadow-xs">
          <div className="p-2.5 w-max rounded-xl bg-violet-50 text-violet-600 border border-violet-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">4D Quality Profiling</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Comprehensive metric evaluation across Completeness, Accuracy, Consistency, and Timeliness dimensions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
