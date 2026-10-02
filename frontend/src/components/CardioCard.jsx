import React from 'react';
import { Activity, Clock, Flame, Heart, Trash2, CheckCircle2 } from 'lucide-react';

const statusBadge = {
  completed: 'badge-completed',
  in_progress: 'badge-pending',
  planned: 'badge-planned',
  skipped: 'badge-planned',
};

const statusLabel = {
  completed: 'Completed',
  in_progress: 'In progress',
  planned: 'Planned',
  skipped: 'Skipped',
};

export default function CardioCard({ cardio, onStart, onDelete, onStatusChange }) {
  if (!cardio) return null;

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-accent-50 p-2.5 text-accent-600">
            <Activity size={20} />
          </div>
          <div>
            <p className="font-semibold capitalize text-gray-900">{cardio.activityType}</p>
            <p className="text-xs text-gray-500">
              {cardio.distanceKm ? `${cardio.distanceKm} km` : 'Distance not set'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={statusBadge[cardio.status] || 'badge-planned'}>
            {statusLabel[cardio.status] || cardio.status}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(cardio._id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete session"
              aria-label="Delete session"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {cardio.durationMinutes && (
          <span className="flex items-center gap-1">
            <Clock size={13} /> {cardio.durationMinutes} min
          </span>
        )}
        {cardio.calories && (
          <span className="flex items-center gap-1 text-amber-600">
            <Flame size={13} /> {cardio.calories} kcal
          </span>
        )}
        {cardio.averageHeartRate && (
          <span className="flex items-center gap-1 text-rose-500">
            <Heart size={13} /> {cardio.averageHeartRate} bpm
          </span>
        )}
      </div>

      {cardio.status !== 'completed' && onStart && (
        <button onClick={onStart} className="btn-primary mt-3 w-full text-sm">
          Start Cardio
        </button>
      )}

      {cardio.status !== 'completed' && onStatusChange && (
        <button
          onClick={() => onStatusChange(cardio._id, 'completed')}
          className="btn-secondary mt-2 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
        >
          <CheckCircle2 size={14} /> Mark Cardio Completed
        </button>
      )}
    </div>
  );
}
