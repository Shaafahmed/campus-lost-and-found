import axios from 'axios';

// Axios instance used for every API call. The JWT token is attached automatically.
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(err) {
  return err?.response?.data?.message || err.message || 'Something went wrong';
}

export default api;
