import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { QualityScoreResponse } from '../types';

interface QualityGaugeProps {
  scores?: QualityScoreResponse | null;
}

export const QualityGauge: React.FC<QualityGaugeProps> = ({ scores }) => {
  const overall = scores?.overall_score ?? 0;
  const score = Math.min(100, Math.max(0, overall));
  const scoreStr = score.toFixed(1);

  // Status config
  const getStatus = (s: number) => {
    if (s >= 90) return { label: 'Excellent', color: '#6366f1' };
    if (s >= 75) return { label: 'Good',      color: '#3b82f6' };
    if (s >= 50) return { label: 'Fair',      color: '#f59e0b' };
    return             { label: 'Poor',       color: '#ef4444' };
  };

  const status = getStatus(score);

  const dims = [
    { label: 'Completeness', value: scores?.dimension_scores?.completeness ?? 0, color: '#6366f1' },
    { label: 'Accuracy',     value: scores?.dimension_scores?.accuracy     ?? 0, color: '#10b981' },
    { label: 'Consistency',  value: scores?.dimension_scores?.consistency  ?? 0, color: '#0ea5e9' },
    { label: 'Timeliness',   value: scores?.dimension_scores?.timeliness   ?? 0, color: '#8b5cf6' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col p-6 h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          Overall Health Score
        </h3>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full border"
          style={{
            color: status.color,
            background: `${status.color}14`,
            borderColor: `${status.color}40`,
          }}
        >
          {scores?.status || status.label}
        </span>
      </div>

      {/* ── Percentage Indicator ── */}
      <div className="flex items-end gap-1 mb-6 px-2 select-none">
        <span
          className="font-extrabold leading-none"
          style={{
            fontSize: 80,
            color: status.color,
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '-4px',
          }}
        >
          {scoreStr}
        </span>
        <div className="flex flex-col gap-0.5 pb-2">
          <span
            className="font-extrabold leading-none"
            style={{ fontSize: 36, color: status.color, fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            %
          </span>
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
            Quality Score
          </span>
        </div>
      </div>



      {/* ── 4D Dimension Cards ── */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-auto">
        {dims.map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-3 space-y-2"
            style={{ background: `${color}0f`, border: `1px solid ${color}25` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color }}>{label}</span>
              <span className="text-xs font-extrabold" style={{ color }}>
                {Number(value ?? 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: `${color}20` }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, value ?? 0)}%`,
                  background: color,
                  transition: 'width 0.9s ease-out',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualityGauge;
