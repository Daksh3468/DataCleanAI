import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { QualityScoreResponse } from '../types';

interface QualityGaugeProps {
  scores?: QualityScoreResponse | null;
}

export const QualityGauge: React.FC<QualityGaugeProps> = ({ scores }) => {
  const overall = scores?.overall_score ?? 0;
  const score = Math.min(100, Math.max(0, overall));
  const scoreStr = score.toFixed(1);   // e.g. "99.4"
  const ghostScore = Math.max(0, score - 1).toFixed(1); // ghost digit one step behind

  // Status config
  const getStatus = (s: number) => {
    if (s >= 90) return { label: 'Excellent', color: '#6366f1', ghost: '#a5b4fc' };
    if (s >= 75) return { label: 'Good',      color: '#3b82f6', ghost: '#93c5fd' };
    if (s >= 50) return { label: 'Fair',      color: '#f59e0b', ghost: '#fcd34d' };
    return             { label: 'Poor',       color: '#ef4444', ghost: '#fca5a5' };
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
      <div className="flex items-center gap-5 mb-6 px-2">
        {/* Stacked digit block */}
        <div className="relative select-none" style={{ width: 120, height: 90 }}>
          {/* Ghost (previous) number — offset behind */}
          <span
            className="absolute font-extrabold leading-none"
            style={{
              fontSize: 72,
              color: status.ghost,
              opacity: 0.35,
              top: 12,
              left: 10,
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '-3px',
            }}
          >
            {ghostScore}
          </span>
          {/* Main (current) number — in front */}
          <span
            className="absolute font-extrabold leading-none"
            style={{
              fontSize: 72,
              color: status.color,
              top: 0,
              left: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '-3px',
            }}
          >
            {scoreStr}
          </span>
        </div>

        {/* % symbol + label */}
        <div className="flex flex-col gap-1">
          <span
            className="text-4xl font-extrabold leading-none"
            style={{ color: status.color, fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            %
          </span>
          <span className="text-sm font-semibold text-slate-400 leading-tight whitespace-nowrap">
            Quality Score
          </span>
        </div>
      </div>

      {/* ── Score bar ── */}
      <div className="mb-6 px-2">
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${score}%`,
              background: `linear-gradient(90deg, #ef4444 0%, #f59e0b 35%, #3b82f6 65%, ${status.color} 100%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-medium mt-1.5">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      {/* ── 4D Dimension Bars ── */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-auto">
        {dims.map(({ label, value, color }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">{label}</span>
              <span className="font-bold text-slate-800">{Number(value ?? 0).toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
