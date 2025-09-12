import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const isAuthEndpoint = config.url?.includes('/auth/');
    const isMultipart = config.data instanceof FormData;
    
    if (!isAuthEndpoint) {
      // Get token from localStorage (backup for cookie issues)
      const authData = localStorage.getItem('auth');
      if (authData) {
        const { token } = JSON.parse(authData);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    
    if (isMultipart) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh/errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;