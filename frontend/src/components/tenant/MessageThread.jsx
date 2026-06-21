import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function MessageThread({ propertyId, otherUserId, otherName, onRead }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/messages/${propertyId}/${otherUserId}`)
      .then(r => {
        setMessages(r.data.messages);
        // Mark received messages as read
        api.patch(`/messages/${propertyId}/${otherUserId}/read`)
          .then(() => onRead?.())
          .catch(() => {});
      })
      .catch(() => {});
  }, [propertyId, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post('/messages', {
        propertyId, receiverId: otherUserId, content: text.trim(),
      });
      setMessages(prev => [...prev, data.message]);
      setText('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 320 }}>
      <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-500">
        Conversation with <span className="font-medium text-primary">{otherName}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm pt-8">No messages yet. Say hello!</p>
        )}
        {messages.map(m => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${mine ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-800'}`}>
                <p>{m.content}</p>
                <p className={`text-xs mt-1 ${mine ? 'text-white/70' : 'text-gray-400'}`}>
                  {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t p-3 flex gap-2">
        <input
          className="input flex-1 text-sm py-2"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
        />
        <button className="btn-secondary px-4 py-2 text-sm" disabled={sending || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
