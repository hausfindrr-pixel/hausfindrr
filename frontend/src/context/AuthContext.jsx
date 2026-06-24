import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Returns whichever storage currently holds the active token
function getActiveStorage() {
  return localStorage.getItem('hf_token') ? localStorage : sessionStorage;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('hf_user') || sessionStorage.getItem('hf_user'),
      );
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hf_token') || sessionStorage.getItem('hf_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => {
        const updated = JSON.stringify(r.data.user);
        getActiveStorage().setItem('hf_user', updated);
        setUser(r.data.user);
      })
      .catch(() => {
        localStorage.removeItem('hf_token');
        localStorage.removeItem('hf_user');
        sessionStorage.removeItem('hf_token');
        sessionStorage.removeItem('hf_user');
      })
      .finally(() => setLoading(false));
  }, []);

  // rememberMe = true  → localStorage (survives browser restarts, 30-day token)
  // rememberMe = false → sessionStorage (cleared when browser tab closes, default token)
  function saveAuth(token, user, rememberMe = false) {
    const keep = rememberMe ? localStorage : sessionStorage;
    const drop = rememberMe ? sessionStorage : localStorage;
    keep.setItem('hf_token', token);
    keep.setItem('hf_user', JSON.stringify(user));
    drop.removeItem('hf_token');
    drop.removeItem('hf_user');
    setUser(user);
  }

  async function refreshUser() {
    const r = await api.get('/auth/me');
    const updated = r.data.user;
    getActiveStorage().setItem('hf_user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  }

  function logout() {
    localStorage.removeItem('hf_token');
    localStorage.removeItem('hf_user');
    sessionStorage.removeItem('hf_token');
    sessionStorage.removeItem('hf_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, saveAuth, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
