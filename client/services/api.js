// services/api.js - CORRECTED VERSION
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This is crucial for cookies
});

// SINGLE Request interceptor (remove the duplicate)
api.interceptors.request.use(
  (config) => {
    // Skip adding token for auth endpoints (like login/register)
    const isAuthEndpoint = config.url?.includes('/auth/');
    
    // Always try to use token from localStorage as backup for non-auth endpoints
    if (!isAuthEndpoint && typeof window !== 'undefined') {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const { token } = JSON.parse(authData);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }

    // Handle multipart/form-data
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// SINGLE Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;