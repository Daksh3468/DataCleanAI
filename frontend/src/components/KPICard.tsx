import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'orange';
  tooltip?: string;
  badge?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'indigo',
  tooltip,
  badge,
}) => {
  const variantStyles = {
    indigo: {
      border: 'hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      glow: 'hover:shadow-indigo-500/10',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      textAccent: 'text-indigo-600',
    },
    emerald: {
      border: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      glow: 'hover:shadow-emerald-500/10',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      textAccent: 'text-emerald-600',
    },
    amber: {
      border: 'hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      glow: 'hover:shadow-amber-500/10',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      textAccent: 'text-amber-600',
    },
    rose: {
      border: 'hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      glow: 'hover:shadow-rose-500/10',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      textAccent: 'text-rose-600',
    },
    violet: {
      border: 'hover:border-violet-300',
      iconBg: 'bg-violet-50 text-violet-600 border-violet-200',
      glow: 'hover:shadow-violet-500/10',
      badge: 'bg-violet-50 text-violet-700 border-violet-200',
      textAccent: 'text-violet-600',
    },
    sky: {
      border: 'hover:border-sky-300',
      iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
      glow: 'hover:shadow-sky-500/10',
      badge: 'bg-sky-50 text-sky-700 border-sky-200',
      textAccent: 'text-sky-600',
    },
    orange: {
      border: 'hover:border-orange-300',
      iconBg: 'bg-orange-50 text-orange-600 border-orange-200',
      glow: 'hover:shadow-orange-500/10',
      badge: 'bg-orange-50 text-orange-700 border-orange-200',
      textAccent: 'text-orange-600',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`relative group bg-white border border-slate-200 p-5 rounded-2xl transition-all duration-200 ${style.border} shadow-xs hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {tooltip && (
            <div className="relative group/tooltip">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/tooltip:block w-52 p-2.5 bg-slate-900 border border-slate-700 text-slate-100 text-[11px] rounded-lg shadow-xl z-30 pointer-events-none leading-tight">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-xl border ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        {badge && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${style.badge}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}

        {trend && (
          <div
            className={`flex items-center space-x-1 font-bold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
