import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count ?? 0);
    } catch { /* non-fatal */ }
  }, [user]);

  // Fetch on mount and after navigation (storage event hack for cross-tab)
  useEffect(() => { refresh(); }, [refresh]);

  // Poll every 90 seconds while the tab is visible
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      if (!document.hidden) refresh();
    }, 90_000);
    return () => clearInterval(id);
  }, [user, refresh]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refresh, setUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
