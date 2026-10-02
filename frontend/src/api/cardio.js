import api from './client';

export const listCardio = (params) => api.get('/cardio', { params }).then((r) => r.data);
export const createCardio = (data) => api.post('/cardio', data).then((r) => r.data);
export const updateCardio = (id, data) => api.put(`/cardio/${id}`, data).then((r) => r.data);
export const deleteCardio = (id) => api.delete(`/cardio/${id}`).then((r) => r.data);
