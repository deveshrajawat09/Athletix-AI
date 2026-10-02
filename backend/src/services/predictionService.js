const Workout = require('../models/Workout');
const WorkoutExercise = require('../models/WorkoutExercise');
const CardioSession = require('../models/CardioSession');
const DailyHealthMetric = require('../models/DailyHealthMetric');
const HealthProfile = require('../models/HealthProfile');

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

const EXERCISE_TEMPLATES = {
  chest: [
    { name: 'Standard Pushups', defaultReps: 15, defaultWeight: 0, defaultSets: 3, isBodyweight: true },
    { name: 'Barbell Bench Press', defaultReps: 8, defaultWeight: 60, defaultSets: 3 },
    { name: 'Incline Dumbbell Press', defaultReps: 10, defaultWeight: 22, defaultSets: 3 },
    { name: 'Cable Chest Flyes', defaultReps: 12, defaultWeight: 15, defaultSets: 3 },
  ],
  back: [
    { name: 'Pull-ups', defaultReps: 8, defaultWeight: 0, defaultSets: 3, isBodyweight: true },
    { name: 'Barbell Deadlift', defaultReps: 6, defaultWeight: 100, defaultSets: 3 },
    { name: 'Bent-Over Barbell Row', defaultReps: 10, defaultWeight: 55, defaultSets: 3 },
    { name: 'Lat Pulldown', defaultReps: 10, defaultWeight: 50, defaultSets: 3 },
  ],
  legs: [
    { name: 'Barbell Back Squat', defaultReps: 8, defaultWeight: 80, defaultSets: 4 },
    { name: 'Romanian Deadlift', defaultReps: 10, defaultWeight: 70, defaultSets: 3 },
    { name: 'Leg Press', defaultReps: 12, defaultWeight: 120, defaultSets: 3 },
    { name: 'Standing Calf Raises', defaultReps: 15, defaultWeight: 40, defaultSets: 3 },
  ],
  shoulders: [
    { name: 'Overhead Barbell Press', defaultReps: 8, defaultWeight: 40, defaultSets: 3 },
    { name: 'Dumbbell Lateral Raises', defaultReps: 12, defaultWeight: 10, defaultSets: 4 },
    { name: 'Face Pulls', defaultReps: 15, defaultWeight: 20, defaultSets: 3 },
    { name: 'Pike Pushups', defaultReps: 10, defaultWeight: 0, defaultSets: 3, isBodyweight: true },
  ],
  arms: [
    { name: 'Barbell Bicep Curls', defaultReps: 10, defaultWeight: 30, defaultSets: 3 },
    { name: 'Triceps Rope Pushdown', defaultReps: 12, defaultWeight: 25, defaultSets: 3 },
    { name: 'Dumbbell Hammer Curls', defaultReps: 12, defaultWeight: 14, defaultSets: 3 },
    { name: 'Diamond Pushups', defaultReps: 12, defaultWeight: 0, defaultSets: 3, isBodyweight: true },
  ],
  core: [
    { name: 'Hanging Knee Raises', defaultReps: 15, defaultWeight: 0, defaultSets: 3, isBodyweight: true },
    { name: 'Plank Hold', defaultReps: 60, defaultWeight: 0, defaultSets: 3, isBodyweight: true, unit: 'seconds' },
    { name: 'Cable Woodchoppers', defaultReps: 12, defaultWeight: 20, defaultSets: 3 },
    { name: 'Pushup to Side Plank', defaultReps: 10, defaultWeight: 0, defaultSets: 3, isBodyweight: true },
  ],
};

