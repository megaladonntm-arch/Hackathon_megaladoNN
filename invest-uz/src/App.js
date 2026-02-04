import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/demo', label: 'Demo' }
];

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">IU</div>
            <div className="brand-text">
              <span className="brand-title">InvestUz</span>
              <span className="brand-subtitle">Fractional Ownership Hub</span>
            </div>
          </div>
          <nav className="nav">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                {item.label}
              </NavLink>
            ))}
            <a className="nav-cta" href="https://github.com/megaladonntm-arch" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <main className="page">
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">UzTech Hackathon Presentation</p>
          <h1>InvestUz makes real estate ownership accessible through fractional digital shares.</h1>
          <p className="hero-lead">
            The Uzbekistan real estate market is growing fast, but traditional ownership excludes most young investors. InvestUz opens
            the door with transparent, compliant, and easy-to-understand fractional access.
          </p>
          <div className="hero-actions">
            <a className="primary-btn" href="#problem">Problem → Solution</a>
            <a className="ghost-btn" href="#roadmap">Roadmap</a>
          </div>
        </div>
        <div className="hero-card">
          <div className="glass-panel">
            <h3>Core Vision</h3>
            <p>Fractional ownership, trusted local sourcing, and automated income distribution.</p>
            <div className="hero-tags">
              <span className="tag">Web3 Transparency</span>
              <span className="tag">Local Market Access</span>
              <span className="tag">AI Risk Insights</span>
            </div>
          </div>
        </div>
      </section>

      <section className="compare" id="problem">
        <div className="compare-card">
          <h2>Problem</h2>
          <ul>
            <li>High entry barriers prevent most young investors from participating.</li>
            <li>Ownership and payouts are often opaque or manual.</li>
            <li>Premium local assets are difficult to access without connections.</li>
          </ul>
        </div>
        <div className="compare-card solution">
          <h2>Solution</h2>
          <ul>
            <li>InvestUz splits assets into affordable digital shares.</li>
            <li>Ownership records and payouts are transparent and automated.</li>
            <li>Curated Uzbekistan properties with clear performance data.</li>
          </ul>
        </div>
      </section>

      <section className="steps" id="how">
        <h2>How The Solution Works</h2>
        <div className="step-grid">
          <div className="step">
            <span>1</span>
            <h3>Select Asset</h3>
            <p>Choose verified properties with legal and performance checks.</p>
          </div>
          <div className="step">
            <span>2</span>
            <h3>Buy Share</h3>
            <p>Purchase fractional ownership and track it in your dashboard.</p>
          </div>
          <div className="step">
            <span>3</span>
            <h3>Earn</h3>
            <p>Receive automated rental income and portfolio insights.</p>
          </div>
        </div>
      </section>

      <section className="team" id="team">
        <h2>Team</h2>
        <div className="team-card">
          <div className="avatar">SU</div>
          <div className="team-details">
            <h3>Sayfullayev Ubaydulla (megaladoNN)</h3>
            <p>Solo Founder & Full-stack Engineer</p>
            <div className="team-grid">
              <div>
                <h4>Roles</h4>
                <p>Product, Design, Frontend, Backend, Research</p>
              </div>
              <div>
                <h4>Skills</h4>
                <p>Full-stack development, market analysis, rapid prototyping</p>
              </div>
              <div>
                <h4>Tech Stack</h4>
                <p>React, CSS3, Node.js, AI Models</p>
              </div>
              <div>
                <h4>Links</h4>
                <p><a href="https://github.com/megaladonntm-arch" target="_blank" rel="noreferrer">GitHub Profile</a></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="why" id="why">
        <h2>Why This Team Can Solve It</h2>
        <div className="why-grid">
          <div className="why-card">
            <h3>Local Market Knowledge</h3>
            <p>Hands-on research into Uzbekistan real estate dynamics and user needs.</p>
          </div>
          <div className="why-card">
            <h3>Technical Execution</h3>
            <p>Full-stack capability to deliver web, AI, and blockchain integrations.</p>
          </div>
          <div className="why-card">
            <h3>Fast Iteration</h3>
            <p>Solo development enables rapid iteration and direct user feedback loops.</p>
          </div>
        </div>
      </section>

      <section className="roadmap" id="roadmap">
        <h2>Roadmap</h2>
        <div className="timeline">
          <div className="timeline-item">
            <div className="dot">1</div>
            <div>
              <h3>Idea</h3>
              <p>Market analysis and legal research completed in February 2026.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="dot">2</div>
            <div>
              <h3>Prototype</h3>
              <p>Interactive web interface and dashboard built in the current phase.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="dot">3</div>
            <div>
              <h3>MVP</h3>
              <p>Smart contracts and payment gateways planned for April 2026.</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="dot">4</div>
            <div>
              <h3>Launched</h3>
              <p>Onboard the first real estate objects in June 2026.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Demo() {
  return (
    <main className="page demo">
      <section className="demo-hero">
        <h1>Demo</h1>
        <p className="muted">A walkthrough of the InvestUz concept, prototype, and functionality.</p>
      </section>

      <section className="demo-video">
        <div className="video-frame">
          <div className="video-placeholder">
            <span>Upload demo video here</span>
            <button className="primary-btn">Play Demo</button>
          </div>
        </div>
      </section>

      <section className="demo-details">
        <h2>Demo Video Description</h2>
        <p className="muted">
          The demo explains how users browse verified assets, purchase fractional shares, and track rental income through a secure
          dashboard. It also shows the transparency layer that keeps ownership records and performance metrics visible.
        </p>
        <div className="demo-list">
          <div className="demo-item">
            <h3>What Works</h3>
            <p>Property discovery flow, share allocation UI, and investor overview.</p>
          </div>
          <div className="demo-item">
            <h3>How It Works</h3>
            <p>Ownership records and payouts are automated, with AI insights for risk monitoring.</p>
          </div>
          <div className="demo-item">
            <h3>Prototype Link</h3>
            <p><a href="https://github.com/megaladonntm-arch" target="_blank" rel="noreferrer">Open Prototype</a></p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;