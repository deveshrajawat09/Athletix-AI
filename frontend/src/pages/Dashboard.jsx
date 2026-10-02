import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Moon, Footprints, Weight, Droplet, Flame, Sparkles, ArrowUpRight, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getToday, getProgress, getDailyProgress } from '../api/dashboard';
import HealthCard from '../components/HealthCard';
import WorkoutCard from '../components/WorkoutCard';
import CardioCard from '../components/CardioCard';
import ProgressChart from '../components/ProgressChart';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import PredictiveMovementCard from '../components/PredictiveMovementCard';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [progress, setProgress] = useState(null);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getToday(), getProgress('week'), getDailyProgress()])
      .then(([t, p, d]) => { setToday(t); setProgress(p); setDaily(d.daily); })
      .catch(() => setError('Could not load your dashboard. Pull to refresh.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Loading your dashboard…" />;
  if (error) return <ErrorMessage message={error} />;

  const metrics = today?.healthMetrics;

  return (
    <div className="space-y-7 pb-24">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#d8eee2] p-5 sm:p-7 shadow-[0_18px_38px_rgba(44,107,82,0.12)]">
        <div className="relative z-10 max-w-[62%] sm:max-w-md">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2c9d82]">Your daily movement</p>
          <h1 className="text-2xl font-extrabold leading-tight text-[#18312c] sm:text-3xl">{greeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#55766a]">Plan your session, log your sets, and review real progress.</p>
          <Link to="/workout" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2c9d82] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#2c9d82]/20">
            Start workout <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="absolute -right-8 -top-12 h-48 w-48 rounded-full bg-[#b9dfca]" />
        <div className="absolute -bottom-20 right-10 h-44 w-44 rounded-full bg-[#f4b59a] opacity-80" />
      </div>

      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#82958d]">Today</p>
          <h2 className="mt-1 text-lg font-extrabold text-[#18312c]">Your progress</h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#55766a] shadow-sm ring-1 ring-[#dce8df]"><CalendarDays size={14} /> This week</div>
      </div>

      {/* AI Movement & Workout Predictor */}
      <PredictiveMovementCard
        onPlanAccepted={() => {
          Promise.all([getToday(), getProgress('week'), getDailyProgress()])
            .then(([t, p, d]) => { setToday(t); setProgress(p); setDaily(d.daily); });
        }}
      />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Today's Health Summary</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <HealthCard icon={HeartPulse} label="Heart Rate" value={metrics?.heartRate} unit="bpm" />
          <HealthCard icon={Moon} label="Sleep" value={metrics?.sleepDurationHours} unit="hrs" />
          <HealthCard icon={Footprints} label="Steps" value={metrics?.steps} />
          <HealthCard icon={Weight} label="Weight" value={metrics?.weight} unit="kg" />
          <HealthCard icon={Droplet} label="Water" value={metrics?.waterIntakeGlasses} unit="glasses" />
          <HealthCard icon={Flame} label="Calories" value={metrics?.calories} unit="kcal" />
        </div>
      </section>

      <section id="today-plan">
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Today's Workout</h2>
        {today?.workout ? <WorkoutCard workout={today.workout} /> : (
          <p className="card text-sm text-gray-400">No workout planned for today yet.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Today's Cardio</h2>
        {today?.cardio ? <CardioCard cardio={today.cardio} /> : (
          <p className="card text-sm text-gray-400">No cardio planned for today yet.</p>
        )}
      </section>

      {today?.pendingTasks?.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-500">Pending Tasks</h2>
          <ul className="card space-y-1.5 text-sm text-gray-700">
            {today.pendingTasks.map((t, i) => <li key={i}>• {t}</li>)}
          </ul>
        </section>
      )}

      <section>
        <div className="card flex items-center justify-between gap-3 bg-primary-50/50">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-600 p-2 text-white"><Sparkles size={18} /></div>
            <div>
              <p className="font-medium text-gray-900">Talk to your Coach</p>
              <p className="text-xs text-gray-500">Get today's plan, past activity, or progress.</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Link to="/coach" className="btn-primary whitespace-nowrap text-sm">Talk to Coach</Link>
            <a href="#today-plan" className="btn-secondary whitespace-nowrap text-center text-sm">View Today's Plan</a>
          </div>
        </div>
      </section>

      {progress && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-500">Weekly Progress</h2>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="card">
              <p className="text-2xl font-bold text-gray-900">{progress.totalWorkouts}</p>
              <p className="text-xs text-gray-400">Workouts completed</p>
            </div>
            <div className="card">
              <p className="text-2xl font-bold text-gray-900">{progress.totalCardioDistanceKm} km</p>
              <p className="text-xs text-gray-400">Cardio distance</p>
            </div>
          </div>
          {daily && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ProgressChart data={daily} dataKey="workouts" label="Workouts per day" color="#2a82f5" />
              <ProgressChart data={daily} dataKey="cardioKm" label="Cardio km per day" color="#22b06a" />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
