import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { listGoals, createGoal, updateGoal, deleteGoal } from '../api/goals';
import GoalCard from '../components/GoalCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import SelectField from '../components/SelectField';

const GOAL_TYPES = [
  { value: 'run_distance', label: 'Run distance', unit: 'km' },
  { value: 'workouts_per_week', label: 'Workouts per week', unit: 'sessions' },
  { value: 'daily_steps', label: 'Daily steps', unit: 'steps' },
  { value: 'daily_water', label: 'Daily water', unit: 'glasses' },
  { value: 'weight_target', label: 'Weight target', unit: 'kg' },
  { value: 'consistency', label: 'Consistency', unit: '%' },
];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ goalType: 'run_distance', target: '' });

  function load() {
    setLoading(true);
    listGoals()
      .then((d) => setGoals(d.goals || []))
      .catch(() => setError('Could not load goals.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    const meta = GOAL_TYPES.find((g) => g.value === form.goalType);
    try {
      await createGoal({
        goalType: form.goalType,
        target: Number(form.target),
        unit: meta?.unit,
        startDate: new Date().toISOString(),
      });
      setForm({ goalType: 'run_distance', target: '' });
      setShowForm(false);
      load();
    } catch {
      setError('Could not create goal.');
    }
  }

  async function handleUpdateProgress(id, newProgress) {
    try {
      await updateGoal(id, { currentProgress: newProgress });
      load();
    } catch {
      setError('Could not update goal progress.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await deleteGoal(id);
      load();
    } catch {
      setError('Could not delete goal.');
    }
  }

  if (loading) return <LoadingState label="Loading goals…" />;

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Goals</h1>
          <p className="text-xs text-gray-400">Set targets and track your consistency</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> New Goal
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Set New Goal</h2>
          <div>
            <label className="label">Goal type</label>
            <SelectField
              value={form.goalType}
              onChange={(e) => setForm({ ...form, goalType: e.target.value })}
              options={GOAL_TYPES.map((goal) => ({ value: goal.value, label: `${goal.label} (${goal.unit})` }))}
              aria-label="Goal type"
            />
          </div>
          <div>
            <label className="label">Target</label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 25"
              className="input-field"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1">
              Create Goal
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

      {goals.length === 0 ? (
        <EmptyState title="No goals set" description="Set a goal to get personalized daily plans." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goals.map((g) => (
            <GoalCard
              key={g._id}
              goal={g}
              onUpdateProgress={handleUpdateProgress}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
