import api from './client';

export const sendChatMessage = (message) => api.post('/ai/chat', { message }).then((r) => r.data);
export const sendVoiceTranscript = (transcript) => api.post('/ai/voice', { transcript }).then((r) => r.data);
export const getDailyBriefing = (type = 'morning') => api.get('/ai/daily-briefing', { params: { type } }).then((r) => r.data);
