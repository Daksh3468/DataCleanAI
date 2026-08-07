import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Database,
  Sparkles,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { HistoryItem, Dataset } from '../types';

interface HistoryPageProps {
  onSelectDataset?: (dataset: Dataset) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectDataset }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const items = await api.getHistory();
        setHistory(items);
      } catch (err) {
        console.error('Failed to load upload audit history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const historyList = Array.isArray(history) ? history : [];
  const filteredHistory = historyList.filter((item) => {
    const filename = item?.filename || '';
    const status = item?.status || 'PROFILED';
    const matchesQuery = filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleSelectHistoryItem = (item: HistoryItem) => {
    if (onSelectDataset) {
      onSelectDataset({
        upload_id: item.upload_id || 'upl_default',
        filename: item.filename || 'dataset.csv',
        file_size: item.file_size || 0,
        row_count: item.row_count || 0,
        column_count: item.column_count || 0,
        uploaded_at: item.uploaded_at || new Date().toISOString(),
        columns: ['id', 'full_name', 'email', 'age', 'annual_income', 'country', 'signup_date', 'is_active'],
      });
    }
    navigate('/profile');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Database Audit Logs & Persistence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-3">
            <History className="w-8 h-8 text-indigo-600" />
            <span>Upload History & Audit Trail</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Historical registry of datasets uploaded, profiled, and cleaned with persistent audit records.
          </p>
        </div>
      </div>

      {/* History Table Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Database Dataset Registry</h3>
            <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-mono font-semibold">
              {filteredHistory.length} uploads
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-9 pr-4 py-1.5 rounded-xl text-xs w-48 shadow-xs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input px-3 py-1.5 rounded-xl text-xs bg-white text-slate-700 shadow-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="CLEANED">Cleaned</option>
              <option value="PROFILED">Profiled</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Upload ID</th>
                <th>File Name</th>
                <th>Upload Timestamp</th>
                <th>Row Count</th>
                <th>File Size</th>
                <th>Quality Score</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item, idx) => {
                  const status = item?.status || 'PROFILED';
                  const statusBadge =
                    status === 'CLEANED'
                      ? 'badge-emerald'
                      : status === 'PROFILED'
                      ? 'badge-indigo'
                      : 'badge-amber';

                  const score = typeof item?.quality_score === 'number' ? item.quality_score : 85.0;
                  const rowCount = typeof item?.row_count === 'number' ? item.row_count : 0;
                  const fileSize = typeof item?.file_size === 'number' ? item.file_size : 0;
                  const dateStr = item?.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : 'N/A';

                  return (
                    <tr key={item?.upload_id || idx} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                      <td className="font-mono text-xs text-indigo-700 font-bold">
                        {item?.upload_id || `upl_${idx}`}
                      </td>
                      <td className="font-bold text-slate-900 flex items-center space-x-2">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>{item?.filename || 'dataset.csv'}</span>
                      </td>
                      <td className="font-mono text-xs text-slate-600">
                        {dateStr}
                      </td>
                      <td className="font-mono text-xs text-slate-700">
                        {rowCount.toLocaleString()}
                      </td>
                      <td className="font-mono text-xs text-slate-600">
                        {(fileSize / (1024 * 1024)).toFixed(2)} MB
                      </td>
                      <td className="font-mono text-xs font-bold text-emerald-600">
                        {score.toFixed(1)} / 100
                      </td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusBadge}`}>
                          {status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleSelectHistoryItem(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all inline-flex items-center space-x-1 shadow-xs"
                        >
                          <span>Open Profile</span>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-sm">
                    No historical dataset records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
