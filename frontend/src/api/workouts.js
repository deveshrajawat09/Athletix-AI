import api from './client';

export const listWorkouts = (params) => api.get('/workouts', { params }).then((r) => r.data);
export const getWorkout = (id) => api.get(`/workouts/${id}`).then((r) => r.data);
export const createWorkout = (data) => api.post('/workouts', data).then((r) => r.data);
export const updateWorkout = (id, data) => api.put(`/workouts/${id}`, data).then((r) => r.data);
export const deleteWorkout = (id) => api.delete(`/workouts/${id}`).then((r) => r.data);
export const addExercise = (workoutId, data) => api.post(`/workouts/${workoutId}/exercises`, data).then((r) => r.data);
export const addSet = (workoutId, exerciseId, data) => api.post(`/workouts/${workoutId}/exercises/${exerciseId}/sets`, data).then((r) => r.data);
export const deleteExercise = (workoutId, exerciseId) => api.delete(`/workouts/${workoutId}/exercises/${exerciseId}`).then((r) => r.data);
export const getPersonalRecords = () => api.get('/workouts/records/all').then((r) => r.data);
