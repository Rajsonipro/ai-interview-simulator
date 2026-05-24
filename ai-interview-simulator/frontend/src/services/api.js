import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const session_token = localStorage.getItem('session_token');
  if (session_token) config.headers['X-Session-Token'] = session_token;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');
    }
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  verifyOtp: (data) => api.post('/api/auth/verify-otp', data),
  resendOtp: (data) => api.post('/api/auth/resend-otp', data),
  forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
  verifyForgotOtp: (data) => api.post('/api/auth/verify-forgot-otp', data),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
};

// ─────────────────────────────────────────────
// Interview API
// ─────────────────────────────────────────────

export const interviewAPI = {
  createSession: (data) => api.post('/api/interview/session', data),
  evaluate: (data) => api.post('/api/interview/evaluate', data),
  getHistory: () => api.get('/api/interview/history'),
  uploadResume: (formData) => api.post('/api/interview/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// ─────────────────────────────────────────────
// Report API
// ─────────────────────────────────────────────

export const reportAPI = {
  getSessionReport: (sessionId) => api.get(`/api/report/session/${sessionId}`),
  getUserStats: () => api.get('/api/report/user/stats'),
};

export default api;
