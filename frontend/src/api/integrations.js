import api from './client';

export const getIntegrationStatus = () => api.get('/integrations/status').then((r) => r.data);
export const updatePreferences = (prefs) => api.put('/integrations/preferences', prefs).then((r) => r.data);
export const connectGoogle = (payload = { simulate: true }) => api.post('/integrations/google/connect', payload).then((r) => r.data);
export const disconnectGoogle = () => api.post('/integrations/google/disconnect').then((r) => r.data);
export const syncGoogleFit = (stepDelta) => api.post('/integrations/google-fit/sync', { stepDelta }).then((r) => r.data);
export const syncCalendarWorkout = (workoutId) => api.post('/integrations/google-calendar/sync-workout', { workoutId }).then((r) => r.data);
export const sendSummaryEmail = (workoutId) => api.post('/integrations/email/send-summary', { workoutId }).then((r) => r.data);
export const triggerDailyBriefingEmail = () => api.post('/integrations/email/send-daily-briefing').then((r) => r.data);
