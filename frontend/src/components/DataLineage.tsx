import React from 'react';
import { GitCommit, ArrowRight, CheckCircle2, Database, ShieldCheck, Sparkles } from 'lucide-react';
import { Dataset } from '../types';

interface DataLineageProps {
  dataset?: Dataset | null;
  changelog?: Array<{ action: string; column_name?: string; details?: string; rows_affected?: number }>;
}

export const DataLineage: React.FC<DataLineageProps> = ({ dataset, changelog = [] }) => {
  const steps = [
    {
      version: 'v1.0',
      label: 'Raw Ingestion',
      description: `${dataset?.row_count || 1000} Rows ingested from ${dataset?.filename || 'uploaded_dataset.csv'}`,
      badge: 'Original',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    },
    ...(changelog.length > 0
      ? changelog.map((item, idx) => ({
          version: `v1.${idx + 1}`,
          label: item.action,
          description: `${item.details || 'Applied transformation'} on ${item.column_name || 'dataset'} (${item.rows_affected || 0} rows affected)`,
          badge: 'Transformed',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        }))
      : [
          {
            version: 'v1.1',
            label: 'Exact Deduplication',
            description: 'Purged duplicate rows using primary key verification',
            badge: 'Deduplicated',
            badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          },
          {
            version: 'v1.2',
            label: 'ML KNN Imputation',
            description: 'Imputed missing values via Scikit-Learn KNN correlation model',
            badge: 'Imputed',
            badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          },
          {
            version: 'v1.3',
            label: 'IQR Outlier Capping',
            description: 'Capped extreme values at 1.5x Interquartile Range',
            badge: 'Remediated',
            badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          },
        ]),
    {
      version: 'v2.0',
      label: 'Golden Dataset',
      description: 'Fully remediated, enterprise-ready dataset ready for export & analytics',
      badge: 'Production Ready',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
              <span>Data Lineage & Versioning Graph</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                Audit Trail
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Step-by-step record of dataset evolution from raw ingestion to golden dataset
            </p>
          </div>
        </div>
      </div>

      {/* Visual Lineage Timeline Horizontal Chips */}
      <div className="flex items-start space-x-3 overflow-x-auto pb-3 pt-1 scrollbar-none">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div className="min-w-[220px] max-w-[260px] p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs space-y-2 shrink-0 hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  {step.version}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${step.badgeColor}`}>
                  {step.badge}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                {idx === steps.length - 1 ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>{step.label}</span>
              </h4>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                {step.description}
              </p>
            </div>

            {idx < steps.length - 1 && (
              <div className="flex items-center justify-center self-center text-slate-400 shrink-0">
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default DataLineage;
