// services/api.js - CORRECTED VERSION
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This is crucial for cookies
});

// services/api.js - ADD DEBUG LOGS
api.interceptors.request.use(
  (config) => {
    // console.log('🔄 API Request:', config.method?.toUpperCase(), config.url);
    
    // Check for token in localStorage
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const { token } = JSON.parse(authData);
        if (token) {
          // console.log('✅ Adding Authorization header with token:', token.substring(0, 20) + '...');
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log('❌ No token in authData');
        }
      } else {
        console.log('❌ No authData in localStorage');
      }
    }

    // console.log('Request headers:', {
    //   'Content-Type': config.headers['Content-Type'],
    //   'Authorization': config.headers['Authorization'] ? 'Present' : 'Missing'
    // });

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // console.log('✅ API Response:', response.status, response.config.url);
    // console.log('Response headers:', {
    //   'set-cookie': response.headers['set-cookie'] ? 'Present' : 'Missing',
    //   'content-type': response.headers['content-type']
    // });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      console.log('🔒 401 Unauthorized - clearing auth data');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth');
      }
    }
    return Promise.reject(error);
  }
);

export default api;