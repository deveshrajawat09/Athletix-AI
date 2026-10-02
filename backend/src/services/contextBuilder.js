const Workout = require('../models/Workout');
const CardioSession = require('../models/CardioSession');
const Goal = require('../models/Goal');
const DailyHealthMetric = require('../models/DailyHealthMetric');

const HealthProfile = require('../models/HealthProfile');

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

// Builds the ONLY data the AI service is allowed to see for a given request.
// Nothing here is invented — every field comes straight from the database,
// and anything not found is simply omitted or left empty.
async function buildAIContext(userId) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [
    todayWorkout,
    todayCardio,
    yesterdayWorkout,
    yesterdayCardio,
    recentWorkouts,
    recentCardio,
    goals,
    healthProfile,
    todayMetrics,
  ] = await Promise.all([
    Workout.findOne({ userId, date: { $gte: startOfDay(today), $lte: endOfDay(today) } }),
    CardioSession.findOne({ userId, date: { $gte: startOfDay(today), $lte: endOfDay(today) } }),
    Workout.findOne({ userId, date: { $gte: startOfDay(yesterday), $lte: endOfDay(yesterday) } }),
    CardioSession.findOne({ userId, date: { $gte: startOfDay(yesterday), $lte: endOfDay(yesterday) } }),
    Workout.find({ userId }).sort({ date: -1 }).limit(7),
    CardioSession.find({ userId }).sort({ date: -1 }).limit(7),
    Goal.find({ userId, status: 'active' }),
    HealthProfile.findOne({ userId }),
    DailyHealthMetric.findOne({ userId, date: { $gte: startOfDay(today), $lte: endOfDay(today) } }),
  ]);

  const pendingTasks = [];
  if (todayWorkout && !['completed', 'skipped'].includes(todayWorkout.status)) {
    pendingTasks.push(`${todayWorkout.workoutName} workout`);
  }
  if (todayCardio && !['completed', 'skipped'].includes(todayCardio.status)) {
    pendingTasks.push(`${todayCardio.activityType} ${todayCardio.distanceKm ?? ''} km`.trim());
  }

  const completedTasks = [];
  if (todayWorkout && todayWorkout.status === 'completed') completedTasks.push(`${todayWorkout.workoutName} workout`);
  if (todayCardio && todayCardio.status === 'completed') completedTasks.push(`${todayCardio.activityType}`);

  return {
    currentDate: startOfDay(today).toISOString().slice(0, 10),
    todayPlan: {
      workout: todayWorkout ? { name: todayWorkout.workoutName, muscleGroup: todayWorkout.muscleGroup, status: todayWorkout.status } : null,
      cardio: todayCardio ? { activityType: todayCardio.activityType, distanceKm: todayCardio.distanceKm, status: todayCardio.status } : null,
    },
    yesterday: {
      workout: yesterdayWorkout ? { name: yesterdayWorkout.workoutName, status: yesterdayWorkout.status } : null,
      cardio: yesterdayCardio ? { activityType: yesterdayCardio.activityType, distanceKm: yesterdayCardio.distanceKm, status: yesterdayCardio.status } : null,
    },
    completedTasks,
    pendingTasks,
    recentHistory: recentWorkouts.map((w) => ({ date: w.date.toISOString().slice(0, 10), activity: w.workoutName, status: w.status })),
    recentCardio: recentCardio.map((c) => ({ date: c.date.toISOString().slice(0, 10), activity: c.activityType, distanceKm: c.distanceKm, status: c.status })),
    fitnessGoals: goals.map((g) => `${g.goalType}: ${g.currentProgress}/${g.target}${g.unit ? ' ' + g.unit : ''}`),
  };
}

module.exports = buildAIContext;
