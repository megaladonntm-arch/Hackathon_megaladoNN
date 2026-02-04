import { Link } from 'react-router-dom';

function HeroSection() {
  return (
    <section className="hero" id="hero">
      <div className="hero-content">
        <p className="eyebrow">UzTech Hackathon</p>
        <h1>Reader-Overlay</h1>
        <p className="hero-lead">
          Chet tilidagi matnlarni o‘qishda doimiy tab almashish charchatadi. Bizning yechim esa matn bilan birga ishlovchi kichik
          kontekst oynasi orqali o‘rganishni tezlashtiradi.
        </p>
        <div className="hero-actions">
          <Link className="primary-btn" to="/demo">Demo oynasini ochish</Link>
          <a className="ghost-btn" href="#problem">Muammo → Yechim</a>
        </div>
        <div className="hero-meta">
          <div>
            <p className="meta-title">Fokus</p>
            <p className="meta-value">Kognitiv yukni kamaytirish</p>
          </div>
          <div>
            <p className="meta-title">Platforma</p>
            <p className="meta-value">React + Window API</p>
          </div>
          <div>
            <p className="meta-title">Format</p>
            <p className="meta-value">Web companion overlay</p>
          </div>
        </div>
      </div>
      <div className="hero-card">
        <div className="glass">
          <p className="glass-title">Smart Reader Flow</p>
          <p className="glass-text">Matn tanlanganda, tarjima yoki kontekst alohida oynada darhol ko‘rinadi.</p>
          <div className="chip-row">
            <span className="chip">Instant context</span>
            <span className="chip">Single focus</span>
            <span className="chip">Fast learning</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
