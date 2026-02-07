import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const initialRegister = {
  username: '',
  password: '',
  email: '',
  display_name: ''
};

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState(initialRegister);
  const [loading, setLoading] = useState(false);
  const { login, register, error, setError } = useAuth();
  const navigate = useNavigate();

  const onLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(loginData.username, loginData.password);
      navigate('/profile');
    } catch (err) {
      setError('Login xatosi. Maʼlumotlarni tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register({
        username: registerData.username,
        password: registerData.password,
        email: registerData.email || null,
        display_name: registerData.display_name || null
      });
      navigate('/profile');
    } catch (err) {
      setError('Roʻyxatdan oʻtish xatosi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="section auth-card">
        <div className="auth-head">
          <h1>{mode === 'login' ? 'Kirish' : 'Roʻyxatdan oʻtish'}</h1>
          <p className="muted">
            {mode === 'login'
              ? 'Hisobingizga kiring va hamjamiyatga qoʻshiling.'
              : 'Yangi hisob yarating va barcha imkoniyatlarni oching.'}
          </p>
        </div>

        <div className="auth-toggle">
          <button
            className={mode === 'login' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={mode === 'register' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={onLogin}>
            <label>
              Username
              <input
                value={loginData.username}
                onChange={(event) => setLoginData({ ...loginData, username: event.target.value })}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginData.password}
                onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                required
              />
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            <button className="primary-btn" disabled={loading}>
              {loading ? 'Kutib turing...' : 'Kirish'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={onRegister}>
            <label>
              Username
              <input
                value={registerData.username}
                onChange={(event) =>
                  setRegisterData({ ...registerData, username: event.target.value })
                }
                required
              />
            </label>
            <label>
              Display name
              <input
                value={registerData.display_name}
                onChange={(event) =>
                  setRegisterData({ ...registerData, display_name: event.target.value })
                }
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={registerData.email}
                onChange={(event) => setRegisterData({ ...registerData, email: event.target.value })}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={registerData.password}
                onChange={(event) =>
                  setRegisterData({ ...registerData, password: event.target.value })
                }
                required
              />
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            <button className="primary-btn" disabled={loading}>
              {loading ? 'Kutib turing...' : 'Roʻyxatdan oʻtish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
