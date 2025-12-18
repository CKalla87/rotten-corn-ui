import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Support both VITE_APP_ENVIRONMENT and REACT_APP_ENVIRONMENT for compatibility
// Also check runtime environment variables injected via window.__ENV__
function getAppEnvironment(): string {
  // Check runtime injection first (from window.__ENV__)
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_APP_ENVIRONMENT) {
    return window.__ENV__.VITE_APP_ENVIRONMENT;
  }
  // Fall back to build-time environment variables
  return import.meta.env.VITE_APP_ENVIRONMENT || import.meta.env.REACT_APP_ENVIRONMENT || import.meta.env.MODE || 'local';
}

// Function to get BASE_URL dynamically (allows runtime environment detection)
function getBaseUrl(): string {
  // Re-check environment at runtime
  let currentEnv = getAppEnvironment();
  
  // Runtime hostname detection as fallback (for when env vars aren't set at build time)
  if (typeof window !== 'undefined' && currentEnv === 'local' && !import.meta.env.DEV) {
    const hostname = window.location.hostname;
    if (hostname.includes('dev.chatappserver.space') || hostname.includes('.dev.')) {
      currentEnv = 'development';
      console.log('🌐 Detected develop environment from hostname:', hostname);
    } else if (hostname.includes('staging.chatappserver.space') || hostname.includes('.staging.')) {
      currentEnv = 'staging';
      console.log('🌐 Detected staging environment from hostname:', hostname);
    } else if (hostname.includes('chatappserver.space') && !hostname.includes('dev.') && !hostname.includes('staging.')) {
      currentEnv = 'production';
      console.log('🌐 Detected production environment from hostname:', hostname);
    }
  }
  
  // Determine endpoint based on current environment
  let endpoint = '';
  if (currentEnv === 'local' || import.meta.env.DEV) {
    // Use relative URL to leverage Vite's proxy configured in vite.config.ts
    // This avoids CORS issues since the proxy makes requests from the same origin
    endpoint = '';
  } else if (currentEnv === 'development') {
    endpoint = 'https://api.dev.chatappserver.space';
  } else if (currentEnv === 'staging') {
    endpoint = 'https://api.staging.chatappserver.space';
  } else {
    endpoint = 'https://api.chatappserver.space';
  }
  
  // Override with runtime VITE_BASE_ENDPOINT if available (from window.__ENV__)
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_BASE_ENDPOINT && currentEnv !== 'local' && !import.meta.env.DEV) {
    endpoint = window.__ENV__.VITE_BASE_ENDPOINT;
    console.log('🌐 Using runtime VITE_BASE_ENDPOINT:', endpoint);
  }
  
  // Override with build-time VITE_BASE_ENDPOINT if explicitly set (but not in local dev to use proxy)
  if (import.meta.env.VITE_BASE_ENDPOINT && currentEnv !== 'local' && !import.meta.env.DEV) {
    endpoint = import.meta.env.VITE_BASE_ENDPOINT;
  }
  
  return endpoint ? `${endpoint}/api/v1` : '/api/v1';
}

/**
 * Get the base endpoint at runtime (without /api/v1)
 * This function allows runtime detection of the base endpoint
 * which is useful for OAuth flows that need to determine the API URL dynamically
 */
export function getBaseEndpoint(): string {
  const baseUrl = getBaseUrl();
  // Extract base endpoint from base URL (remove /api/v1)
  if (baseUrl === '/api/v1') {
    return '';
  }
  return baseUrl.replace('/api/v1', '');
}

// Export BASE_ENDPOINT as a getter for backward compatibility
export const BASE_ENDPOINT = getBaseEndpoint();

// Function to get BASE_URL dynamically (allows runtime environment detection)
function getBaseUrl(): string {
  // Re-check environment at runtime
  let currentEnv = getAppEnvironment();
  
  // Runtime hostname detection as fallback
  if (typeof window !== 'undefined' && currentEnv === 'local' && !import.meta.env.DEV) {
    const hostname = window.location.hostname;
    if (hostname.includes('dev.chatappserver.space') || hostname.includes('.dev.')) {
      currentEnv = 'development';
    } else if (hostname.includes('staging.chatappserver.space') || hostname.includes('.staging.')) {
      currentEnv = 'staging';
    } else if (hostname.includes('chatappserver.space') && !hostname.includes('dev.') && !hostname.includes('staging.')) {
      currentEnv = 'production';
    }
  }
  
  // Determine endpoint based on current environment
  let endpoint = '';
  if (currentEnv === 'local' || import.meta.env.DEV) {
    endpoint = '';
  } else if (currentEnv === 'development') {
    endpoint = 'https://api.dev.chatappserver.space';
  } else if (currentEnv === 'staging') {
    endpoint = 'https://api.staging.chatappserver.space';
  } else {
    endpoint = 'https://api.chatappserver.space';
  }
  
  // Override with runtime VITE_BASE_ENDPOINT if available
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_BASE_ENDPOINT && currentEnv !== 'local' && !import.meta.env.DEV) {
    endpoint = window.__ENV__.VITE_BASE_ENDPOINT;
  }
  
  // Override with build-time VITE_BASE_ENDPOINT if explicitly set
  if (import.meta.env.VITE_BASE_ENDPOINT && currentEnv !== 'local' && !import.meta.env.DEV) {
    endpoint = import.meta.env.VITE_BASE_ENDPOINT;
  }
  
  return endpoint ? `${endpoint}/api/v1` : '/api/v1';
}

