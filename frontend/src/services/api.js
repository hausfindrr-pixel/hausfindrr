import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('hf_token') || sessionStorage.getItem('hf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    // Don't force-redirect on the OAuth callback page — it handles its own 401s
    // so its catch block can run instead of being preempted by a full page reload.
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/oauth/callback')) {
      localStorage.removeItem('hf_token');
      localStorage.removeItem('hf_user');
      sessionStorage.removeItem('hf_token');
      sessionStorage.removeItem('hf_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
