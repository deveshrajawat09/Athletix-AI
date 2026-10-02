import api from './client';

export const getToday = () => api.get('/dashboard/today').then((r) => r.data);
export const getSummary = (date) => api.get('/dashboard/summary', { params: { date } }).then((r) => r.data);
export const getProgress = (range = 'week') => api.get('/dashboard/progress', { params: { range } }).then((r) => r.data);
export const getDailyProgress = () => api.get('/dashboard/progress/daily').then((r) => r.data);
