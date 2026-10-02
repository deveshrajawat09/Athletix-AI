const { google } = require('googleapis');
const User = require('../models/User');
const Workout = require('../models/Workout');
const WorkoutExercise = require('../models/WorkoutExercise');
const CardioSession = require('../models/CardioSession');
const { getOAuth2Client } = require('./googleFitService');

/**
 * Generate a web link for direct 1-click addition to Google Calendar in browser
 */
function createGoogleCalendarWebUrl({ title, description, location, startTime, endTime }) {
  const startIso = new Date(startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endIso = new Date(endTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    location: location || 'Gym / Fitness Center',
    dates: `${startIso}/${endIso}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Schedule or sync a workout session into Google Calendar
 */
async function syncWorkoutToGoogleCalendar(userId, workoutId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const workout = await Workout.findOne({ _id: workoutId, userId });
  if (!workout) throw new Error('Workout not found');

  const exercises = await WorkoutExercise.find({ workoutId: workout._id });

  // Format event details
  const title = `🏋️ Athletix AI: ${workout.workoutName || 'Workout Session'}`;
  const startTime = new Date(workout.date || new Date());
  const durationMin = workout.actualDurationMinutes || workout.estimatedDurationMinutes || 60;
  const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

  let exerciseDetails = '';
  if (exercises && exercises.length > 0) {
    exerciseDetails = exercises
      .map((ex, idx) => {
        const setsText = (ex.sets || [])
          .map((s) => `  • Set ${s.setNumber}: ${s.weight}kg × ${s.reps} reps ${s.completed ? '✅' : '⏳'}`)
          .join('\n');
        return `${idx + 1}. ${ex.exerciseName} (${ex.status || 'planned'})\n${setsText}`;
      })
      .join('\n\n');
  } else {
    exerciseDetails = `Focus: ${workout.muscleGroup || 'General Training'}`;
  }

  const description = `Athletix AI Workout Summary\n\nMuscle Group: ${workout.muscleGroup || 'Full Body'}\nStatus: ${workout.status}\nDuration: ${durationMin} mins\n\nExercises:\n${exerciseDetails}\n\nNotes: ${workout.notes || 'None'}\n\nLogged with Athletix AI Agent`;

  let eventId = `workout_${workout._id}`;
  let calendarLink = createGoogleCalendarWebUrl({
    title,
    description,
    location: 'Athletix Gym',
    startTime,
    endTime,
  });
  let syncedViaApi = false;

  const hasRealTokens = user.googleAuth?.accessToken && user.googleAuth?.connected;

  if (hasRealTokens && process.env.GOOGLE_CLIENT_ID) {
    try {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({
        access_token: user.googleAuth.accessToken,
        refresh_token: user.googleAuth.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: title,
          description,
          start: { dateTime: startTime.toISOString() },
          end: { dateTime: endTime.toISOString() },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'email', minutes: 60 },
            ],
          },
        },
      });

      if (response.data?.id) {
        eventId = response.data.id;
        calendarLink = response.data.htmlLink || calendarLink;
        syncedViaApi = true;
      }
    } catch (err) {
      console.warn(`[GoogleCalendar] Direct API insert failed (${err.message}). Web link generated.`);
    }
  }

  return {
    success: true,
    eventId,
    title,
    startTime,
    endTime,
    calendarLink,
    syncedViaApi,
    message: syncedViaApi ? 'Added directly to your Google Calendar!' : 'Calendar event link generated successfully.',
  };
}

module.exports = {
  syncWorkoutToGoogleCalendar,
  createGoogleCalendarWebUrl,
};
