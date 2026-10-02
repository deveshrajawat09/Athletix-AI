import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { listCardio, createCardio, updateCardio, deleteCardio } from '../api/cardio';
import CardioCard from '../components/CardioCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import SelectField from '../components/SelectField';

const ACTIVITY_TYPES = ['running', 'walking', 'cycling', 'jogging', 'other'];

export default function Cardio() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    activityType: 'running',
    distanceKm: '',
    durationMinutes: '',
    calories: '',
    averageHeartRate: '',
  });

  function load() {
    setLoading(true);
    listCardio()
      .then((d) => setSessions(d.sessions || []))
      .catch(() => setError('Could not load cardio sessions.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createCardio({
        date: new Date().toISOString(),
        activityType: form.activityType,
        distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        calories: form.calories ? Number(form.calories) : undefined,
        averageHeartRate: form.averageHeartRate ? Number(form.averageHeartRate) : undefined,
        status: 'completed',
      });
      setForm({
        activityType: 'running',
        distanceKm: '',
        durationMinutes: '',
        calories: '',
        averageHeartRate: '',
      });
      setShowForm(false);
      load();
    } catch {
      setError('Could not save cardio session. Check the values entered.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this cardio session?')) return;
    try {
      await deleteCardio(id);
      load();
    } catch {
      setError('Could not delete cardio session.');
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateCardio(id, { status });
      load();
    } catch {
      setError('Could not update status.');
    }
  }

  if (loading) return <LoadingState label="Loading cardio…" />;

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cardio</h1>
          <p className="text-xs text-gray-400">Track runs, rides, walks, and calories</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> Log Session
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Log Cardio Session</h2>
          <div>
            <label className="label">Activity</label>
            <SelectField
              value={form.activityType}
              onChange={(e) => setForm({ ...form, activityType: e.target.value })}
              options={ACTIVITY_TYPES.map((activity) => ({ value: activity, label: activity.toUpperCase() }))}
              aria-label="Cardio activity"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="input-field"
                placeholder="e.g. 5.0"
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input
                type="number"
                min="1"
                className="input-field"
                placeholder="e.g. 30"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Calories (kcal)</label>
              <input
                type="number"
                min="0"
                className="input-field"
                placeholder="e.g. 350"
                value={form.calories}
                onChange={(e) => setForm({ ...form, calories: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Avg Heart Rate (bpm)</label>
              <input
                type="number"
                min="40"
                max="220"
                className="input-field"
                placeholder="e.g. 145"
                value={form.averageHeartRate}
                onChange={(e) => setForm({ ...form, averageHeartRate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1">
              Save Session
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {sessions.length === 0 ? (
        <EmptyState
          title="No cardio sessions yet"
          description="Log a run, walk, or ride to start tracking your cardio performance."
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((c) => (
            <CardioCard
              key={c._id}
              cardio={c}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
