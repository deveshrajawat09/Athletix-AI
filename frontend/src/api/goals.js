import api from './client';

export const listGoals = () => api.get('/goals').then((r) => r.data);
export const createGoal = (data) => api.post('/goals', data).then((r) => r.data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data).then((r) => r.data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`).then((r) => r.data);
