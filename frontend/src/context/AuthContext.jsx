import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hf_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hf_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => {
        localStorage.setItem('hf_user', JSON.stringify(r.data.user));
        setUser(r.data.user);
      })
      .catch(() => { localStorage.removeItem('hf_token'); localStorage.removeItem('hf_user'); })
      .finally(() => setLoading(false));
  }, []);

  function saveAuth(token, user) {
    localStorage.setItem('hf_token', token);
    localStorage.setItem('hf_user', JSON.stringify(user));
    setUser(user);
  }

  async function refreshUser() {
    const r = await api.get('/auth/me');
    const updated = r.data.user;
    localStorage.setItem('hf_user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  }

  function logout() {
    localStorage.removeItem('hf_token');
    localStorage.removeItem('hf_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, saveAuth, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
