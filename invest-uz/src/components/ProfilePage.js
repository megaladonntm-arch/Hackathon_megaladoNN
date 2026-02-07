import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../AuthContext';

export default function ProfilePage() {
  const { token, user, setUser, isAuthed } = useAuth();
  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    interests: ''
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name || '',
        bio: user.bio || '',
        interests: (user.interests || []).join(', ')
      });
    }
  }, [user]);

  const onSave = async (event) => {
    event.preventDefault();
    setStatus('');
    try {
      const payload = {
        display_name: form.display_name || null,
        bio: form.bio || null,
        interests: form.interests
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      };
      const updated = await apiFetch('/api/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }, token);
      setUser(updated);
      localStorage.setItem('ro_user', JSON.stringify(updated));
      setStatus('Profil saqlandi.');
    } catch (err) {
      setStatus('Saqlashda xatolik.');
    }
  };

  if (!isAuthed) {
    return (
      <div className="page">
        <div className="section">
          <h2>Profil</h2>
          <p className="muted">Profilni ko‘rish uchun login qiling.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <div className="section profile-card">
        <h1>Profil</h1>
        <p className="muted">Shaxsiy maʼlumotlaringiz va qiziqishlaringiz.</p>
        <div className="profile-meta">
          <span className="chip">Level: {user.level}</span>
          <span className="chip">XP: {user.xp}</span>
          <span className="chip">Role: {user.role}</span>
        </div>
        <form className="profile-form" onSubmit={onSave}>
          <label>
            Display name
            <input
              value={form.display_name}
              onChange={(event) => setForm({ ...form, display_name: event.target.value })}
            />
          </label>
          <label>
            Bio
            <textarea
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
          </label>
          <label>
            Qiziqishlar (vergul bilan)
            <input
              value={form.interests}
              onChange={(event) => setForm({ ...form, interests: event.target.value })}
            />
          </label>
          {status ? <p className="status-text">{status}</p> : null}
          <button className="primary-btn">Saqlash</button>
        </form>
      </div>
    </div>
  );
}
