const Workout = require('../models/Workout');
const WorkoutExercise = require('../models/WorkoutExercise');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const agentService = require('../services/agentService');

// GET /api/workouts?from=&to=&status=
const getWorkouts = asyncHandler(async (req, res) => {
  const { from, to, status } = req.query;
  const query = { userId: req.user._id };
  if (status) query.status = status;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  const workouts = await Workout.find(query).sort({ date: -1 }).lean();
  const workoutIds = workouts.map((w) => w._id);
  const exercises = await WorkoutExercise.find({ workoutId: { $in: workoutIds } }).lean();
  const exercisesByWorkout = {};
  exercises.forEach((ex) => {
    const wid = ex.workoutId.toString();
    if (!exercisesByWorkout[wid]) exercisesByWorkout[wid] = [];
    exercisesByWorkout[wid].push(ex);
  });
  const enrichedWorkouts = workouts.map((w) => ({
    ...w,
    exercises: exercisesByWorkout[w._id.toString()] || [],
  }));
  res.json({ success: true, workouts: enrichedWorkouts });
});

// POST /api/workouts  { date, workoutName, muscleGroup, estimatedDurationMinutes, exercises: [{exerciseName, sets}] }
const createWorkout = asyncHandler(async (req, res) => {
  const { exercises = [], ...workoutData } = req.body;

  const workout = await Workout.create({ ...workoutData, userId: req.user._id });

  let createdExercises = [];
  if (exercises.length) {
    createdExercises = await WorkoutExercise.insertMany(
      exercises.map((ex) => ({ ...ex, workoutId: workout._id }))
    );
  }

  res.status(201).json({ success: true, workout, exercises: createdExercises });
});

// GET /api/workouts/:id
const getWorkoutById = asyncHandler(async (req, res) => {
  const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });
  if (!workout) throw new AppError('Workout not found.', 404);

  const exercises = await WorkoutExercise.find({ workoutId: workout._id });
  res.json({ success: true, workout, exercises });
});

// PUT /api/workouts/:id
const updateWorkout = asyncHandler(async (req, res) => {
  const workout = await Workout.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!workout) throw new AppError('Workout not found.', 404);

  if (workout.status === 'completed') {
    agentService.onWorkoutCompleted(req.user._id, workout._id).catch(() => {});
  }

  res.json({ success: true, workout });
});

// DELETE /api/workouts/:id
const deleteWorkout = asyncHandler(async (req, res) => {
  const workout = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!workout) throw new AppError('Workout not found.', 404);
  await WorkoutExercise.deleteMany({ workoutId: workout._id });
  res.json({ success: true, message: 'Workout deleted.' });
});

// POST /api/workouts/:id/exercises
const addExercise = asyncHandler(async (req, res) => {
  const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });
  if (!workout) throw new AppError('Workout not found.', 404);
  const { exerciseName, sets = [], notes } = req.body;
  if (!exerciseName) throw new AppError('Exercise name is required.', 400);

  const exercise = await WorkoutExercise.create({
    workoutId: workout._id,
    exerciseName,
    sets,
    notes,
  });
  res.status(201).json({ success: true, exercise });
});

// POST /api/workouts/:id/exercises/:exerciseId/sets
const addSet = asyncHandler(async (req, res) => {
  const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });
  if (!workout) throw new AppError('Workout not found.', 404);

  const exercise = await WorkoutExercise.findOne({ _id: req.params.exerciseId, workoutId: workout._id });
  if (!exercise) throw new AppError('Exercise not found.', 404);

  const { weight, reps, completed = true, setNumber } = req.body;
  const num = setNumber || exercise.sets.length + 1;
  exercise.sets.push({ setNumber: num, weight: Number(weight) || 0, reps: Number(reps) || 0, completed });
  await exercise.save();
  res.status(201).json({ success: true, exercise });
});

// DELETE /api/workouts/:id/exercises/:exerciseId
const deleteExercise = asyncHandler(async (req, res) => {
  const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });
  if (!workout) throw new AppError('Workout not found.', 404);

  const exercise = await WorkoutExercise.findOneAndDelete({ _id: req.params.exerciseId, workoutId: workout._id });
  if (!exercise) throw new AppError('Exercise not found.', 404);
  res.json({ success: true, message: 'Exercise deleted.' });
});

// Personal records: best weight, best reps, best single-session volume, per exercise.
// GET /api/workouts/records/all
const getPersonalRecords = asyncHandler(async (req, res) => {
  const workouts = await Workout.find({ userId: req.user._id, status: 'completed' }).select('_id');
  const workoutIds = workouts.map((w) => w._id);
  const exercises = await WorkoutExercise.find({ workoutId: { $in: workoutIds } });

  const records = {};
  for (const ex of exercises) {
    const key = ex.exerciseName.toLowerCase();
    if (!records[key]) {
      records[key] = { exerciseName: ex.exerciseName, maxWeight: 0, maxReps: 0, maxSessionVolume: 0 };
    }
    let sessionVolume = 0;
    for (const s of ex.sets) {
      if (s.weight) records[key].maxWeight = Math.max(records[key].maxWeight, s.weight);
      if (s.reps) records[key].maxReps = Math.max(records[key].maxReps, s.reps);
      sessionVolume += (s.weight || 0) * (s.reps || 0);
    }
    records[key].maxSessionVolume = Math.max(records[key].maxSessionVolume, sessionVolume);
  }

  res.json({ success: true, records: Object.values(records) });
});

module.exports = {
  getWorkouts,
  createWorkout,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  addExercise,
  addSet,
  deleteExercise,
  getPersonalRecords,
};
