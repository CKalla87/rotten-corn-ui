import axios from 'axios';

// In development, use relative URL to leverage Vite proxy
// In production, use the environment variable or fallback to full URL
const BASE_URL = import.meta.env.DEV
  ? '/api/v1'
  : `${import.meta.env.VITE_BASE_ENDPOINT || 'http://localhost:5000'}/api/v1`;

export default axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true
});

