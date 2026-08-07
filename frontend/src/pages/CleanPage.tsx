import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  CheckCircle2,
  Trash2,
  SlidersHorizontal,
  RefreshCcw,
  ArrowRight,
  TrendingUp,
  FileText,
  Zap,
  Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CleaningOptions, CleanResponse, Dataset } from '../types';
import { DataGrid } from '../components/DataGrid';

import { SQLConsole } from '../components/SQLConsole';

interface CleanPageProps {
  dataset?: Dataset | null;
}

export const CleanPage: React.FC<CleanPageProps> = ({ dataset }) => {
  const navigate = useNavigate();
  const [cleaningOptions, setCleaningOptions] = useState<CleaningOptions>({
    missing_values: {
      method: 'mean',
      fill_value: 'N/A',
    },
    deduplication: {
      enabled: true,
      keep: 'first',
    },
    outliers: {
      enabled: true,
      method: 'iqr',
      threshold: 1.5,
      action: 'cap',
    },
    string_normalization: {
      enabled: true,
      trim_whitespace: true,
      case_format: 'none',
      remove_special_chars: false,
    },
    type_casting: {
      enabled: false,
    },
  });

  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<CleanResponse | null>(null);

  const handleApplyCleaning = async () => {
    setIsCleaning(true);
    try {
      const res = await api.cleanDataset(cleaningOptions, dataset?.upload_id);
      setCleanResult(res);
    } catch (err) {
      console.error('Cleaning pipeline failed', err);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Step 4: Automated Data Cleaning Workbench</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Transformation & Remediation Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Configure AI imputation, deduplication, IQR capping, and DuckDB SQL queries.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleApplyCleaning}
            disabled={isCleaning}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-2.5 disabled:opacity-50 cursor-pointer"
          >
            {isCleaning ? (
              <>
                <RefreshCcw className="w-5 h-5 animate-spin" />
                <span>Running Transformation Pipeline...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>Apply Cleaning Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* DuckDB In-Memory SQL Query Console */}
      <SQLConsole dataset={dataset} />

      {/* Transformations Configuration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Missing Values Imputation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Missing Value Imputation</h3>
              <p className="text-xs text-slate-500 font-medium">Specify handling mechanism for null data cells</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Imputation Strategy
              </label>
              <select
                value={cleaningOptions.missing_values.method}
                onChange={(e) =>
                  setCleaningOptions({
                    ...cleaningOptions,
                    missing_values: {
                      ...cleaningOptions.missing_values,
                      method: e.target.value as any,
                    },
                  })
                }
                className="glass-input w-full px-3 py-2 rounded-xl text-xs bg-white text-slate-900 font-medium"
              >
                <option value="knn">🤖 KNN Machine Learning Imputation (Predict missing using Feature Correlations)</option>
                <option value="mean">Mean (Fill numerical missing with column average)</option>
                <option value="median">Median (Fill numerical missing with middle value)</option>
                <option value="mode">Mode (Fill categorical missing with most frequent)</option>
                <option value="constant">Constant Value (Fill with custom text/number)</option>
                <option value="drop">Drop Rows (Remove rows containing missing values)</option>
              </select>
            </div>

            {cleaningOptions.missing_values.method === 'constant' && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Constant Fill Value
                </label>
                <input
                  type="text"
                  value={String(cleaningOptions.missing_values.fill_value || '')}
                  onChange={(e) =>
                    setCleaningOptions({
                      ...cleaningOptions,
                      missing_values: {
                        ...cleaningOptions.missing_values,
                        fill_value: e.target.value,
                      },
                    })
                  }
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                  placeholder="e.g. Unknown or 0"
                />
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Row Deduplication */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Row Deduplication</h3>
                <p className="text-xs text-slate-500 font-medium">Identify & purge duplicate database records</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cleaningOptions.deduplication.enabled}
                onChange={(e) =>
                  setCleaningOptions({
                    ...cleaningOptions,
                    deduplication: {
                      ...cleaningOptions.deduplication,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {cleaningOptions.deduplication.enabled && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Keep Preference
                </label>
                <select
                  value={String(cleaningOptions.deduplication.keep)}
                  onChange={(e) =>
                    setCleaningOptions({
                      ...cleaningOptions,
                      deduplication: {
                        ...cleaningOptions.deduplication,
                        keep: e.target.value === 'first' ? 'first' : 'last',
                      },
                    })
                  }
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs bg-white text-slate-900 font-medium"
                >
                  <option value="first">Keep First Occurrence</option>
                  <option value="last">Keep Last Occurrence</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Outlier Remediation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Outlier Detection & Capping</h3>
                <p className="text-xs text-slate-500 font-medium">IQR / Z-Score numerical boundary filter</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cleaningOptions.outliers.enabled}
                onChange={(e) =>
                  setCleaningOptions({
                    ...cleaningOptions,
                    outliers: {
                      ...cleaningOptions.outliers,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {cleaningOptions.outliers.enabled && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Method
                </label>
                <select
                  value={cleaningOptions.outliers.method}
                  onChange={(e) =>
                    setCleaningOptions({
                      ...cleaningOptions,
                      outliers: {
                        ...cleaningOptions.outliers,
                        method: e.target.value as any,
                      },
                    })
                  }
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs bg-white text-slate-900 font-medium"
                >
                  <option value="iqr">IQR Multiplier (1.5x)</option>
                  <option value="zscore">Z-Score Threshold (3.0 Std)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Remediation Action
                </label>
                <select
                  value={cleaningOptions.outliers.action}
                  onChange={(e) =>
                    setCleaningOptions({
                      ...cleaningOptions,
                      outliers: {
                        ...cleaningOptions.outliers,
                        action: e.target.value as any,
                      },
                    })
                  }
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs bg-white text-slate-900 font-medium"
                >
                  <option value="cap">Cap at Upper/Lower Boundary</option>
                  <option value="remove">Remove Outlier Rows</option>
                  <option value="nullify">Set to Null</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Card 4: String Normalization */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">String Normalization</h3>
                <p className="text-xs text-slate-500 font-medium">Trim whitespace & standardize text casing</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cleaningOptions.string_normalization.enabled}
                onChange={(e) =>
                  setCleaningOptions({
                    ...cleaningOptions,
                    string_normalization: {
                      ...cleaningOptions.string_normalization,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          {cleaningOptions.string_normalization.enabled && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700 font-semibold">Trim Whitespace (Leading & Trailing)</span>
                <input
                  type="checkbox"
                  checked={cleaningOptions.string_normalization.trim_whitespace}
                  onChange={(e) =>
                    setCleaningOptions({
                      ...cleaningOptions,
                      string_normalization: {
                        ...cleaningOptions.string_normalization,
                        trim_whitespace: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Text Case Formatting
                </label>
                <select
                  value={cleaningOptions.string_normalization.case_format || 'none'}
                  onChange={(e) =>
                    setCleaningOptions({
                      ...cleaningOptions,
                      string_normalization: {
                        ...cleaningOptions.string_normalization,
                        case_format: e.target.value as any,
                      },
                    })
                  }
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs bg-white text-slate-900 font-medium"
                >
                  <option value="none">No Casing Alteration</option>
                  <option value="lower font">lower case</option>
                  <option value="upper font">UPPER CASE</option>
                  <option value="title font">Title Case</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cleaning Results Comparison Section */}
      {cleanResult && (
        <div className="space-y-6 pt-4">
          <div className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Pipeline Execution Successful</h3>
                  <p className="text-xs text-slate-600 font-medium">{cleanResult.message}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/report')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2"
              >
                <span>View Full Executive Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Score Delta Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Initial Quality Score</div>
                <div className="text-xl font-extrabold text-slate-700 font-mono">
                  {cleanResult.initial_quality_score.toFixed(1)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Cleaned Quality Score</div>
                <div className="text-xl font-extrabold text-emerald-600 font-mono">
                  {cleanResult.cleaned_quality_score.toFixed(1)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Quality Score Gain</div>
                <div className="text-xl font-extrabold text-indigo-600 font-mono flex items-center justify-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>+{cleanResult.quality_gain.toFixed(1)} pts</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Rows Removed</div>
                <div className="text-xl font-extrabold text-amber-600 font-mono">
                  {cleanResult.rows_removed} rows
                </div>
              </div>
            </div>

            {/* Audit Log Changelog list */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-2">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>Transformation Audit Changelog</span>
              </h4>
              <div className="space-y-2">
                {cleanResult.changelog.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold uppercase">
                        {log.category}
                      </span>
                      <span className="font-semibold text-slate-900">{log.action}</span>
                    </div>
                    <div className="text-slate-500 font-mono text-[11px]">{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cleaned Dataset Grid Preview */}
          <DataGrid
            data={cleanResult.preview || []}
            title="Cleaned Dataset Interactive Preview"
            pageSize={10}
          />
        </div>
      )}
    </div>
  );
};

export default CleanPage;
