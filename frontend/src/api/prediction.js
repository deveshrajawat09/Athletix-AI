import api from './client';

export const getTodayPrediction = () => api.get('/prediction/today').then((r) => r.data);
export const acceptPrediction = (options = {}) => api.post('/prediction/accept', options).then((r) => r.data);
