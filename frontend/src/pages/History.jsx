import React, { useEffect, useState } from 'react';
import { getSummary } from '../api/dashboard';
import WorkoutCard from '../components/WorkoutCard';
import CardioCard from '../components/CardioCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

function toInputDate(d) {
  return d.toISOString().slice(0, 10);
}

export default function History() {
  const [date, setDate] = useState(toInputDate(new Date()));
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSummary(date).then(setSummary).finally(() => setLoading(false));
  }, [date]);

  const hasData = summary && (summary.workouts?.length || summary.cardioSessions?.length || summary.healthMetrics);

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-xl font-bold text-gray-900">History</h1>

      <input
        type="date"
        value={date}
        max={toInputDate(new Date())}
        onChange={(e) => setDate(e.target.value)}
        className="input-field"
      />

      {loading ? (
        <LoadingState label="Loading day…" />
      ) : !hasData ? (
        <EmptyState title="No activity recorded" description="Nothing was logged for this date." />
      ) : (
        <div className="space-y-3">
          {summary.workouts?.map((w) => <WorkoutCard key={w._id} workout={w} />)}
          {summary.cardioSessions?.map((c) => <CardioCard key={c._id} cardio={c} />)}
          {summary.healthMetrics && (
            <div className="card text-sm text-gray-700">
              <p className="mb-1 font-medium text-gray-900">Health metrics</p>
              <p className="text-gray-500">
                {summary.healthMetrics.weight ? `${summary.healthMetrics.weight} kg` : 'Weight: not available'} ·{' '}
                {summary.healthMetrics.sleepDurationHours ? `${summary.healthMetrics.sleepDurationHours} hrs sleep` : 'Sleep: not available'} ·{' '}
                {summary.healthMetrics.steps ? `${summary.healthMetrics.steps} steps` : 'Steps: not available'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
