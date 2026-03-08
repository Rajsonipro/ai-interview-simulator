import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  verifyOtp: (data) => api.post('/api/auth/verify-otp', data),
};

export const interviewAPI = {
  createSession: (data) => api.post('/api/interview/session', data),
  evaluate: (data) => api.post('/api/interview/evaluate', data),
  getHistory: (userId) => {
    if (!userId) return Promise.resolve({ data: { history: [] } });
    return api.get(`/api/interview/history/${userId}`);
  },
  uploadResume: (formData) => api.post('/api/interview/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const reportAPI = {
  getSessionReport: (sessionId) => api.get(`/api/report/session/${sessionId}`),
  getUserStats: (userId) => api.get(`/api/report/user/${userId}/stats`),
};

export default api;
