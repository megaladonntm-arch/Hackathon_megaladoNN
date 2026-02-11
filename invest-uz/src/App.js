import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Demo from './components/Demo';
import AiHelperWidget from './components/AiHelperWidget';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import TodoPage from './components/TodoPage';
import ChatPage from './components/ChatPage';
import QuizPage from './components/QuizPage';
import About from './components/About';
import { useAuth } from './AuthContext';
import './App.css';

const navItems = [
  { path: '/', label: 'Bosh sahifa' },
  { path: '/demo', label: 'Demo' },
  { path: '/auth', label: 'Kirish' },
  { path: '/profile', label: 'Profil' },
  { path: '/todos', label: 'To Do' },
  { path: '/quiz', label: 'Viktorina' },
  { path: '/chat', label: 'Chat' }
];

function App() {
  const { isAuthed, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <header className="topbar">
          <div className="topbar-main">
            <div className="brand">
              <img src="/logo.png" alt="Redok Logo" className="brand-logo" />
              <div>
                <p className="brand-title">Redok: Reader-Overlay Kids</p>
                <p className="brand-subtitle">8-16 yosh uchun quvnoq va aqlli o'qish yordamchisi</p>
              </div>
            </div>
            <button
              type="button"
              className={menuOpen ? 'nav-toggle active' : 'nav-toggle'}
              aria-expanded={menuOpen}
              aria-label="Menyu ochish"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
          <nav className={menuOpen ? 'nav nav-open' : 'nav'}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink className="nav-link" to="/about" onClick={handleNavClick}>
              Loyiha haqida
            </NavLink>
            <a className="nav-link" href="/#mvp" onClick={handleNavClick}>
              Roadmap
            </a>
            <a className="nav-link" href="/#problem" onClick={handleNavClick}>
              Muammo-Yechim
            </a>
            <a className="nav-link" href="/#why" onClick={handleNavClick}>
              Nega biz?
            </a>
            {isAuthed ? (
              <button
                className="nav-link nav-logout"
                onClick={() => {
                  handleNavClick();
                  logout();
                }}
              >
                Chiqish
              </button>
            ) : null}
          </nav>
        </header>
        <AiHelperWidget />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/todos" element={<TodoPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
