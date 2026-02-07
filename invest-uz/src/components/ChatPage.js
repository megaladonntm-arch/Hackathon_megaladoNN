import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../AuthContext';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export default function ChatPage() {
  const { token, isAuthed } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const loadMessages = async () => {
    setStatus('');
    try {
      const data = await apiFetch('/api/chat');
      setMessages(data);
    } catch (err) {
      setStatus('Chatni yuklashda xatolik.');
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    if (!isAuthed) {
      setStatus('Xabar yuborish uchun login qiling.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const created = await apiFetch(
        '/api/chat',
        { method: 'POST', body: JSON.stringify({ message: message.trim() }) },
        token
      );
      setMessages([...messages, created]);
      setMessage('');
    } catch (err) {
      setStatus('Xabar yuborishda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page chat-page">
      <div className="section chat-card">
        <div className="chat-head">
          <h1>Chat</h1>
          <button className="ghost-btn" onClick={loadMessages}>
            Yangilash
          </button>
        </div>
        <p className="muted">Barcha foydalanuvchilar uchun umumiy chat.</p>
        <div className="chat-window">
          {messages.length === 0 ? <p className="muted">Hozircha xabar yo'q.</p> : null}
          {messages.map((item) => (
            <div key={item.id} className="chat-item">
              <div className="chat-meta">
                <span className="chat-user">{item.username || 'unknown'}</span>
                <span className="chat-time">{formatTime(item.created_at)}</span>
              </div>
              <p className="chat-message">{item.message}</p>
            </div>
          ))}
        </div>
        {status ? <p className="status-text">{status}</p> : null}
        <form className="chat-input" onSubmit={sendMessage}>
          <input
            placeholder={isAuthed ? 'Xabar yozing...' : 'Login qiling va yozing...'}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <button className="primary-btn" disabled={loading}>
            {loading ? 'Yuborilmoqda...' : 'Yuborish'}
          </button>
        </form>
      </div>
    </div>
  );
}
