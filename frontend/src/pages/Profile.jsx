import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getHealthProfile, saveHealthProfile } from '../api/health';
import LoadingState from '../components/LoadingState';
import IntegrationsCard from '../components/IntegrationsCard';
import SelectField from '../components/SelectField';

const GOALS = ['weight_loss', 'muscle_gain', 'endurance', 'general_fitness', 'strength', 'maintenance'];
const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const EXPERIENCE = ['beginner', 'intermediate', 'advanced'];

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    age: '', height: '', weight: '', fitnessGoal: 'general_fitness',
    activityLevel: 'moderate', fitnessExperience: 'beginner', healthNotes: '',
  });

  useEffect(() => {
    getHealthProfile().then((d) => {
      if (d.profile) {
        setProfile(d.profile);
        setForm({
          age: d.profile.age || '', height: d.profile.height || '', weight: d.profile.weight || '',
          fitnessGoal: d.profile.fitnessGoal || 'general_fitness', activityLevel: d.profile.activityLevel || 'moderate',
          fitnessExperience: d.profile.fitnessExperience || 'beginner', healthNotes: d.profile.healthNotes || '',
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    ['age', 'height', 'weight'].forEach((k) => { payload[k] = payload[k] ? Number(payload[k]) : undefined; });
    const d = await saveHealthProfile(payload);
    setProfile(d.profile);
    setSaving(false);
  }

  if (loading) return <LoadingState label="Loading profile…" />;

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>
        <button onClick={logout} className="btn-secondary text-sm">Log out</button>
      </div>

      {profile?.bmi && (
        <div className="card">
          <p className="text-xs font-medium text-gray-400">BMI (informational only)</p>
          <p className="text-2xl font-bold text-gray-900">{profile.bmi}</p>
          <p className="text-xs text-gray-400">This is a general metric, not a medical diagnosis.</p>
        </div>
      )}

      <form onSubmit={handleSave} className="card space-y-3">
        <h2 className="font-semibold text-gray-900">Health Profile</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Age</label>
            <input type="number" min="5" className="input-field" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </div>
          <div>
            <label className="label">Height (cm)</label>
            <input type="number" min="50" className="input-field" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" min="20" className="input-field" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Fitness goal</label>
          <SelectField value={form.fitnessGoal} onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })} options={GOALS.map((goal) => ({ value: goal, label: goal.replace('_', ' ') }))} aria-label="Fitness goal" />
        </div>
        <div>
          <label className="label">Activity level</label>
          <SelectField value={form.activityLevel} onChange={(e) => setForm({ ...form, activityLevel: e.target.value })} options={ACTIVITY_LEVELS.map((level) => ({ value: level, label: level.replace('_', ' ') }))} aria-label="Activity level" />
        </div>
        <div>
          <label className="label">Experience</label>
          <SelectField value={form.fitnessExperience} onChange={(e) => setForm({ ...form, fitnessExperience: e.target.value })} options={EXPERIENCE.map((experience) => ({ value: experience, label: experience }))} aria-label="Fitness experience" />
        </div>
        <div>
          <label className="label">Health notes (optional)</label>
          <textarea className="input-field" rows={3} value={form.healthNotes} onChange={(e) => setForm({ ...form, healthNotes: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</button>
      </form>

      <IntegrationsCard />
    </div>
  );
}
