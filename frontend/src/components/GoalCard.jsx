import React from 'react';
import { Target, Trash2, Plus, CheckCircle2 } from 'lucide-react';

const labels = {
  run_distance: 'Run distance',
  workouts_per_week: 'Workouts / week',
  daily_steps: 'Daily steps',
  daily_water: 'Daily water',
  weight_target: 'Weight target',
  consistency: 'Consistency',
};

export default function GoalCard({ goal, onUpdateProgress, onDelete }) {
  const current = goal.currentProgress || 0;
  const target = goal.target || 1;
  const pct = Math.min(100, Math.round((current / target) * 100));
  const isComplete = pct >= 100 || goal.status === 'completed';

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`rounded-xl p-2.5 ${isComplete ? 'bg-accent-50 text-accent-600' : 'bg-primary-50 text-primary-600'}`}>
            {isComplete ? <CheckCircle2 size={18} /> : <Target size={18} />}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{labels[goal.goalType] || goal.goalType}</p>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${isComplete ? 'bg-accent-50 text-accent-700' : 'bg-primary-50 text-primary-700'}`}>
              {isComplete ? 'Goal Met' : 'In Progress'}
            </span>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(goal._id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete goal"
            aria-label="Delete goal"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-accent-500' : 'bg-primary-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
          <span>
            {current} / {target} {goal.unit || ''}
          </span>
          <span className="font-semibold">{pct}%</span>
        </div>
      </div>

      {onUpdateProgress && !isComplete && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-surface-border">
          <span className="text-[11px] text-gray-400 mr-1">Quick Add:</span>
          <button
            onClick={() => onUpdateProgress(goal._id, current + 1)}
            className="rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-0.5"
          >
            <Plus size={11} /> 1
          </button>
          <button
            onClick={() => onUpdateProgress(goal._id, current + 5)}
            className="rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-0.5"
          >
            <Plus size={11} /> 5
          </button>
          <button
            onClick={() => {
              const val = prompt('Enter new progress value:', current);
              if (val !== null && !isNaN(Number(val))) {
                onUpdateProgress(goal._id, Number(val));
              }
            }}
            className="ml-auto rounded-lg border border-surface-border px-2 py-1 text-[11px] text-gray-500 hover:bg-surface-muted"
          >
            Set Custom
          </button>
        </div>
      )}
    </div>
  );
}
