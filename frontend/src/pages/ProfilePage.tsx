import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  Search,
  FileCode,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Dataset, ProfileResponse } from '../types';
import { KPICard } from '../components/KPICard';
import { QualityGauge } from '../components/QualityGauge';
import { DataGrid } from '../components/DataGrid';

interface ProfilePageProps {
  dataset?: Dataset | null;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ dataset }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnSearch, setColumnSearch] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, qualityData] = await Promise.all([
        api.getProfile(dataset?.upload_id),
        api.getQualityScores(dataset?.upload_id),
      ]);
      // Merge quality scores into the profile object
      setProfile({ ...profileData, quality_scores: qualityData });
    } catch (err: any) {
      console.error('Failed to load dataset profile', err);
      setError(err?.response?.data?.detail ?? err?.message ?? 'Failed to load dataset profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataset) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [dataset]);

  if (!dataset) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <Database className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Active Dataset Uploaded</h2>
        <p className="text-sm text-slate-500 font-medium">
          Please upload a CSV, Excel, or JSON file on the Upload page to profile dataset quality metrics.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center space-x-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Go to Upload Page</span>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-600 font-semibold">Profiling dataset & computing 4D quality scores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-xl mx-auto my-12 space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-red-800">Failed to Load Profile</h2>
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchProfile}
          className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const scores = profile?.quality_scores;
  const colStats = profile?.columns_stats ? Object.values(profile.columns_stats) : [];
  const filteredCols = colStats.filter((c) =>
    c.name.toLowerCase().includes(columnSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Step 2: Quality Profiling & Diagnosis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
            <span>Dataset Quality Profile</span>
            <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
              {profile?.filename || 'Dataset'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Profiling <span className="text-slate-900 font-bold">{profile?.row_count?.toLocaleString()}</span> rows &{' '}
            <span className="text-slate-900 font-bold">{profile?.column_count}</span> columns
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchProfile}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Re-profile</span>
          </button>

          <button
            onClick={() => navigate('/clean')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2"
          >
            <span>Clean Dataset Workbench</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Quality Score Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Score Radial Gauge */}
        <div className="lg:col-span-1">
          <QualityGauge scores={scores} />
        </div>

        {/* 4D Quality Cards Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KPICard
            title="Completeness"
            value={`${scores?.dimension_scores.completeness.toFixed(1)}%`}
            subtitle={`${scores?.missing_cells.toLocaleString() ?? 0} missing cells detected`}
            icon={CheckCircle2}
            variant="emerald"
            badge="Dimension 1"
            tooltip="Ratio of non-null cells to total cell count across all columns"
          />

          <KPICard
            title="Accuracy"
            value={`${scores?.dimension_scores.accuracy.toFixed(1)}%`}
            subtitle={`${scores?.outlier_count ?? 0} numerical outliers flagged`}
            icon={AlertTriangle}
            variant="emerald"
            badge="Dimension 2"
            tooltip="Evaluation of value boundary checks, invalid formats, and z-score anomalies"
          />

          <KPICard
            title="Consistency"
            value={`${scores?.dimension_scores.consistency.toFixed(1)}%`}
            subtitle={`${scores?.duplicate_rows ?? 0} exact duplicate rows found`}
            icon={Layers}
            variant="sky"
            badge="Dimension 3"
            tooltip="Measures uniform data structures, duplicate rows, and schema integrity"
          />

          <KPICard
            title="Timeliness"
            value={`${scores?.dimension_scores.timeliness.toFixed(1)}%`}
            subtitle={`${scores?.invalid_formats ?? 0} invalid timestamps`}
            icon={BarChart3}
            variant="orange"
            badge="Dimension 4"
            tooltip="Measures date format adherence and recency freshness metrics"
          />
        </div>
      </div>

      {/* Column Level Statistics Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Column Schema & Statistical Distributions</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Detailed missing percentages, data type classification, and numeric min/max summaries
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search column name..."
              value={columnSearch}
              onChange={(e) => setColumnSearch(e.target.value)}
              className="glass-input pl-9 pr-4 py-1.5 rounded-xl text-xs w-56 shadow-xs"
            />
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Data Type</th>
                <th>Total Rows</th>
                <th>Missing Count</th>
                <th>Missing %</th>
                <th>Unique Count</th>
                <th>Numeric Min / Max</th>
                <th>Mean ± Std</th>
              </tr>
            </thead>
            <tbody>
              {filteredCols.length > 0 ? (
                filteredCols.map((col) => {
                  const isHighMissing = col.missing_percentage > 5;
                  return (
                    <tr key={col.name} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                      <td className="font-bold text-slate-900 flex items-center space-x-2">
                        <FileCode className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{col.name}</span>
                      </td>
                      <td>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-indigo-700 border border-slate-200 uppercase">
                          {col.type}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-700">{col.count?.toLocaleString()}</td>
                      <td className="font-mono text-xs font-semibold">
                        {col.missing_count > 0 ? (
                          <span className="text-amber-600 font-bold">{col.missing_count}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="font-mono text-xs">
                        <div className="flex items-center space-x-2">
                          <span className={isHighMissing ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}>
                            {col.missing_percentage.toFixed(2)}%
                          </span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full ${
                                isHighMissing ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, col.missing_percentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-slate-700">{col.unique_count?.toLocaleString()}</td>
                      <td className="font-mono text-xs text-slate-600">
                        {col.min !== undefined && col.max !== undefined ? (
                          <span>
                            {String(col.min)} → {String(col.max)}
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="font-mono text-xs text-slate-600">
                        {col.mean !== undefined && col.mean !== null ? (
                          <span>
                            {col.mean.toFixed(2)} ± {col.std?.toFixed(2) ?? '0'}
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-sm">
                    No column statistics match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Data Preview Grid */}
      <DataGrid
        data={profile?.data_preview || []}
        title="Interactive Raw Dataset Grid Preview"
        pageSize={10}
      />
    </div>
  );
};

export default ProfilePage;
