/**
 * Environment variable utilities
 * Supports both build-time (import.meta.env) and runtime (window.__ENV__) environment variables
 * Runtime variables take precedence, allowing injection at deployment time
 */

/**
 * Get an environment variable value
 * Checks runtime (window.__ENV__) first, then falls back to build-time (import.meta.env)
 * @param key - The environment variable key (e.g., 'VITE_CLOUD_NAME')
 * @returns The environment variable value or undefined
 */
export function getEnvVar(key: string): string | undefined {
  // Check runtime environment variables first (injected at deployment)
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key];
  }
  
  // Fall back to build-time environment variables
  return import.meta.env[key];
}

/**
 * Get VITE_CLOUD_NAME with runtime support
 * @returns Cloudinary cloud name or undefined
 */
export function getCloudName(): string | undefined {
  const cloudName = getEnvVar('VITE_CLOUD_NAME');
  
  if (cloudName) {
    // Log when using runtime value (helpful for debugging)
    if (typeof window !== 'undefined' && window.__ENV__?.VITE_CLOUD_NAME) {
      console.warn('ℹ️ Using runtime Cloudinary name:', cloudName);
    }
    return cloudName;
  }
  
  // Error logging for missing cloud name
  const buildTimeEnv = import.meta.env.VITE_CLOUD_NAME;
  const runtimeEnv = typeof window !== 'undefined' ? window.__ENV__?.VITE_CLOUD_NAME : undefined;
  
  console.error('⚠️ CRITICAL: VITE_CLOUD_NAME is not set! Image/video uploads will not work.');
  console.error('Build-time env:', buildTimeEnv);
  console.error('Runtime env:', runtimeEnv);
  console.error('Please ensure VITE_CLOUD_NAME is set during build or injected at runtime via window.__ENV__.VITE_CLOUD_NAME');
  
  return undefined;
}

// Extend Window interface to include __ENV__
declare global {
  interface Window {
    __ENV__?: {
      [key: string]: string;
    };
  }
}

