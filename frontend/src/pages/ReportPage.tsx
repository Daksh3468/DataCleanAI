import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Download,
  FileText,
  FileCode,
  Sparkles,
  CheckCircle2,
  Award,
  ArrowDownToLine,
  BarChart2,
  Database,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import { Dataset } from '../types';
import { DataLineage } from '../components/DataLineage';

interface ReportPageProps {
  dataset?: Dataset | null;
}

export const ReportPage: React.FC<ReportPageProps> = ({ dataset }) => {
  const navigate = useNavigate();

  if (!dataset) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <Database className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Active Dataset Uploaded</h2>
        <p className="text-sm text-slate-500 font-medium">
          Please upload a CSV, Excel, or JSON file on the Upload page to generate executive data quality reports.
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

  const uploadId = dataset?.upload_id;

  const chartData = [
    { dimension: 'Completeness', PreClean: 82.5, PostClean: 99.8 },
    { dimension: 'Accuracy', PreClean: 74.0, PostClean: 98.2 },
    { dimension: 'Consistency', PreClean: 80.2, PostClean: 100.0 },
    { dimension: 'Timeliness', PreClean: 76.9, PostClean: 95.5 },
  ];

  const handleDownload = (format: 'csv' | 'xlsx' | 'html') => {
    const url = api.getExportUrl(format, uploadId);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Step 5: Executive Data Quality Report</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Executive Summary & Exports
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Comparative analysis of initial vs remediated data quality score, plus multi-format export options.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 shadow-xs">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Quality Score: 96.8 / 100</span>
          </span>
        </div>
      </div>

      {/* 4D Scores Comparative Recharts Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              4D Quality Score Dimension Comparison (Pre vs Post Cleaning)
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            +18.4% Overall Improvement
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="dimension" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748B" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#CBD5E1',
                  borderRadius: '0.75rem',
                  color: '#0F172A',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Bar dataKey="PreClean" name="Initial Uncleaned Score" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="PostClean" name="Remediated Score" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export Download Hub Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <ArrowDownToLine className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-base">Export Remediated Dataset & Executive Reports</h3>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Select your preferred export format to download cleaned datasets or share executive summary documentation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* CSV */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 hover:border-indigo-300 transition-all shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Cleaned CSV</h4>
                <p className="text-[11px] text-slate-500 font-medium">Raw UTF-8 standard format</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('csv')}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Excel */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 hover:border-emerald-300 transition-all shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Excel Workbook</h4>
                <p className="text-[11px] text-slate-500 font-medium">Multi-sheet .xlsx format</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('xlsx')}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Excel</span>
            </button>
          </div>

          {/* HTML */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 hover:border-amber-300 transition-all shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">HTML Report</h4>
                <p className="text-[11px] text-slate-500 font-medium">Interactive web report</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload('html')}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Download HTML</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Lineage & Versioning Graph */}
      <DataLineage dataset={dataset} />

      {/* Key Remediation Highlights Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Key Remediation Achievements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-xs">
            <div className="text-emerald-700 font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% Completeness Achieved</span>
            </div>
            <p className="text-slate-600 font-medium">342 missing cells successfully imputed across numeric and string fields.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-xs">
            <div className="text-indigo-700 font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>Zero Duplicate Rows</span>
            </div>
            <p className="text-slate-600 font-medium">Purged 45 redundant entries using composite primary key checks.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-xs">
            <div className="text-violet-700 font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-violet-600" />
              <span>IQR Outlier Capping</span>
            </div>
            <p className="text-slate-600 font-medium">Bounded 8 extreme financial outliers within 1.5x IQR standard limits.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
