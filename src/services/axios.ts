import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

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

// Cache for base URL to avoid repeated lookups and logging during scrolling
let cachedBaseUrl: string | null = null;
let baseUrlLogged = false;

// Function to get BASE_URL dynamically (allows runtime environment detection)
// Cached to prevent repeated lookups and console spam during scrolling
function getBaseUrl(): string {
  // Return cached value if already computed
  if (cachedBaseUrl !== null) {
    return cachedBaseUrl;
  }
  
  // Re-check environment at runtime
  let currentEnv = getAppEnvironment();
  
  // Runtime hostname detection as fallback (for when env vars aren't set at build time)
  if (typeof window !== 'undefined' && currentEnv === 'local' && !import.meta.env.DEV) {
    const hostname = window.location.hostname;
    if (hostname.includes('dev.chatappserver.space') || hostname.includes('.dev.')) {
      currentEnv = 'development';
      if (!baseUrlLogged) {
      console.log('🌐 Detected develop environment from hostname:', hostname);
        baseUrlLogged = true;
      }
    } else if (hostname.includes('staging.chatappserver.space') || hostname.includes('.staging.')) {
      currentEnv = 'staging';
      if (!baseUrlLogged) {
      console.log('🌐 Detected staging environment from hostname:', hostname);
        baseUrlLogged = true;
      }
    } else if (hostname.includes('chatappserver.space') && !hostname.includes('dev.') && !hostname.includes('staging.')) {
      currentEnv = 'production';
      if (!baseUrlLogged) {
      console.log('🌐 Detected production environment from hostname:', hostname);
        baseUrlLogged = true;
      }
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
    // Only log once to avoid console spam during scrolling
    if (!baseUrlLogged) {
    console.log('🌐 Using runtime VITE_BASE_ENDPOINT:', endpoint);
      baseUrlLogged = true;
    }
  }
  
  // Override with build-time VITE_BASE_ENDPOINT if explicitly set (but not in local dev to use proxy)
  if (import.meta.env.VITE_BASE_ENDPOINT && currentEnv !== 'local' && !import.meta.env.DEV) {
    endpoint = import.meta.env.VITE_BASE_ENDPOINT;
  }
  
  const baseUrl = endpoint ? `${endpoint}/api/v1` : '/api/v1';
  cachedBaseUrl = baseUrl;
  return baseUrl;
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

// Initial BASE_URL (will be updated by interceptor if needed)
const BASE_URL = getBaseUrl();

// Performance optimizations for hosted environments
const isHostedEnv = () => {
  const env = getAppEnvironment();
  return env === 'development' || env === 'staging' || env === 'production';
};

// Get timeout based on environment and request type
// Using very long timeouts to prevent premature failures
const getTimeout = (config?: InternalAxiosRequestConfig): number => {
  const env = getAppEnvironment();
  
  // Check if this is a file upload request (image/video)
  const isFileUpload = config?.url?.includes('/post/image') || 
                       config?.url?.includes('/post/video') ||
                       config?.url?.includes('/post/image/post') ||
                       config?.url?.includes('/post/video/post');
  
  if (isFileUpload) {
    // File uploads need much more time - 5 minutes for large files
    return 300000; // 5 minutes (300 seconds)
  }
  
  // Regular requests - very long timeouts for all environments
  if (env === 'development') {
    return 120000; // 2 minutes for develop (very lenient)
  } else if (env === 'staging' || env === 'production') {
    return 120000; // 2 minutes for staging/production
  }
  return 120000; // 2 minutes for local
};

// Request cache for GET requests (only in hosted environments)
const requestCache = new Map<string, { data: unknown; timestamp: number; response: unknown }>();
const CACHE_DURATION = 2000; // 2 seconds cache for GET requests in hosted envs

// Request deduplication - prevent duplicate simultaneous requests
// Maps request key to { promise, timestamp }
interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}
const pendingRequests = new Map<string, PendingRequest>();
const DEDUP_WINDOW_MS = 100; // Only deduplicate requests within 100ms of each other

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 
    'Content-Type': 'application/json', 
    Accept: 'application/json'
  },
  withCredentials: true,
  timeout: getTimeout(), // Default timeout (will be overridden per-request for file uploads)
  maxRedirects: isHostedEnv() ? 2 : 5, // Fewer redirects for faster responses
  decompress: true // Enable response decompression
});

// Wrap axios methods to add request deduplication for GET requests
// Exclude comment endpoints from deduplication as they need to update during scrolling
const originalGet = axiosInstance.get.bind(axiosInstance);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
axiosInstance.get = function<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: InternalAxiosRequestConfig<D>): Promise<R> {
  // Check if this is a comment endpoint - don't deduplicate these as they need real-time updates
  const isCommentEndpoint = url?.includes('/post/comments/') || url?.includes('/post/commentsnames/');
  
  // Only deduplicate GET requests that are NOT comment endpoints
  if (!isCommentEndpoint) {
    const requestKey = `get:${url}:${JSON.stringify(config?.params || {})}`;
    const now = Date.now();
    
    // Check if this exact request is already pending and within the deduplication window
    const pendingRequest = pendingRequests.get(requestKey);
    if (pendingRequest) {
      const age = now - pendingRequest.timestamp;
      if (age < DEDUP_WINDOW_MS) {
        // Request is very recent (within dedup window), return existing promise
        return pendingRequest.promise as Promise<R>;
      } else {
        // Request is old, clean it up and allow new request
        pendingRequests.delete(requestKey);
      }
    }
    
    // Create the request promise and track it
    const requestPromise = originalGet<T, R, D>(url, config)
      .then((response) => {
        // Remove from pending when resolved
        pendingRequests.delete(requestKey);
        return response;
      })
      .catch((error) => {
        // Remove from pending when rejected
        pendingRequests.delete(requestKey);
        throw error;
      });
    
    // Track the pending request with timestamp
    pendingRequests.set(requestKey, {
      promise: requestPromise,
      timestamp: now
    });
    
    return requestPromise;
  }
  
  // For comment endpoints, just make the request normally (no deduplication)
  return originalGet<T, R, D>(url, config);
};

