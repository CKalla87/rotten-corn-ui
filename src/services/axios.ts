import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Support both VITE_APP_ENVIRONMENT and REACT_APP_ENVIRONMENT for compatibility
const APP_ENVIRONMENT = import.meta.env.VITE_APP_ENVIRONMENT || import.meta.env.REACT_APP_ENVIRONMENT || import.meta.env.MODE || 'local';

// Determine BASE_ENDPOINT based on environment
// In local development, use empty string to leverage Vite's proxy (avoids CORS)
let BASE_ENDPOINT = '';

if (APP_ENVIRONMENT === 'local' || import.meta.env.DEV) {
  // Use relative URL to leverage Vite's proxy configured in vite.config.ts
  // This avoids CORS issues since the proxy makes requests from the same origin
  BASE_ENDPOINT = '';
} else if (APP_ENVIRONMENT === 'development') {
  BASE_ENDPOINT = 'https://api.dev.chatappserver.space';
} else if (APP_ENVIRONMENT === 'staging') {
  BASE_ENDPOINT = 'https://api.staging.chatappserver.space';
} else {
  BASE_ENDPOINT = 'https://api.chatappserver.space';
}

// Override with VITE_BASE_ENDPOINT if explicitly set (but not in local dev to use proxy)
if (import.meta.env.VITE_BASE_ENDPOINT && APP_ENVIRONMENT !== 'local' && !import.meta.env.DEV) {
  BASE_ENDPOINT = import.meta.env.VITE_BASE_ENDPOINT;
}

export { BASE_ENDPOINT };

// If BASE_ENDPOINT is empty (local dev), use relative URL to leverage Vite proxy
// Otherwise, construct the full URL
const BASE_URL = BASE_ENDPOINT ? `${BASE_ENDPOINT}/api/v1` : '/api/v1';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true
});

// Request interceptor to add token to headers
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    try {
      const token = localStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get token from localStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If we get a 401 and haven't already retried, clear token and redirect
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear token from localStorage
      try {
        localStorage.removeItem('authToken');
      } catch (err) {
        console.error('Failed to remove token from localStorage:', err);
      }
      
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/' && !window.location.pathname.includes('/auth')) {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

