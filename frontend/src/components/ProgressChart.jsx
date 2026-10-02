import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Simple, calm bar chart for weekly workout/cardio progress. Uses the same
// Palette follows the rest of the app with teal and green accents.
export default function ProgressChart({ data, dataKey, label, color = '#2a82f5' }) {
  const hasData = data && data.some((d) => d[dataKey] > 0);

  if (!hasData) {
    return (
      <div className="card flex h-40 items-center justify-center text-sm text-gray-400">
        Not enough data yet to chart {label.toLowerCase()}.
      </div>
    );
  }

  return (
    <div className="card">
      <p className="mb-3 text-sm font-medium text-gray-700">{label}</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e8ec" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #e6e8ec', fontSize: 12 }}
            cursor={{ fill: '#f6f7f9' }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