// Request interceptor to add token to headers and handle caching/deduplication
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Update baseURL dynamically in case environment was detected at runtime
    const dynamicBaseUrl = getBaseUrl();
    if (config.baseURL !== dynamicBaseUrl) {
      config.baseURL = dynamicBaseUrl;
    }
    
    // Set request-specific timeout (file uploads get longer timeout)
    config.timeout = getTimeout(config);
    
    // Request caching and deduplication for GET requests (all environments)
    if (config.method?.toLowerCase() === 'get') {
      const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
      
      // Check cache first - if cached and fresh, mark to use cache
      const cached = requestCache.get(requestKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Mark config to use cached response
        (config as InternalAxiosRequestConfig & { __fromCache?: boolean; __cachedResponse?: unknown }).__fromCache = true;
        (config as InternalAxiosRequestConfig & { __cachedResponse?: unknown }).__cachedResponse = cached.response;
        return config;
      }
      
      // Note: Request deduplication is handled at the axios method level (see wrapped get method above)
      // This interceptor just handles caching
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
    
    // Disable all logging in hosted environments for maximum performance
    // Logging adds overhead and slows down requests
    const currentEnv = getAppEnvironment();
    const isLocal = currentEnv === 'local' || import.meta.env.DEV;
    
    // Only log in local development (not in hosted environments)
    if (isLocal) {
      // Log environment info only once
      if (!(window as { __envLogged?: boolean }).__envLogged) {
        console.log('🔧 Axios Configuration:', {
          APP_ENVIRONMENT: currentEnv,
          BASE_ENDPOINT: getBaseEndpoint(),
          BASE_URL: dynamicBaseUrl,
          hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A'
        });
        (window as { __envLogged?: boolean }).__envLogged = true;
      }
      
      // Debug logging for local development only
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
        environment: getAppEnvironment(),
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

// Response interceptor to handle 401 errors, CORS errors, and caching
axiosInstance.interceptors.response.use(
  (response) => {
    const config = response.config as InternalAxiosRequestConfig & { __fromCache?: boolean; __cachedResponse?: unknown; __usePendingRequest?: Promise<unknown> };
    
    // Handle cached responses - return cached response immediately (no network delay)
    if (config.__fromCache && config.__cachedResponse) {
      return config.__cachedResponse as typeof response;
    }
    
    // Cache successful GET responses (all environments)
    if (response.config.method?.toLowerCase() === 'get' && response.status === 200) {
      const requestKey = `${response.config.method}:${response.config.url}:${JSON.stringify(response.config.params || {})}`;
      requestCache.set(requestKey, {
        data: response.data,
        timestamp: Date.now(),
        response: response
      });
      
      // Clean up old cache entries periodically (keep cache size manageable)
      if (requestCache.size > 150) {
        const now = Date.now();
        for (const [key, value] of requestCache.entries()) {
          if (now - value.timestamp > CACHE_DURATION * 3) {
            requestCache.delete(key);
          }
        }
      }
      
      // Remove from pending requests
      pendingRequests.delete(requestKey);
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Reduce error logging in hosted environments for better performance
    // Only log critical errors in hosted envs, full logging in local
    if (error.response) {
      const currentEnv = getAppEnvironment();
      const isLocal = currentEnv === 'local' || import.meta.env.DEV;
      // In hosted envs, only log critical errors (500, 503) to reduce overhead
      const shouldLog = isLocal || 
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
          environment: getAppEnvironment(),
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
    
    // Remove from pending requests on error
    if (originalRequest?.url && originalRequest?.method) {
      const requestKey = `${originalRequest.method}:${originalRequest.url}:${JSON.stringify(originalRequest.params || {})}`;
      pendingRequests.delete(requestKey);
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
    
    // Handle 503 (Service Unavailable) errors
    if (error.response?.status === 503) {
      const currentEnv = getAppEnvironment();
      const isLocal = currentEnv === 'local' || import.meta.env.DEV;
      
      if (isLocal) {
        console.error('🚨 503 Service Unavailable Error:', {
          url: error.config?.url,
          message: 'Backend service is temporarily unavailable. This may indicate:',
          possibleCauses: [
            'Backend server is overloaded',
            'Backend server is restarting',
            'Database connection issues',
            'Backend service is down',
            'Network connectivity issues'
          ],
          suggestion: 'Please try again in a few moments or check backend server status',
          baseURL: error.config?.baseURL
        });
      }
      
      // Don't retry 503 errors automatically - let the user retry
      const serviceUnavailableError = new Error('Service temporarily unavailable. Please try again in a moment.') as AxiosError;
      serviceUnavailableError.config = error.config;
      serviceUnavailableError.request = error.request;
      serviceUnavailableError.response = error.response;
      serviceUnavailableError.isAxiosError = true;
      return Promise.reject(serviceUnavailableError);
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
          environment: getAppEnvironment(),
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

