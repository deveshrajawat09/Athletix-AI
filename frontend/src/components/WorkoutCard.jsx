import React, { useState } from 'react';
import { Dumbbell, Clock, ChevronDown, ChevronUp, Trash2, CheckCircle2, Calendar, Mail, Check, AlertCircle } from 'lucide-react';
import { syncCalendarWorkout, sendSummaryEmail } from '../api/integrations';

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

export default function WorkoutCard({
  workout,
  onStart,
  onToggleExpand,
  isExpanded,
  onDelete,
  onStatusChange,
}) {
  if (!workout) return null;

  const [calLoading, setCalLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const totalExercises = workout.exercises?.length || 0;
  const totalSets = workout.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0;

  async function handleSyncCalendar(e) {
    e.stopPropagation();
    setCalLoading(true);
    setActionMsg(null);
    try {
      const res = await syncCalendarWorkout(workout._id);
      if (res.calendarLink) {
        window.open(res.calendarLink, '_blank');
      }
      setActionMsg({ text: 'Calendar event ready!', type: 'success' });
    } catch (err) {
      setActionMsg({ text: 'Failed to sync calendar', type: 'error' });
    } finally {
      setCalLoading(false);
      setTimeout(() => setActionMsg(null), 4000);
    }
  }

  async function handleSendEmail(e) {
    e.stopPropagation();
    setEmailLoading(true);
    setActionMsg(null);
    try {
      const res = await sendSummaryEmail(workout._id);
      if (res.previewUrl) {
        window.open(res.previewUrl, '_blank');
      }
      setActionMsg({ text: `Workout emailed to ${res.recipient}!`, type: 'success' });
    } catch (err) {
      setActionMsg({ text: 'Failed to email workout', type: 'error' });
    } finally {
      setEmailLoading(false);
      setTimeout(() => setActionMsg(null), 4000);
    }
  }

  return (
    <div className="card transition-all space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary-50 p-2.5 text-primary-600">
            <Dumbbell size={20} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{workout.workoutName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium capitalize text-gray-500">
                {workout.muscleGroup?.replace('_', ' ')}
              </span>
              {totalExercises > 0 && (
                <span className="text-xs text-gray-400">
                  • {totalExercises} {totalExercises === 1 ? 'exercise' : 'exercises'} ({totalSets} {totalSets === 1 ? 'set' : 'sets'})
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={statusBadge[workout.status] || 'badge-planned'}>
            {statusLabel[workout.status] || workout.status}
          </span>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(workout._id);
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete workout"
              aria-label="Delete workout"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        {workout.estimatedDurationMinutes ? (
          <span className="flex items-center gap-1">
            <Clock size={13} /> {workout.estimatedDurationMinutes} min estimated
          </span>
        ) : <span />}

        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700"
          >
            {isExpanded ? (
              <>Hide Details <ChevronUp size={14} /></>
            ) : (
              <>View Exercises & Sets <ChevronDown size={14} /></>
            )}
          </button>
        )}
      </div>

      {actionMsg && (
        <div className={`p-2 rounded text-[11px] flex items-center gap-1.5 ${actionMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {actionMsg.type === 'error' ? <AlertCircle size={13} /> : <Check size={13} />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Integration Quick Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSyncCalendar}
          disabled={calLoading}
          className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5 text-gray-700 hover:text-blue-700"
          title="Add this workout to Google Calendar"
        >
          <Calendar size={13} className="text-blue-600" />
          <span>{calLoading ? 'Syncing…' : 'Add to Calendar'}</span>
        </button>
        <button
          type="button"
          onClick={handleSendEmail}
          disabled={emailLoading}
          className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5 text-gray-700 hover:text-amber-700"
          title="Email workout breakdown & metrics"
        >
          <Mail size={13} className="text-amber-600" />
          <span>{emailLoading ? 'Sending…' : 'Email Summary'}</span>
        </button>
      </div>

      {workout.status !== 'completed' && onStart && (
        <button onClick={onStart} className="btn-primary w-full text-sm">
          Start Workout
        </button>
      )}

      {workout.status !== 'completed' && onStatusChange && (
        <button
          onClick={() => onStatusChange(workout._id, 'completed')}
          className="btn-secondary flex w-full items-center justify-center gap-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
        >
          <CheckCircle2 size={14} /> Mark Workout Completed
        </button>
      )}
    </div>
  );
}
