import axios from 'axios';

const configuredUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/** Base URL without /api suffix, for full-page redirects (e.g. OAuth) */
export const API_BASE_URL = configuredUrl.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: configuredUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export default api;

/** Extract a user-facing error message from an Axios error or generic error */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(err)) {
    return err.response?.data?.error || err.message;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
