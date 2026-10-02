const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const buildAIContext = require('../services/contextBuilder');
const { detectIntentAndRespond, getDailyBriefing } = require('../services/aiProxyService');
const AIConversation = require('../models/AIConversation');
const Workout = require('../models/Workout');
const WorkoutExercise = require('../models/WorkoutExercise');
const CardioSession = require('../models/CardioSession');

// Executes a write-intent ONLY after backend-side validation. The AI service
// can suggest what to save, but it never writes to MongoDB itself — this
// function is the single point where that happens, per user, with validation.
async function executeIntent(userId, intent, extractedData = {}) {
  switch (intent) {
    case 'SAVE_CARDIO': {
      const { activityType, distanceKm, durationMinutes, date } = extractedData;
      if (!activityType || (distanceKm == null && durationMinutes == null)) {
        return { executed: false, reason: 'missing_fields', needs: ['activityType', 'distanceKm or durationMinutes'] };
      }
      const session = await CardioSession.create({
        userId, activityType, distanceKm, durationMinutes,
        date: date ? new Date(date) : new Date(), status: 'completed',
      });
      return { executed: true, result: session };
    }
    case 'SAVE_SET': {
      const { workoutId, exerciseName, weight, reps, setNumber } = extractedData;
      if (!exerciseName || weight == null || reps == null) {
        return { executed: false, reason: 'missing_fields', needs: ['exerciseName', 'weight', 'reps'] };
      }
      let exercise;
      if (workoutId) {
        const userWorkout = await Workout.findOne({ _id: workoutId, userId });
        if (userWorkout) {
          exercise = await WorkoutExercise.findOne({ workoutId: userWorkout._id, exerciseName });
        }
      }
      if (!exercise) {
        // Fall back to today's workout or latest workout if no explicit workout was given
        const todayWorkout = await Workout.findOne({ userId }).sort({ date: -1 });
        if (!todayWorkout) return { executed: false, reason: 'no_active_workout' };
        exercise = await WorkoutExercise.findOne({ workoutId: todayWorkout._id, exerciseName });
        if (!exercise) {
          exercise = await WorkoutExercise.create({ workoutId: todayWorkout._id, exerciseName, sets: [] });
        }
      }
      const newSetNumber = setNumber || exercise.sets.length + 1;
      exercise.sets.push({ setNumber: newSetNumber, weight, reps, completed: true });
      await exercise.save();
      return { executed: true, result: exercise, addedSet: { setNumber: newSetNumber, weight, reps } };
    }
    default:
      return { executed: false, reason: 'read_only_or_unsupported' };
  }
}

function resolveAIResponse(originalResponse, intent, executionResult) {
  if (!intent || !intent.startsWith('SAVE_') || !executionResult) {
    return originalResponse;
  }
  if (executionResult.executed) {
    if (intent === 'SAVE_CARDIO' && executionResult.result) {
      const r = executionResult.result;
      const dist = r.distanceKm ? ` ${r.distanceKm} km` : '';
      const dur = r.durationMinutes ? ` (${r.durationMinutes} min)` : '';
      return `Cardio session save ho gayi: ${r.activityType}${dist}${dur}!`;
    }
    if (intent === 'SAVE_SET' && executionResult.result) {
      const set = executionResult.addedSet || executionResult.result.sets[executionResult.result.sets.length - 1];
      return `Set save ho gaya: ${executionResult.result.exerciseName} - ${set.weight}kg × ${set.reps} reps (Set #${set.setNumber})!`;
    }
  }
  if (executionResult.reason === 'missing_fields') {
    return `Details missing hain: ${executionResult.needs?.join(', ')}. Please provide these to save.`;
  }
  if (executionResult.reason === 'no_active_workout') {
    return 'Koi active workout nahi mila — pehle Workout create ya start karo.';
  }
  return originalResponse;
}

// POST /api/ai/chat
const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) throw new AppError('Message is required.', 400);

  const context = await buildAIContext(req.user._id);
  const aiResult = await detectIntentAndRespond({ message, context });

  let executionResult = null;
  if (aiResult.intent && aiResult.intent.startsWith('SAVE_')) {
    executionResult = await executeIntent(req.user._id, aiResult.intent, aiResult.extractedData);
  }

  const finalResponse = resolveAIResponse(aiResult.response, aiResult.intent, executionResult);

  await AIConversation.create({
    userId: req.user._id,
    message,
    response: finalResponse,
    intent: aiResult.intent || 'UNKNOWN',
  });

  res.json({ success: true, intent: aiResult.intent, response: finalResponse, execution: executionResult });
});

// POST /api/ai/voice — same pipeline; STT/TTS happen client-side or in the AI service
const voice = asyncHandler(async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) throw new AppError('Voice transcript is required.', 400);

  const context = await buildAIContext(req.user._id);
  const aiResult = await detectIntentAndRespond({ message: transcript, context });

  let executionResult = null;
  if (aiResult.intent && aiResult.intent.startsWith('SAVE_')) {
    executionResult = await executeIntent(req.user._id, aiResult.intent, aiResult.extractedData);
  }

  const finalResponse = resolveAIResponse(aiResult.response, aiResult.intent, executionResult);

  await AIConversation.create({
    userId: req.user._id,
    message: transcript,
    response: finalResponse,
    intent: aiResult.intent || 'UNKNOWN',
  });

  res.json({ success: true, intent: aiResult.intent, response: finalResponse, execution: executionResult });
});

// GET /api/ai/daily-briefing?type=morning|evening
const dailyBriefing = asyncHandler(async (req, res) => {
  const type = req.query.type === 'evening' ? 'evening' : 'morning';
  const context = await buildAIContext(req.user._id);
  const briefing = await getDailyBriefing({ context, type });
  res.json({ success: true, type, response: briefing.response });
});

module.exports = { chat, voice, dailyBriefing };
