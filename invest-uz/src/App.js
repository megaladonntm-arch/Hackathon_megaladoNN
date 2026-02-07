import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Demo from './components/Demo';
import AiHelperWidget from './components/AiHelperWidget';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import TodoPage from './components/TodoPage';
import ChatPage from './components/ChatPage';
import { useAuth } from './AuthContext';
import './App.css';

const navItems = [
  { path: '/', label: 'Bosh sahifa' },
  { path: '/demo', label: 'Demo' },
  { path: '/auth', label: 'Kirish' },
  { path: '/profile', label: 'Profil' },
  { path: '/todos', label: 'To Do' },
  { path: '/chat', label: 'Chat' }
];

function App() {
  const { isAuthed, logout } = useAuth();

  return (
    <BrowserRouter>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">RO</div>
            <div>
              <p className="brand-title">Reader-Overlay Kids</p>
              <p className="brand-subtitle">8-16 yosh uchun quvnoq o???qish yordamchisi</p>
            </div>
          </div>
          <nav className="nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                {item.label}
              </NavLink>
            ))}
            <a className="nav-link" href="/#mvp">
              MVP
            </a>
            <a className="nav-link" href="/#problem">
              Muammo ??? Yechim
            </a>
            <a className="nav-link" href="/#why">
              Nega Biz?
            </a>
            <a className="nav-link" href="https://github.com/megaladonntm-arch" target="_blank" rel="noreferrer">
              GitHub
            </a>
            {isAuthed ? (
              <button className="nav-link nav-logout" onClick={logout}>
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
          <Route path="/chat" element={<ChatPage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
