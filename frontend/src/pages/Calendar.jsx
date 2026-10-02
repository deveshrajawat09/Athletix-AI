import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Dumbbell, Activity, Clock } from 'lucide-react';
import { listWorkouts } from '../api/workouts';
import { listCardio } from '../api/cardio';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(key) {
  return new Date(`${key}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function Calendar() {
  const [month, setMonth] = useState(() => new Date());
  const [workouts, setWorkouts] = useState([]);
  const [cardio, setCardio] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listWorkouts(), listCardio()])
      .then(([workoutData, cardioData]) => {
        setWorkouts(workoutData.workouts || []);
        setCardio(cardioData.sessions || []);
      })
      .catch(() => setError('Could not load your training calendar.'))
      .finally(() => setLoading(false));
  }, []);

  const eventsByDate = useMemo(() => {
    const events = {};
    workouts.forEach((workout) => {
      const key = dateKey(workout.date);
      events[key] = events[key] || [];
      events[key].push({ type: 'workout', title: workout.workoutName, detail: workout.muscleGroup, status: workout.status });
    });
    cardio.forEach((session) => {
      const key = dateKey(session.date);
      events[key] = events[key] || [];
      events[key].push({ type: 'cardio', title: session.activityType, detail: session.distanceKm ? `${session.distanceKm} km` : 'Cardio session', status: session.status });
    });
    return events;
  }, [workouts, cardio]);

  const days = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    return Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => {
      const dayNumber = index - firstDay + 1;
      return dayNumber > 0 && dayNumber <= daysInMonth ? new Date(year, monthIndex, dayNumber) : null;
    });
  }, [month]);

  const selectedEvents = eventsByDate[selectedDate] || [];
  const todayKey = dateKey(new Date());

  function changeMonth(offset) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  if (loading) return <LoadingState label="Loading training calendar..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#82958d]">Training planner</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#18312c]">Training calendar</h1>
          <p className="mt-1 text-sm text-[#82958d]">Your logged workouts and cardio in one place.</p>
        </div>
        <button type="button" onClick={() => { setMonth(new Date()); setSelectedDate(todayKey); }} className="btn-secondary text-xs">Today</button>
      </div>

      <section className="card p-3 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => changeMonth(-1)} className="rounded-xl p-2 text-[#55766a] hover:bg-[#edf8f2]" aria-label="Previous month"><ChevronLeft size={18} /></button>
          <h2 className="text-base font-extrabold text-[#18312c]">{monthNames[month.getMonth()]} {month.getFullYear()}</h2>
          <button type="button" onClick={() => changeMonth(1)} className="rounded-xl p-2 text-[#55766a] hover:bg-[#edf8f2]" aria-label="Next month"><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 border-b border-[#dce8df] pb-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#82958d]">
          {weekdays.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="min-h-16 rounded-xl bg-[#fbfcfa] sm:min-h-24" />;
            const key = dateKey(day);
            const events = eventsByDate[key] || [];
            const selected = key === selectedDate;
            const isToday = key === todayKey;
            return (
              <button key={key} type="button" onClick={() => setSelectedDate(key)} className={`min-h-16 rounded-xl border p-1.5 text-left transition-colors sm:min-h-24 sm:p-2 ${selected ? 'border-[#2c9d82] bg-[#e3f2e6] shadow-sm' : 'border-[#edf1ed] bg-white hover:border-[#afd2bf]'}`}>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${isToday ? 'bg-[#2c9d82] text-white' : 'text-[#55766a]'}`}>{day.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {events.slice(0, 2).map((event, eventIndex) => (
                    <div key={`${key}-${eventIndex}`} className={`truncate rounded px-1 py-0.5 text-[9px] font-semibold ${event.type === 'workout' ? 'bg-[#d8eee2] text-[#287861]' : 'bg-[#fde4d5] text-[#9a654e]'}`}>
                      {event.type === 'workout' ? 'Workout' : 'Cardio'}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays size={17} className="text-primary-600" />
          <div>
            <h2 className="text-sm font-bold text-[#18312c]">{formatDate(selectedDate)}</h2>
            <p className="text-xs text-[#82958d]">{selectedEvents.length ? `${selectedEvents.length} training item${selectedEvents.length > 1 ? 's' : ''}` : 'No training logged'}</p>
          </div>
        </div>
        {selectedEvents.length > 0 ? (
          <div className="space-y-2">
            {selectedEvents.map((event, index) => (
              <div key={`${event.title}-${index}`} className="flex items-center gap-3 rounded-xl border border-[#edf1ed] bg-[#fbfcfa] p-3">
                <div className={`rounded-lg p-2 ${event.type === 'workout' ? 'bg-[#d8eee2] text-[#287861]' : 'bg-[#fde4d5] text-[#9a654e]'}`}>
                  {event.type === 'workout' ? <Dumbbell size={16} /> : <Activity size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold capitalize text-[#18312c]">{event.title}</p>
                  <p className="text-xs capitalize text-[#82958d]">{event.detail || 'Training session'} · {event.status?.replace('_', ' ')}</p>
                </div>
                <Clock size={15} className="text-[#a4b5ae]" />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[#dce8df] bg-[#fbfcfa] p-4 text-sm text-[#82958d]">Nothing logged for this day yet.</p>
        )}
      </section>
    </div>
  );
}
