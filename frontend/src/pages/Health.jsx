import React, { useEffect, useState } from 'react';
import { HeartPulse, Moon, Footprints, Weight, Droplet, Flame } from 'lucide-react';
import { getMetrics, saveMetrics } from '../api/health';
import HealthCard from '../components/HealthCard';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export default function Health() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ heartRate: '', sleepDurationHours: '', steps: '', waterIntakeGlasses: '', weight: '', calories: '' });

  function load() {
    setLoading(true);
    getMetrics()
      .then((d) => setMetrics(d.metrics))
      .catch(() => setError('Could not load health data.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const todayMetric = metrics[0] || null;

  async function handleSave(e) {
    e.preventDefault();
    const payload = {};
    Object.entries(form).forEach(([k, v]) => { if (v !== '') payload[k] = Number(v); });
    try {
      await saveMetrics(payload);
      setForm({ heartRate: '', sleepDurationHours: '', steps: '', waterIntakeGlasses: '', weight: '', calories: '' });
      load();
    } catch {
      setError('Could not save today\u2019s metrics.');
    }
  }

  if (loading) return <LoadingState label="Loading health data…" />;

  return (
    <div className="space-y-6 pb-24">
      <h1 className="text-xl font-bold text-gray-900">Health</h1>
      {error && <ErrorMessage message={error} />}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Today</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <HealthCard icon={HeartPulse} label="Heart Rate" value={todayMetric?.heartRate} unit="bpm" />
          <HealthCard icon={Moon} label="Sleep" value={todayMetric?.sleepDurationHours} unit="hrs" />
          <HealthCard icon={Footprints} label="Steps" value={todayMetric?.steps} />
          <HealthCard icon={Weight} label="Weight" value={todayMetric?.weight} unit="kg" />
          <HealthCard icon={Droplet} label="Water" value={todayMetric?.waterIntakeGlasses} unit="glasses" />
          <HealthCard icon={Flame} label="Calories" value={todayMetric?.calories} unit="kcal" />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Log Today's Metrics</h2>
        <form onSubmit={handleSave} className="card grid grid-cols-2 gap-3">
          <div>
            <label className="label">Heart rate (bpm)</label>
            <input type="number" min="0" className="input-field" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: e.target.value })} />
          </div>
          <div>
            <label className="label">Sleep (hrs)</label>
            <input type="number" step="0.1" min="0" className="input-field" value={form.sleepDurationHours} onChange={(e) => setForm({ ...form, sleepDurationHours: e.target.value })} />
          </div>
          <div>
            <label className="label">Steps</label>
            <input type="number" min="0" className="input-field" value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} />
          </div>
          <div>
            <label className="label">Water (glasses)</label>
            <input type="number" min="0" className="input-field" value={form.waterIntakeGlasses} onChange={(e) => setForm({ ...form, waterIntakeGlasses: e.target.value })} />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" step="0.1" min="0" className="input-field" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
          <div>
            <label className="label">Calories</label>
            <input type="number" min="0" className="input-field" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary col-span-2">Save</button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Recent History</h2>
        {metrics.length === 0 ? (
          <p className="card text-sm text-gray-400">No health data recorded yet.</p>
        ) : (
          <div className="card divide-y divide-surface-border">
            {metrics.slice(0, 14).map((m) => (
              <div key={m._id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-500">{new Date(m.date).toLocaleDateString()}</span>
                <span className="text-gray-700">
                  {m.weight ? `${m.weight} kg` : 'Not recorded'} / {m.steps ? `${m.steps} steps` : 'Not recorded'} / {m.sleepDurationHours ? `${m.sleepDurationHours} hrs sleep` : 'Not recorded'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
