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

/**
 * Get the base endpoint at runtime
 * This function allows runtime detection of the base endpoint
 * which is useful for OAuth flows that need to determine the API URL dynamically
 */
export function getBaseEndpoint(): string {
  return BASE_ENDPOINT;
}

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
      } else if (!token && config.url && !config.url.includes('/signin') && !config.url.includes('/signup')) {
        // Log when token is missing for authenticated routes (helpful for debugging)
        console.warn('⚠️ No auth token found for request:', config.url);
      }
    } catch (error) {
      console.error('Failed to get token from localStorage:', error);
    }
    
    // Debug logging for local development
    if (APP_ENVIRONMENT === 'local' || import.meta.env.DEV) {
      // Stringify data to see exact format being sent
      const dataString = config.data ? JSON.stringify(config.data) : 'no data';
      console.log('🔵 Axios Request:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        hasToken: !!localStorage.getItem('authToken'),
        contentType: config.headers?.['Content-Type'],
        dataString: dataString,
        dataObject: config.data
      });
    }
    
    // Ensure Content-Type is set correctly for file uploads
    // If the data contains base64 image/video, keep application/json
    // The backend should accept base64 strings in JSON format
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      // Check if this is a file upload request (contains image or video as base64)
      const hasFileData = (config.data as Record<string, unknown>).image || (config.data as Record<string, unknown>).video;
      if (hasFileData && config.headers) {
        // Ensure Content-Type is application/json for base64 uploads
        config.headers['Content-Type'] = 'application/json';
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors and CORS errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Log error responses for debugging (especially 400 errors)
    if (error.response && (APP_ENVIRONMENT === 'local' || import.meta.env.DEV)) {
      console.error('🔴 Backend Error Response:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    // Handle CORS errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      // Check if this is a CORS error (no response object means CORS blocked the request)
      if (!error.response) {
        const isFileUpload = originalRequest?.url?.includes('/post/image') || 
                           originalRequest?.url?.includes('/post/video') ||
                           originalRequest?.url?.includes('/post/image/post') ||
                           originalRequest?.url?.includes('/post/video/post');
        
        if (isFileUpload) {
          console.error('CORS error during file upload. Please ensure the backend has CORS configured to allow requests from:', window.location.origin);
          // Provide a more helpful error message
          const corsError = new Error('CORS error: Unable to upload file. The server needs to allow requests from this origin.') as AxiosError;
          corsError.config = error.config;
          corsError.request = error.request;
          return Promise.reject(corsError);
        }
      }
    }
    
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

