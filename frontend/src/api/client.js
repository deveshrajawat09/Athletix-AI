import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('athletix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, clear the token so the app falls back to the login screen.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('athletix_token');
      localStorage.removeItem('athletix_user');
    }
    return Promise.reject(error);
  }
);

export default api;
