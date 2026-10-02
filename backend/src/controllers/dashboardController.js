const Workout = require('../models/Workout');
const CardioSession = require('../models/CardioSession');
const DailyHealthMetric = require('../models/DailyHealthMetric');
const asyncHandler = require('../utils/asyncHandler');

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sunday
  x.setDate(x.getDate() - day);
  return x;
}

// GET /api/dashboard/today
// Returns only what is actually stored. No fabricated values — missing data is
// represented as null, and the frontend is responsible for rendering "Not available".
const getToday = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = new Date();
  const from = startOfDay(today);
  const to = endOfDay(today);

  const [workout, cardio, metric] = await Promise.all([
    Workout.findOne({ userId, date: { $gte: from, $lte: to } }).sort({ createdAt: -1 }),
    CardioSession.findOne({ userId, date: { $gte: from, $lte: to } }).sort({ createdAt: -1 }),
    DailyHealthMetric.findOne({ userId, date: from }),
  ]);

  const pendingTasks = [];
  if (workout && workout.status !== 'completed' && workout.status !== 'skipped') {
    pendingTasks.push(`${workout.workoutName} workout`);
  }
  if (cardio && cardio.status !== 'completed' && cardio.status !== 'skipped') {
    pendingTasks.push(`${cardio.activityType} (${cardio.distanceKm ?? '?'} km)`);
  }

  res.json({
    success: true,
    date: from,
    workout: workout || null,
    cardio: cardio || null,
    healthMetrics: metric || null,
    pendingTasks,
  });
});

// GET /api/dashboard/summary?date=YYYY-MM-DD  (defaults to today)
const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const day = req.query.date ? new Date(req.query.date) : new Date();
  const from = startOfDay(day);
  const to = endOfDay(day);

  const [workouts, cardioSessions, metric] = await Promise.all([
    Workout.find({ userId, date: { $gte: from, $lte: to } }),
    CardioSession.find({ userId, date: { $gte: from, $lte: to } }),
    DailyHealthMetric.findOne({ userId, date: from }),
  ]);

  res.json({ success: true, date: from, workouts, cardioSessions, healthMetrics: metric || null });
});

// GET /api/dashboard/progress?range=week|month  (defaults to week)
const getProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const range = req.query.range === 'month' ? 'month' : 'week';

  const from = range === 'week' ? startOfWeek() : (() => {
    const d = startOfDay();
    d.setDate(1);
    return d;
  })();

  const [workouts, cardioSessions] = await Promise.all([
    Workout.find({ userId, date: { $gte: from }, status: 'completed' }),
    CardioSession.find({ userId, date: { $gte: from }, status: 'completed' }),
  ]);

  const totalWorkouts = workouts.length;
  const totalCardioDistanceKm = cardioSessions.reduce((sum, c) => sum + (c.distanceKm || 0), 0);
  const totalWorkoutDurationMinutes = workouts.reduce((sum, w) => sum + (w.actualDurationMinutes || 0), 0);
  const totalCardioDurationMinutes = cardioSessions.reduce((sum, c) => sum + (c.durationMinutes || 0), 0);

  res.json({
    success: true,
    range,
    from,
    totalWorkouts,
    totalCardioDistanceKm: Number(totalCardioDistanceKm.toFixed(2)),
    totalWorkoutDurationMinutes,
    totalCardioDurationMinutes,
  });
});

// GET /api/dashboard/progress/daily — last 7 days, one entry per day, for charting.
// Days with no completed activity return 0, never a fabricated value.
const getDailyProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const from = startOfDay(days[0]);
  const [workouts, cardioSessions] = await Promise.all([
    Workout.find({ userId, date: { $gte: from }, status: 'completed' }),
    CardioSession.find({ userId, date: { $gte: from }, status: 'completed' }),
  ]);

  const dayKey = (d) => startOfDay(d).toISOString().slice(0, 10);
  const workoutCountByDay = {};
  const cardioDistanceByDay = {};

  workouts.forEach((w) => {
    const k = dayKey(w.date);
    workoutCountByDay[k] = (workoutCountByDay[k] || 0) + 1;
  });
  cardioSessions.forEach((c) => {
    const k = dayKey(c.date);
    cardioDistanceByDay[k] = (cardioDistanceByDay[k] || 0) + (c.distanceKm || 0);
  });

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daily = days.map((d) => {
    const k = dayKey(d);
    return {
      label: weekdayLabels[d.getDay()],
      date: k,
      workouts: workoutCountByDay[k] || 0,
      cardioKm: Number((cardioDistanceByDay[k] || 0).toFixed(2)),
    };
  });

  res.json({ success: true, daily });
});

module.exports = { getToday, getSummary, getProgress, getDailyProgress };
