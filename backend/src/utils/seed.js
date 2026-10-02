require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');
const Workout = require('../models/Workout');
const WorkoutExercise = require('../models/WorkoutExercise');
const CardioSession = require('../models/CardioSession');
const DailyHealthMetric = require('../models/DailyHealthMetric');
const Goal = require('../models/Goal');
const AIConversation = require('../models/AIConversation');

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seed() {
  if (mongoose.connection.readyState !== 1) {
    console.log('[seed] Connecting to MongoDB...');
    await connectDB();
  }

  console.log('[seed] Clearing existing demo data...');
  const existingUser = await User.findOne({ email: 'demo@athletix.ai' });
  if (existingUser) {
    const uid = existingUser._id;
    await Promise.all([
      User.deleteOne({ _id: uid }),
      HealthProfile.deleteMany({ userId: uid }),
      Workout.deleteMany({ userId: uid }),
      CardioSession.deleteMany({ userId: uid }),
      DailyHealthMetric.deleteMany({ userId: uid }),
      Goal.deleteMany({ userId: uid }),
      AIConversation.deleteMany({ userId: uid }),
    ]);
    const workouts = await Workout.find({ userId: uid }).select('_id');
    await WorkoutExercise.deleteMany({ workoutId: { $in: workouts.map((w) => w._id) } });
  }

  console.log('[seed] Creating demo user...');
  const user = await User.create({
    name: 'Alex Rivera',
    email: 'demo@athletix.ai',
    passwordHash: 'password123', // auto-hashed by User pre-save hook
  });

  console.log('[seed] Creating health profile...');
  await HealthProfile.create({
    userId: user._id,
    age: 28,
    height: 178,
    weight: 74.5,
    fitnessGoal: 'muscle_gain',
    activityLevel: 'active',
    preferredWorkoutDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    preferredWorkoutTime: '07:00',
    fitnessExperience: 'intermediate',
    healthNotes: 'Focusing on progressive overload and recovery. Prioritizing 8 hrs sleep.',
  });

  console.log('[seed] Creating 7 days of health metrics...');
  const metricData = [
    { days: 0, heartRate: 68, sleepDurationHours: 7.5, steps: 8420, waterIntakeGlasses: 8, weight: 74.5, calories: 2350 },
    { days: 1, heartRate: 71, sleepDurationHours: 8.0, steps: 10150, waterIntakeGlasses: 9, weight: 74.6, calories: 2520 },
    { days: 2, heartRate: 66, sleepDurationHours: 7.2, steps: 9200, waterIntakeGlasses: 7, weight: 74.7, calories: 2400 },
    { days: 3, heartRate: 69, sleepDurationHours: 6.8, steps: 7800, waterIntakeGlasses: 8, weight: 74.8, calories: 2280 },
    { days: 4, heartRate: 67, sleepDurationHours: 7.5, steps: 11300, waterIntakeGlasses: 10, weight: 74.9, calories: 2650 },
    { days: 5, heartRate: 72, sleepDurationHours: 8.2, steps: 8900, waterIntakeGlasses: 8, weight: 75.0, calories: 2450 },
    { days: 6, heartRate: 70, sleepDurationHours: 7.0, steps: 6500, waterIntakeGlasses: 7, weight: 75.1, calories: 2100 },
  ];

  for (const m of metricData) {
    await DailyHealthMetric.create({
      userId: user._id,
      date: startOfDay(daysAgo(m.days)),
      heartRate: m.heartRate,
      sleepDurationHours: m.sleepDurationHours,
      steps: m.steps,
      waterIntakeGlasses: m.waterIntakeGlasses,
      weight: m.weight,
      calories: m.calories,
    });
  }

  console.log('[seed] Creating workouts and exercises with sets...');
  // Today's workout (in progress)
  const todayWorkout = await Workout.create({
    userId: user._id,
    date: new Date(),
    workoutName: 'Chest & Triceps Hypertrophy',
    muscleGroup: 'chest',
    estimatedDurationMinutes: 60,
    status: 'in_progress',
    notes: 'Feeling energized today. Focused on controlled negatives.',
  });

  await WorkoutExercise.create({
    workoutId: todayWorkout._id,
    exerciseName: 'Barbell Bench Press',
    status: 'completed',
    sets: [
      { setNumber: 1, weight: 60, reps: 10, completed: true },
      { setNumber: 2, weight: 70, reps: 8, completed: true },
      { setNumber: 3, weight: 80, reps: 6, completed: true },
    ],
  });

  await WorkoutExercise.create({
    workoutId: todayWorkout._id,
    exerciseName: 'Incline Dumbbell Press',
    status: 'completed',
    sets: [
      { setNumber: 1, weight: 24, reps: 10, completed: true },
      { setNumber: 2, weight: 26, reps: 8, completed: true },
      { setNumber: 3, weight: 28, reps: 6, completed: true },
    ],
  });

  await WorkoutExercise.create({
    workoutId: todayWorkout._id,
    exerciseName: 'Triceps Rope Pushdown',
    status: 'in_progress',
    sets: [
      { setNumber: 1, weight: 20, reps: 12, completed: true },
      { setNumber: 2, weight: 25, reps: 10, completed: true },
      { setNumber: 3, weight: 25, reps: 10, completed: false },
    ],
  });

  // Yesterday's workout (completed)
  const yesterdayWorkout = await Workout.create({
    userId: user._id,
    date: daysAgo(1),
    workoutName: 'Back & Biceps Pull Day',
    muscleGroup: 'back',
    estimatedDurationMinutes: 55,
    actualDurationMinutes: 55,
    status: 'completed',
    notes: 'Solid pull day, hit PR on deadlift!',
  });

  await WorkoutExercise.create({
    workoutId: yesterdayWorkout._id,
    exerciseName: 'Barbell Deadlift',
    status: 'completed',
    sets: [
      { setNumber: 1, weight: 100, reps: 6, completed: true },
      { setNumber: 2, weight: 120, reps: 5, completed: true },
      { setNumber: 3, weight: 140, reps: 3, completed: true },
    ],
  });

  await WorkoutExercise.create({
    workoutId: yesterdayWorkout._id,
    exerciseName: 'Barbell Row',
    status: 'completed',
    sets: [
      { setNumber: 1, weight: 60, reps: 10, completed: true },
      { setNumber: 2, weight: 70, reps: 8, completed: true },
      { setNumber: 3, weight: 75, reps: 6, completed: true },
    ],
  });

  // 3 days ago: Legs
  const legsWorkout = await Workout.create({
    userId: user._id,
    date: daysAgo(3),
    workoutName: 'Leg Day Strength',
    muscleGroup: 'legs',
    estimatedDurationMinutes: 60,
    actualDurationMinutes: 65,
    status: 'completed',
  });

  await WorkoutExercise.create({
    workoutId: legsWorkout._id,
    exerciseName: 'Barbell Squat',
    status: 'completed',
    sets: [
      { setNumber: 1, weight: 80, reps: 10, completed: true },
      { setNumber: 2, weight: 100, reps: 8, completed: true },
      { setNumber: 3, weight: 110, reps: 6, completed: true },
    ],
  });

  // 5 days ago: Shoulders
  const shoulderWorkout = await Workout.create({
    userId: user._id,
    date: daysAgo(5),
    workoutName: 'Shoulders & Core',
    muscleGroup: 'shoulders',
    estimatedDurationMinutes: 50,
    actualDurationMinutes: 48,
    status: 'completed',
  });

  await WorkoutExercise.create({
    workoutId: shoulderWorkout._id,
    exerciseName: 'Overhead Press',
    status: 'completed',
    sets: [
      { setNumber: 1, weight: 40, reps: 10, completed: true },
      { setNumber: 2, weight: 45, reps: 8, completed: true },
      { setNumber: 3, weight: 50, reps: 5, completed: true },
    ],
  });

  console.log('[seed] Creating cardio sessions...');
  await CardioSession.create({
    userId: user._id,
    date: new Date(),
    activityType: 'running',
    distanceKm: 5.2,
    durationMinutes: 28,
    calories: 360,
    averageHeartRate: 148,
    status: 'completed',
  });

  await CardioSession.create({
    userId: user._id,
    date: daysAgo(2),
    activityType: 'cycling',
    distanceKm: 14.5,
    durationMinutes: 42,
    calories: 420,
    averageHeartRate: 135,
    status: 'completed',
  });

  await CardioSession.create({
    userId: user._id,
    date: daysAgo(4),
    activityType: 'running',
    distanceKm: 4.0,
    durationMinutes: 23,
    calories: 290,
    averageHeartRate: 152,
    status: 'completed',
  });

  await CardioSession.create({
    userId: user._id,
    date: daysAgo(6),
    activityType: 'walking',
    distanceKm: 3.2,
    durationMinutes: 35,
    calories: 180,
    averageHeartRate: 105,
    status: 'completed',
  });

  console.log('[seed] Creating goals...');
  await Goal.create({
    userId: user._id,
    goalType: 'run_distance',
    target: 25,
    currentProgress: 13.2,
    unit: 'km',
    startDate: daysAgo(7),
    status: 'active',
  });

  await Goal.create({
    userId: user._id,
    goalType: 'workouts_per_week',
    target: 5,
    currentProgress: 3,
    unit: 'sessions',
    startDate: daysAgo(7),
    status: 'active',
  });

  await Goal.create({
    userId: user._id,
    goalType: 'daily_steps',
    target: 10000,
    currentProgress: 8420,
    unit: 'steps',
    startDate: daysAgo(7),
    status: 'active',
  });

  await Goal.create({
    userId: user._id,
    goalType: 'daily_water',
    target: 8,
    currentProgress: 8,
    unit: 'glasses',
    startDate: daysAgo(7),
    status: 'active',
  });

  await Goal.create({
    userId: user._id,
    goalType: 'weight_target',
    target: 76,
    currentProgress: 74.5,
    unit: 'kg',
    startDate: daysAgo(7),
    status: 'active',
  });

  console.log('[seed] Creating initial AI conversation history...');
  await AIConversation.create({
    userId: user._id,
    message: 'Aaj ka plan kya hai?',
    response: 'Aaj tumhara chest workout planned hai (status: in_progress). Cardio: running 5.2 km (status: completed).',
    intent: 'GET_TODAY_PLAN',
  });

  console.log('[seed] Database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Account:');
  console.log('Email:    demo@athletix.ai');
  console.log('Password: password123');
  console.log('----------------------------------------------------');
  return user;
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed] Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seed;
