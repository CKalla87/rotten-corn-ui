import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_BASE_ENDPOINT || 'http://localhost:5000'}/api/v1`;

export default axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true
});