// Initial BASE_URL (will be updated by interceptor if needed)
let BASE_URL = getBaseUrl();

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true
});

// Request interceptor to add token to headers
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Update baseURL dynamically in case environment was detected at runtime
    const dynamicBaseUrl = getBaseUrl();
    if (config.baseURL !== dynamicBaseUrl) {
      config.baseURL = dynamicBaseUrl;
    }
    
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
    
    // Log environment info on first request
    if (!(window as { __envLogged?: boolean }).__envLogged) {
      console.log('🔧 Axios Configuration:', {
        APP_ENVIRONMENT,
        BASE_ENDPOINT,
        BASE_URL,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
        runtimeEnv: typeof window !== 'undefined' ? window.__ENV__ : 'N/A',
        buildTimeEnv: import.meta.env.VITE_APP_ENVIRONMENT
      });
      (window as { __envLogged?: boolean }).__envLogged = true;
    }
    
    // Debug logging for development environments
    if (APP_ENVIRONMENT === 'local' || import.meta.env.DEV || APP_ENVIRONMENT === 'development') {
      // Stringify data to see exact format being sent (mask passwords)
      let dataString = 'no data';
      if (config.data) {
        try {
          const dataCopy = typeof config.data === 'object' ? { ...config.data as Record<string, unknown> } : config.data;
          if (typeof dataCopy === 'object' && dataCopy !== null && 'password' in dataCopy) {
            (dataCopy as Record<string, unknown>).password = '***';
          }
          dataString = JSON.stringify(dataCopy);
        } catch {
          dataString = String(config.data);
        }
      }
      console.log('🔵 Axios Request:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        hasToken: !!localStorage.getItem('authToken'),
        contentType: config.headers?.['Content-Type'],
        environment: APP_ENVIRONMENT,
        dataString: dataString
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
    
    // Log error responses for debugging (especially 400, 403, 500, 503 errors)
    if (error.response) {
      const isDevelopment = APP_ENVIRONMENT === 'local' || import.meta.env.DEV || APP_ENVIRONMENT === 'development';
      const shouldLog = isDevelopment || 
                       error.response.status === 403 || 
                       error.response.status === 401 ||
                       error.response.status === 500 ||
                       error.response.status === 503;
      
      if (shouldLog) {
        console.error('🔴 Backend Error Response:', {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          fullURL: `${error.config?.baseURL}${error.config?.url}`,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          hasAuthToken: !!localStorage.getItem('authToken'),
          environment: APP_ENVIRONMENT,
          headers: error.response.headers
        });
        
        // Special handling for 500/503 errors
        if (error.response.status === 500 || error.response.status === 503) {
          console.error('🚨 Server Error:', {
            status: error.response.status,
            message: error.response.status === 503 
              ? 'Service Unavailable - Backend server may be down or overloaded'
              : 'Internal Server Error - Backend encountered an error',
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            suggestion: 'Check backend server logs and ensure the API is running'
          });
        }
      }
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
    
    // Handle 401 (Unauthorized) and 403 (Forbidden) errors
    // Both typically indicate authentication/authorization issues
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Log the specific error for debugging
      if (error.response?.status === 403) {
        console.error('🚫 403 Forbidden Error:', {
          url: error.config?.url,
          message: 'Access forbidden. This may indicate:',
          possibleCauses: [
            'Missing or invalid authentication token',
            'Token expired',
            'Insufficient permissions',
            'API endpoint not properly configured',
            'CORS configuration issue'
          ],
          hasToken: !!localStorage.getItem('authToken'),
          environment: APP_ENVIRONMENT,
          baseURL: error.config?.baseURL
        });
      }
      
      // Clear token from localStorage
      try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('keepLoggedIn');
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

