import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trophy, Dumbbell, Trash2, Check, X, Search, Timer, Play, Pause, RotateCcw, ChevronDown } from 'lucide-react';
import {
  listWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  addExercise,
  addSet,
  deleteExercise,
  getPersonalRecords,
} from '../api/workouts';
import WorkoutCard from '../components/WorkoutCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import SelectField from '../components/SelectField';

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'other'];
const REST_OPTIONS = [5, 10, 15, 20, 25, 30];

export default function Workout() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [records, setRecords] = useState([]);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [restDurationMinutes, setRestDurationMinutes] = useState(15);
  const [restSeconds, setRestSeconds] = useState(15 * 60);
  const [restRunning, setRestRunning] = useState(false);
  const [restMenuOpen, setRestMenuOpen] = useState(false);
  const restMenuRef = useRef(null);

  // New workout form state
  const [form, setForm] = useState({
    workoutName: '',
    muscleGroup: 'chest',
    estimatedDurationMinutes: '',
  });

  // Add exercise form state
  const [newExercise, setNewExercise] = useState({ workoutId: null, exerciseName: '' });

  // Add set form state: keyed by exerciseId: { weight: '', reps: '' }
  const [setForms, setSetForms] = useState({});

  function loadWorkouts() {
    return listWorkouts()
      .then((d) => setWorkouts(d.workouts || []))
      .catch(() => setError('Could not load workouts.'));
  }

  function loadRecords() {
    return getPersonalRecords()
      .then((d) => setRecords(d.records || []))
      .catch(() => setError('Could not load personal records.'));
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadWorkouts(), loadRecords()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!restRunning) return undefined;
    const timer = window.setInterval(() => {
      setRestSeconds((seconds) => {
        if (seconds <= 1) {
          setRestRunning(false);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restRunning]);

  useEffect(() => {
    function closeRestMenu(event) {
      if (!restMenuRef.current?.contains(event.target)) setRestMenuOpen(false);
    }
    document.addEventListener('mousedown', closeRestMenu);
    return () => document.removeEventListener('mousedown', closeRestMenu);
  }, []);

  const filteredWorkouts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workouts.filter((workout) => {
      const matchesSearch = !query
        || workout.workoutName?.toLowerCase().includes(query)
        || workout.muscleGroup?.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || workout.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [workouts, search, statusFilter]);

  const completedCount = workouts.filter((workout) => workout.status === 'completed').length;
  const activeCount = workouts.filter((workout) => workout.status === 'in_progress').length;
  const loggedSets = workouts.reduce(
    (total, workout) => total + (workout.exercises || []).reduce((sets, exercise) => sets + (exercise.sets || []).length, 0),
    0
  );

  function resetRestTimer() {
    setRestRunning(false);
    setRestSeconds(restDurationMinutes * 60);
  }

  function changeRestDuration(event) {
    const duration = Number(event.target.value);
    setRestDurationMinutes(duration);
    setRestRunning(false);
    setRestSeconds(duration * 60);
  }

  function toggleRecords() {
    if (!showRecords) loadRecords();
    setShowRecords((s) => !s);
  }

  async function handleCreateWorkout(e) {
    e.preventDefault();
    try {
      await createWorkout({
        date: new Date().toISOString(),
        workoutName: form.workoutName,
        muscleGroup: form.muscleGroup,
        estimatedDurationMinutes: form.estimatedDurationMinutes ? Number(form.estimatedDurationMinutes) : undefined,
        status: 'in_progress',
      });
      setForm({ workoutName: '', muscleGroup: 'chest', estimatedDurationMinutes: '' });
      setShowForm(false);
      await loadWorkouts();
    } catch {
      setError('Could not create workout.');
    }
  }

  async function handleDeleteWorkout(id) {
    if (!window.confirm('Delete this workout and its logged sets?')) return;
    try {
      await deleteWorkout(id);
      await loadWorkouts();
      await loadRecords();
    } catch {
      setError('Could not delete workout.');
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await updateWorkout(id, { status: newStatus });
      await loadWorkouts();
      await loadRecords();
    } catch {
      setError('Could not update workout status.');
    }
  }

  async function handleAddExercise(workoutId) {
    const name = newExercise.exerciseName?.trim();
    if (!name) return;
    try {
      await addExercise(workoutId, { exerciseName: name });
      setNewExercise({ workoutId: null, exerciseName: '' });
      await loadWorkouts();
    } catch {
      setError('Could not add exercise.');
    }
  }

  async function handleDeleteExercise(workoutId, exerciseId) {
    try {
      await deleteExercise(workoutId, exerciseId);
      await loadWorkouts();
      await loadRecords();
    } catch {
      setError('Could not delete exercise.');
    }
  }

  async function handleAddSet(workoutId, exerciseId) {
    const sForm = setForms[exerciseId] || {};
    const weight = Number(sForm.weight) || 0;
    const reps = Number(sForm.reps);
    if (!reps || reps <= 0) {
      setError('Please enter valid repetitions.');
      return;
    }
    try {
      await addSet(workoutId, exerciseId, { weight, reps, completed: true });
      setSetForms((prev) => ({ ...prev, [exerciseId]: { weight: '', reps: '' } }));
      setError('');
      await loadWorkouts();
      await loadRecords();
    } catch {
      setError('Could not log set.');
    }
  }

  if (loading) return <LoadingState label="Loading workouts…" />;

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#82958d]">Training space</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#18312c]">Your workouts</h1>
          <p className="mt-1 text-sm text-[#82958d]">Track progress, log sets, and keep moving.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleRecords} className="btn-secondary flex items-center gap-1.5 text-sm">
            <Trophy size={16} className={records.length > 0 ? 'text-amber-500' : ''} /> Records
          </button>
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl bg-[#d8eee2] p-3 sm:p-4">
          <p className="text-xl font-extrabold text-[#18312c]">{completedCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-[#55766a]">Completed</p>
        </div>
        <div className="rounded-2xl bg-[#fde4d5] p-3 sm:p-4">
          <p className="text-xl font-extrabold text-[#18312c]">{activeCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-[#8b6758]">In progress</p>
        </div>
        <div className="rounded-2xl bg-[#e9e4f4] p-3 sm:p-4">
          <p className="text-xl font-extrabold text-[#18312c]">{loggedSets}</p>
          <p className="mt-1 text-[11px] font-semibold text-[#6d6281]">Sets logged</p>
        </div>
      </div>

      <div className="card flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#82958d]" />
          <input
            className="input-field pl-9"
            placeholder="Search workouts or muscle groups"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <SelectField
          className="sm:w-40"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'in_progress', label: 'In progress' },
            { value: 'planned', label: 'Planned' },
            { value: 'completed', label: 'Completed' },
          ]}
          aria-label="Workout status"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f2d1bf] bg-[#fff2e8] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-[#f2a47f] p-2 text-white"><Timer size={16} /></div>
          <div>
            <p className="text-sm font-bold text-[#4c342b]">Rest timer</p>
            <p className="text-xs text-[#8b6758]">Take a focused break between sets.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div ref={restMenuRef} className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={restMenuOpen}
              onClick={() => setRestMenuOpen((open) => !open)}
              className="flex min-w-[5.5rem] items-center justify-between gap-2 rounded-xl border border-[#e7c2ad] bg-white px-2.5 py-2 text-xs font-semibold text-[#4c342b] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f2a47f]/30"
            >
              {restDurationMinutes} min
              <ChevronDown size={14} className={`transition-transform ${restMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {restMenuOpen && (
              <div role="listbox" aria-label="Rest duration" className="absolute right-0 top-[calc(100%+0.4rem)] z-20 w-28 overflow-hidden rounded-xl border border-[#e7c2ad] bg-white p-1.5 shadow-[0_12px_24px_rgba(76,52,43,0.16)]">
                {REST_OPTIONS.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    role="option"
                    aria-selected={duration === restDurationMinutes}
                    onClick={() => {
                      changeRestDuration({ target: { value: duration } });
                      setRestMenuOpen(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${duration === restDurationMinutes ? 'bg-[#fff0e7] text-[#b96845]' : 'text-[#6d554b] hover:bg-[#fff7f2]'}`}
                  >
                    {duration} minutes
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="min-w-[3.5rem] text-center text-lg font-extrabold tabular-nums text-[#4c342b]">
            {String(Math.floor(restSeconds / 60)).padStart(2, '0')}:{String(restSeconds % 60).padStart(2, '0')}
          </span>
          <button type="button" onClick={() => setRestRunning((running) => !running)} className="rounded-xl bg-[#4c342b] p-2 text-white" title={restRunning ? 'Pause timer' : 'Start timer'}>
            {restRunning ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button type="button" onClick={resetRestTimer} className="rounded-xl border border-[#e7c2ad] p-2 text-[#8b6758]" title="Reset timer">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Personal Records Drawer */}
      {showRecords && (
        <div className="card border-primary-100 bg-[#f8fbf5]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              <p className="text-sm font-semibold text-gray-900">Personal Records (PRs)</p>
            </div>
            <span className="text-xs text-gray-400">Computed from completed workouts</span>
          </div>
          {records.length === 0 ? (
            <p className="text-sm text-gray-400">
              No completed workouts with logged sets yet. Complete a workout with sets to unlock your PRs!
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {records.map((r) => (
                <div key={r.exerciseName} className="rounded-xl border border-surface-border bg-white p-3 shadow-xs">
                  <p className="font-semibold text-gray-900">{r.exerciseName}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                    <span>
                      Max: <strong className="text-primary-700">{r.maxWeight} kg</strong>
                    </span>
                    <span>
                      Reps: <strong className="text-primary-700">{r.maxReps}</strong>
                    </span>
                    <span>
                      Volume: <strong className="text-primary-700">{r.maxSessionVolume} kg</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create New Workout Form */}
      {showForm && (
        <form onSubmit={handleCreateWorkout} className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Create New Workout</h2>
          <div>
            <label className="label">Workout name</label>
            <input
              required
              className="input-field"
              placeholder="e.g. Chest & Triceps"
              value={form.workoutName}
              onChange={(e) => setForm({ ...form, workoutName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Target Muscle Group</label>
            <SelectField
              value={form.muscleGroup}
              onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
              options={MUSCLE_GROUPS.map((group) => ({ value: group, label: group.replace('_', ' ').toUpperCase() }))}
              aria-label="Target muscle group"
            />
          </div>
          <div>
            <label className="label">Estimated duration (minutes)</label>
            <input
              type="number"
              min="5"
              max="240"
              placeholder="e.g. 60"
              className="input-field"
              value={form.estimatedDurationMinutes}
              onChange={(e) => setForm({ ...form, estimatedDurationMinutes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1">
              Save Workout
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

      {/* Workout List */}
      {workouts.length === 0 ? (
        <EmptyState
          title="No workouts yet"
          description="Create your first workout to start logging exercises and sets."
        />
      ) : filteredWorkouts.length === 0 ? (
        <EmptyState
          title="No matching workouts"
          description="Try a different search or status filter."
          action={<button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="btn-secondary mt-2 text-xs">Clear filters</button>}
        />
      ) : (
        <div className="space-y-3">
          {filteredWorkouts.map((w) => {
            const isExpanded = expandedWorkoutId === w._id;
            return (
              <div key={w._id} className="space-y-2">
                <WorkoutCard
                  workout={w}
                  isExpanded={isExpanded}
                  onToggleExpand={() => setExpandedWorkoutId(isExpanded ? null : w._id)}
                  onDelete={handleDeleteWorkout}
                  onStatusChange={handleStatusChange}
                />

                {/* Expanded Exercises & Sets View */}
                {isExpanded && (
                  <div className="ml-2 rounded-2xl border border-surface-border bg-white p-4 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-surface-border pb-2">
                      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <Dumbbell size={16} className="text-primary-600" /> Exercises & Sets
                      </h3>
                      <span className="text-xs text-gray-400">
                        {w.exercises?.length || 0} exercises added
                      </span>
                    </div>

                    {(!w.exercises || w.exercises.length === 0) ? (
                      <p className="text-xs text-gray-400 py-2">
                        No exercises added yet. Add an exercise below to start tracking your sets.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {w.exercises.map((ex) => {
                          const sForm = setForms[ex._id] || { weight: '', reps: '' };
                          return (
                            <div key={ex._id} className="rounded-xl border border-surface-border bg-surface-muted/50 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm text-gray-900">
                                  {ex.exerciseName}
                                </span>
                                <button
                                  onClick={() => handleDeleteExercise(w._id, ex._id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                  title="Remove exercise"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {/* Sets Table */}
                              {ex.sets && ex.sets.length > 0 ? (
                                <div className="divide-y divide-surface-border rounded-lg bg-white border border-surface-border mb-3">
                                  <div className="grid grid-cols-4 px-3 py-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                    <span>Set</span>
                                    <span>Weight</span>
                                    <span>Reps</span>
                                    <span className="text-right">Status</span>
                                  </div>
                                  {ex.sets.map((s, idx) => (
                                    <div key={idx} className="grid grid-cols-4 px-3 py-2 text-xs items-center">
                                      <span className="font-medium text-gray-600">#{s.setNumber || idx + 1}</span>
                                      <span className="text-gray-800 font-semibold">{s.weight ?? 0} kg</span>
                                      <span className="text-gray-800">{s.reps ?? 0} reps</span>
                                      <span className="text-right flex justify-end">
                                        {s.completed ? (
                                          <span className="inline-flex items-center gap-0.5 text-accent-600 font-medium text-[11px]">
                                            <Check size={12} strokeWidth={3} /> Done
                                          </span>
                                        ) : (
                                          <span className="text-gray-400 text-[11px]">Pending</span>
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 mb-2">No sets logged yet.</p>
                              )}

                              {/* Add Set Inline Input */}
                              <div className="flex items-center gap-2 pt-1">
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    placeholder="Weight (kg)"
                                    className="input-field text-xs py-1.5 px-2.5"
                                    value={sForm.weight}
                                    onChange={(e) =>
                                      setSetForms({
                                        ...setForms,
                                        [ex._id]: { ...sForm, weight: e.target.value },
                                      })
                                    }
                                  />
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="Reps"
                                    className="input-field text-xs py-1.5 px-2.5"
                                    value={sForm.reps}
                                    onChange={(e) =>
                                      setSetForms({
                                        ...setForms,
                                        [ex._id]: { ...sForm, reps: e.target.value },
                                      })
                                    }
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddSet(w._id, ex._id)}
                                  className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                                >
                                  + Log Set
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Exercise to this Workout */}
                    {newExercise.workoutId === w._id ? (
                      <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-3 space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Exercise Name</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Barbell Bench Press, Incline DB Curl"
                            className="input-field text-sm"
                            value={newExercise.exerciseName}
                            onChange={(e) =>
                              setNewExercise({ ...newExercise, exerciseName: e.target.value })
                            }
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddExercise(w._id)}
                            className="btn-primary text-xs px-3"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setNewExercise({ workoutId: null, exerciseName: '' })}
                            className="btn-secondary text-xs px-2.5"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setNewExercise({ workoutId: w._id, exerciseName: '' })}
                        className="btn-secondary w-full text-xs flex items-center justify-center gap-1 py-2 text-primary-700 border-dashed border-primary-200"
                      >
                        <Plus size={14} /> Add Exercise to Workout
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
