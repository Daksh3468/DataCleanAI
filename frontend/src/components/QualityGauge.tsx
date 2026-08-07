import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { QualityScoreResponse } from '../types';

interface QualityGaugeProps {
  scores?: QualityScoreResponse | null;
  size?: number;
}

export const QualityGauge: React.FC<QualityGaugeProps> = ({ scores, size = 220 }) => {
  const overall = scores?.overall_score ?? 78.4;
  const clampedScore = Math.min(100, Math.max(0, overall));

  // Determine status color and label
  let statusText = 'EXCELLENT';
  let badgeStyle = 'badge-emerald';

  if (clampedScore < 60) {
    statusText = 'POOR';
    badgeStyle = 'badge-rose';
  } else if (clampedScore < 80) {
    statusText = 'GOOD';
    badgeStyle = 'badge-amber';
  }

  // SVG Gauge calculations
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half arc (180 deg)
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const dimScores = scores?.dimension_scores || {
    completeness: 82.5,
    accuracy: 74.0,
    consistency: 80.2,
    timeliness: 76.9,
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-between h-full relative overflow-hidden shadow-xs">
      <div className="w-full flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Overall Data Health Score</span>
        </h3>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${badgeStyle}`}>
          {scores?.status || statusText}
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative flex items-center justify-center my-4" style={{ width: size, height: size / 2 + 30 }}>
        <svg width={size} height={size / 2 + 20} className="transform -rotate-180">
          <defs>
            <linearGradient id="gaugeGradientLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E11D48" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={0}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#gaugeGradientLight)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#softGlow)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute bottom-2 flex flex-col items-center text-center">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {clampedScore.toFixed(1)}
          </span>
          <span className="text-xs text-slate-500 font-semibold">Out of 100</span>
        </div>
      </div>

      {/* 4D Dimension Breakdown Mini Bars */}
      <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200">
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span className="font-medium">Completeness</span>
            <span className="font-bold text-slate-900">{dimScores.completeness}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${dimScores.completeness}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span className="font-medium">Accuracy</span>
            <span className="font-bold text-slate-900">{dimScores.accuracy}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${dimScores.accuracy}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span className="font-medium">Consistency</span>
            <span className="font-bold text-slate-900">{dimScores.consistency}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${dimScores.consistency}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span className="font-medium">Timeliness</span>
            <span className="font-bold text-slate-900">{dimScores.timeliness}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-violet-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${dimScores.timeliness}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityGauge;
