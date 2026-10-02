const axios = require('axios');

// Talks to the Python FastAPI AI service. The AI service is stateless and never
// touches MongoDB directly — it only receives the context we build and hand it.
const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 15000,
});

// Fallback classifier and responder if Python AI service is unreachable
function localFallbackClassifier(message, context) {
  const text = (message || '').toLowerCase().trim();

  // SAVE_SET: e.g. "bench press 80kg x 6 reps"
  const setMatch = text.match(/(\d+(?:\.\d+)?)\s*kg\s*[x×]\s*(\d+)\s*reps?/i);
  if (setMatch || text.includes('save set') || text.includes('set save')) {
    const extractedData = {};
    if (setMatch) {
      extractedData.weight = parseFloat(setMatch[1]);
      extractedData.reps = parseInt(setMatch[2], 10);
    }
    const knownExercises = ['bench press', 'squat', 'deadlift', 'incline dumbbell press', 'cable fly', 'push-up', 'pull-up', 'overhead press', 'barbell row'];
    for (const ex of knownExercises) {
      if (text.includes(ex)) {
        extractedData.exerciseName = ex.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }
    return {
      intent: 'SAVE_SET',
      extractedData,
      response: 'Set saving...',
    };
  }

  // SAVE_CARDIO: e.g. "5km running", "ran 5 km"
  const distMatch = text.match(/(\d+(?:\.\d+)?)\s*km/i);
  const isCardio = distMatch || /running|walking|cycling|jogging/.test(text);
  if (isCardio && (text.includes('save') || text.includes('hui') || text.includes('ki') || distMatch)) {
    const extractedData = {};
    if (distMatch) extractedData.distanceKm = parseFloat(distMatch[1]);
    for (const act of ['running', 'walking', 'cycling', 'jogging']) {
      if (text.includes(act)) {
        extractedData.activityType = act;
        break;
      }
    }
    const durMatch = text.match(/(\d+)\s*(?:min|minute)/i);
    if (durMatch) extractedData.durationMinutes = parseInt(durMatch[1], 10);
    return {
      intent: 'SAVE_CARDIO',
      extractedData,
      response: 'Cardio saving...',
    };
  }

  // GET_TODAY_PLAN
  if (/aaj\s*kya|today.*plan|what.*today|aaj\s*ka\s*plan|plan.*today/i.test(text)) {
    const w = context?.todayPlan?.workout;
    const c = context?.todayPlan?.cardio;
    const parts = [];
    if (w) parts.push(`Aaj tumhara ${w.muscleGroup || w.name} workout planned hai (status: ${w.status}).`);
    if (c) parts.push(`Cardio: ${c.activityType}${c.distanceKm ? ` ${c.distanceKm} km` : ''} (status: ${c.status}).`);
    return {
      intent: 'GET_TODAY_PLAN',
      extractedData: {},
      response: parts.length ? parts.join(' ') : 'Aaj ke liye koi workout ya cardio plan record nahi mila.',
    };
  }

  // GET_PAST_ACTIVITY
  if (/kal\s*maine|kal\s*kya|yesterday|what did i do/i.test(text)) {
    const yw = context?.yesterday?.workout;
    const yc = context?.yesterday?.cardio;
    const parts = [];
    if (yw) parts.push(`Kal tumne ${yw.name} ${yw.status === 'completed' ? 'complete kiya tha' : `(${yw.status})`}.`);
    if (yc) parts.push(`${yc.activityType}${yc.distanceKm ? ` ${yc.distanceKm} km` : ''} bhi ${yc.status === 'completed' ? 'complete ki' : `(${yc.status})`}.`);
    return {
      intent: 'GET_PAST_ACTIVITY',
      extractedData: {},
      response: parts.length ? parts.join(' ') : 'Kal ke liye koi activity record nahi mili.',
    };
  }

  // GET_LAST_WORKOUT
  if (/last.*workout|pichla\s*workout|previous workout/i.test(text)) {
    const history = context?.recentHistory || [];
    if (history.length) {
      const last = history[0];
      return {
        intent: 'GET_LAST_WORKOUT',
        extractedData: {},
        response: `Tumhara last workout tha: ${last.activity} (${last.date}), status: ${last.status}.`,
      };
    }
    return { intent: 'GET_LAST_WORKOUT', extractedData: {}, response: 'Koi previous workout record nahi mila.' };
  }

  // GET_PENDING_TASKS
  if (/pending|baaki\s*kya|remaining/i.test(text)) {
    const pending = context?.pendingTasks || [];
    return {
      intent: 'GET_PENDING_TASKS',
      extractedData: {},
      response: pending.length ? `Pending tasks: ${pending.join(', ')}.` : 'Koi pending task nahi hai — sab kuch complete hai!',
    };
  }

  // GET_PROGRESS
  if (/progress|kaisa\s*chal\s*raha/i.test(text)) {
    const completed = context?.completedTasks || [];
    const goals = context?.fitnessGoals || [];
    let msg = `Completed today: ${completed.length ? completed.join(', ') : 'kuch bhi nahi abhi tak'}.`;
    if (goals.length) msg += ` Active goals: ${goals.join('; ')}.`;
    return { intent: 'GET_PROGRESS', extractedData: {}, response: msg };
  }

  return {
    intent: 'UNKNOWN',
    extractedData: {},
    response: "Main tumhara Athletix AI coach hoon. Tum 'aaj kya plan hai?', 'kal kya kiya tha?', 'meri progress batao', ya 'Bench Press 80kg x 6 reps' pooch ya bol sakte ho.",
  };
}

async function detectIntentAndRespond({ message, context }) {
  try {
    const { data } = await aiClient.post('/chat', { message, context });
    return data; // { intent, response, extractedData }
  } catch (err) {
    console.warn(`[aiProxyService] AI service unavailable (${err.message}). Using local grounded fallback.`);
    return localFallbackClassifier(message, context);
  }
}

async function getDailyBriefing({ context, type }) {
  try {
    const { data } = await aiClient.post('/daily-briefing', { context, type });
    return data; // { response }
  } catch (err) {
    console.warn(`[aiProxyService] AI service briefing unavailable (${err.message}). Using fallback briefing.`);
    if (type === 'evening') {
      const completed = context.completedTasks?.length ? context.completedTasks.join(', ') : 'kuch bhi record nahi hua';
      const pending = context.pendingTasks?.length ? ` Abhi bhi pending: ${context.pendingTasks.join(', ')}.` : ' Sab kuch complete — great job!';
      return { response: `Aaj complete hua: ${completed}.${pending}` };
    }
    const w = context.todayPlan?.workout;
    const c = context.todayPlan?.cardio;
    const parts = ['Good morning!'];
    if (w) parts.push(`Aaj tumhara ${w.muscleGroup || w.name} workout scheduled hai.`);
    if (c) parts.push(`Cardio: ${c.activityType}${c.distanceKm ? ` ${c.distanceKm} km` : ''}.`);
    if (!w && !c) parts.push('Aaj ke liye koi plan record nahi mila — apna plan set karo.');
    return { response: parts.join(' ') };
  }
}

module.exports = { detectIntentAndRespond, getDailyBriefing };
