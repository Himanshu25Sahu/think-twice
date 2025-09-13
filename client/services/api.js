// services/api.js - FIXED
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);
// services/api.js - FIXED INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('API Error:', error.response?.status, error.config?.url);
    
    // Handle 401 errors with token refresh - BUT NOT FOR LOGIN/REFRESH ENDPOINTS
    if (error.response?.status === 401 && 
        !originalRequest._retry &&
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest.url.includes('/auth/refresh') &&
        !originalRequest.url.includes('/auth/logout')) {
      
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`, 
          {},
          { 
            withCredentials: true,
            // Don't retry refresh requests indefinitely
            _noRetry: true 
          }
        );
        
        if (refreshResponse.status === 200) {
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Don't infinite loop - clear auth and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth');
          window.location.href = '/login';
        }
      }
    }
    
    // For logout or other specific endpoints, don't redirect
    if (error.response?.status === 401 && 
        originalRequest.url.includes('/auth/logout')) {
      // Just clear local storage without redirecting
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth');
      }
    }
    
    return Promise.reject(error);
  }
);

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear client-side state
    localStorage.removeItem('auth');
    window.location.href = '/login';
  }
};

export default api;