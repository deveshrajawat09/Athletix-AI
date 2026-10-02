import React from 'react';

const iconColors = {
  'Heart Rate': 'bg-rose-50 text-rose-600 border-rose-100',
  'Sleep': 'bg-violet-50 text-violet-700 border-violet-100',
  'Steps': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Weight': 'bg-blue-50 text-blue-600 border-blue-100',
  'Water': 'bg-cyan-50 text-cyan-600 border-cyan-100',
  'Calories': 'bg-amber-50 text-amber-600 border-amber-100',
};

export default function HealthCard({ icon: Icon, label, value, unit }) {
  const hasValue = value !== null && value !== undefined && value !== '';
  const colorClass = iconColors[label] || 'bg-slate-50 text-slate-600 border-slate-100';

  return (
    <div className="card group flex flex-col justify-between p-3.5 sm:p-4 hover:border-slate-300/80 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-xl border ${colorClass} transition-transform group-hover:scale-105 duration-200 shadow-2xs`}>
          <Icon size={16} />
        </div>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>

      <div className="mt-1">
        {hasValue ? (
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
          </div>
        ) : (
          <span className="text-xs font-medium text-slate-300 italic">Not recorded</span>
        )}
      </div>
    </div>
  );
}
