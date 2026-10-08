import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT (if present) to every outgoing request.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('trippal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error handling: unwrap the backend's { success, message } shape
// into a plain Error so components can just do err.message.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';

    // Auto-logout on expired/invalid token, except on the login/register
    // calls themselves (where a 401 just means "wrong password").
    const isAuthRoute =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('trippal_token');
      localStorage.removeItem('trippal_user');
    }

    return Promise.reject(new Error(message));
  }
);

export default axiosClient;