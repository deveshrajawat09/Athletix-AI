import api from './client';

export const getHealthProfile = () => api.get('/health/profile').then((r) => r.data);
export const saveHealthProfile = (data) => api.put('/health/profile', data).then((r) => r.data);
export const saveMetrics = (data) => api.post('/health/metrics', data).then((r) => r.data);
export const getMetrics = (params) => api.get('/health/metrics', { params }).then((r) => r.data);
