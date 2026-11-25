import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const MessagesContext = createContext({ totalUnread: 0, refreshUnread: () => {} });

export function MessagesProvider({ children }) {
  const [totalUnread, setTotalUnread] = useState(0);

  // Call with thread array to avoid a second fetch, or no args to re-fetch
  const refreshUnread = useCallback((threads) => {
    if (Array.isArray(threads)) {
      setTotalUnread(threads.reduce((s, t) => s + (t.unreadCount || 0), 0));
    } else {
      api.get('/messages/inbox')
        .then(r => setTotalUnread((r.data.threads || []).reduce((s, t) => s + (t.unreadCount || 0), 0)))
        .catch(() => {});
    }
  }, []);

  return (
    <MessagesContext.Provider value={{ totalUnread, refreshUnread }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => useContext(MessagesContext);
