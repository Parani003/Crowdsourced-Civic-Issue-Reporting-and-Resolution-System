import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true, // Crucial for receiving and sending JWT HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