function daysBetween(d1, d2) {
  const diffTime = Math.abs(new Date(d2) - new Date(d1));
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Predict next movement and optimal workout based on real historical data
 */
async function predictNextMovement(userId) {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [workouts, healthProfile, recentMetrics] = await Promise.all([
    Workout.find({ userId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }).lean(),
    HealthProfile.findOne({ userId }),
    DailyHealthMetric.find({ userId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }).limit(7).lean(),
  ]);

  const workoutIds = workouts.map((w) => w._id);
  const exercises = await WorkoutExercise.find({ workoutId: { $in: workoutIds } }).lean();

  // 1. Calculate historical volume & best performance per exercise
  const exerciseStats = {};
  exercises.forEach((ex) => {
    const key = ex.exerciseName.toLowerCase();
    if (!exerciseStats[key]) {
      exerciseStats[key] = {
        name: ex.exerciseName,
        maxWeight: 0,
        maxReps: 0,
        totalSetsCompleted: 0,
        lastPerformed: null,
      };
    }
    (ex.sets || []).forEach((set) => {
      if (set.completed) {
        exerciseStats[key].totalSetsCompleted += 1;
        if (set.weight > exerciseStats[key].maxWeight) exerciseStats[key].maxWeight = set.weight;
        if (set.reps > exerciseStats[key].maxReps) exerciseStats[key].maxReps = set.reps;
      }
    });
  });

  // 2. Compute Muscle Readiness & Recovery Scores (0 - 100%)
  const lastTrainedMuscle = {};
  workouts.forEach((w) => {
    if (w.muscleGroup && !lastTrainedMuscle[w.muscleGroup]) {
      lastTrainedMuscle[w.muscleGroup] = w.date;
    }
  });

  // Average recent sleep
  const avgSleep = recentMetrics.length
    ? recentMetrics.reduce((s, m) => s + (m.sleepDurationHours || 7), 0) / recentMetrics.length
    : 7.5;
  const sleepRecoveryBonus = avgSleep >= 7.5 ? 15 : avgSleep >= 6.5 ? 5 : -10;

  const muscleReadiness = {};
  MUSCLE_GROUPS.forEach((mg) => {
    const lastDate = lastTrainedMuscle[mg];
    let daysSince = lastDate ? daysBetween(lastDate, today) : 7;
    // Readiness: 0 days = 30%, 1 day = 60%, 2 days = 85%, 3+ days = 100%
    let score = Math.min(100, Math.round(30 + daysSince * 25 + sleepRecoveryBonus));
    muscleReadiness[mg] = {
      score: Math.max(20, Math.min(100, score)),
      daysSinceTrained: lastDate ? daysSince : null,
      status: score >= 85 ? 'Fully Recovered' : score >= 60 ? 'Recovering' : 'Fatigued / Rest Needed',
    };
  });

  // 3. Select Target Muscle Group (The most recovered group with highest priority)
  let targetMuscle = 'chest';
  let bestScore = -1;
  MUSCLE_GROUPS.forEach((mg) => {
    if (muscleReadiness[mg].score > bestScore) {
      bestScore = muscleReadiness[mg].score;
      targetMuscle = mg;
    }
  });

  // 4. Generate Recommended Movements with Progressive Overload
  const baseTemplates = EXERCISE_TEMPLATES[targetMuscle] || EXERCISE_TEMPLATES.chest;
  const predictedMovements = baseTemplates.map((template) => {
    const key = template.name.toLowerCase();
    const history = exerciseStats[key];

    let targetWeight = template.defaultWeight;
    let targetReps = template.defaultReps;
    let overloadReason = 'Foundation baseline progression';

    if (history && history.maxWeight > 0) {
      // Progressive overload: small 2.5kg increase or +2 reps
      if (history.maxReps >= 10) {
        targetWeight = Number((history.maxWeight + 2.5).toFixed(1));
        targetReps = 8;
        overloadReason = `Overload: +2.5kg up from previous ${history.maxWeight}kg`;
      } else {
        targetWeight = history.maxWeight;
        targetReps = history.maxReps + 2;
        overloadReason = `Rep Progression: +2 reps targeting ${targetReps} reps at ${targetWeight}kg`;
      }
    } else if (history && history.maxReps > 0 && template.isBodyweight) {
      // Bodyweight pushups / pullups progression
      targetReps = Math.min(50, history.maxReps + 3);
      overloadReason = `Volume Progression: +3 reps over previous personal record (${history.maxReps} reps)`;
    }

    return {
      exerciseName: template.name,
      setsCount: template.defaultSets || 3,
      targetWeight,
      targetReps,
      isBodyweight: !!template.isBodyweight,
      overloadReason,
    };
  });

  // 5. Generate AI Rationale explanation
  const daysInfo = muscleReadiness[targetMuscle].daysSinceTrained !== null
    ? `${muscleReadiness[targetMuscle].daysSinceTrained} din pehle train kiya tha`
    : 'recently train nahi hua';

  const rationale = `Aapka ${targetMuscle.toUpperCase()} muscle group ${muscleReadiness[targetMuscle].score}% recover ho chuka hai (${daysInfo}). Average sleep (${avgSleep.toFixed(1)} hrs) ke sath, aaj ke liye ${targetMuscle.toUpperCase()} movements aur progressive overload best rahenge.`;

  return {
    success: true,
    predictedDate: today.toISOString().slice(0, 10),
    targetMuscleGroup: targetMuscle,
    workoutName: `${targetMuscle.charAt(0).toUpperCase() + targetMuscle.slice(1)} Hypertrophy & Strength`,
    estimatedDurationMinutes: 50,
    readinessScore: muscleReadiness[targetMuscle].score,
    muscleReadiness,
    predictedMovements,
    aiRationale: rationale,
    userGoal: healthProfile?.fitnessGoal || 'general_fitness',
  };
}

/**
 * Accept the AI predicted plan and instantiate it as today's active workout
 */
async function acceptPredictedPlan(userId, options = {}) {
  const prediction = await predictNextMovement(userId);
  const today = new Date();

  // Create Workout
  const workout = await Workout.create({
    userId,
    date: today,
    workoutName: options.customName || prediction.workoutName,
    muscleGroup: prediction.targetMuscleGroup,
    estimatedDurationMinutes: prediction.estimatedDurationMinutes,
    status: 'in_progress',
    notes: `AI Predicted Plan: ${prediction.aiRationale}`,
  });

  // Create WorkoutExercises with target sets
  const createdExercises = [];
  for (const mov of prediction.predictedMovements) {
    const sets = [];
    for (let s = 1; s <= mov.setsCount; s++) {
      sets.push({
        setNumber: s,
        weight: mov.targetWeight,
        reps: mov.targetReps,
        completed: false,
      });
    }

    const ex = await WorkoutExercise.create({
      workoutId: workout._id,
      exerciseName: mov.exerciseName,
      sets,
      notes: mov.overloadReason,
    });
    createdExercises.push(ex);
  }

  return {
    success: true,
    message: 'AI Predicted Workout scheduled and started successfully!',
    workout,
    exercises: createdExercises,
  };
}

module.exports = {
  predictNextMovement,
  acceptPredictedPlan,
};
