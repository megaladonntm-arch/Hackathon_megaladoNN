import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Demo from './components/Demo';
import './App.css';

const navItems = [
  { path: '/', label: 'Bosh sahifa' },
  { path: '/demo', label: 'Demo' }
];

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">RO</div>
            <div>
              <p className="brand-title">Reader-Overlay Kids</p>
              <p className="brand-subtitle">8-16 yosh uchun quvnoq o‘qish yordamchisi</p>
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
              Muammo → Yechim
            </a>
            <a className="nav-link" href="/#why">
              Nega Biz?
            </a>
            <a className="nav-link" href="https://github.com/megaladonntm-arch" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
