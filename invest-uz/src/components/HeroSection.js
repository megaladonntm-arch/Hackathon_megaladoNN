import { Link } from 'react-router-dom';

function HeroSection() {
  return (
    <section className="hero section section-landing" id="landing">
      <div className="hero-content">
        <p className="eyebrow">Landing</p>
        <h1>Reader-Overlay</h1>
        <p className="hero-lead">
          Chet tilidagi matnlarni o‘qishda doimiy tab almashish charchatadi. Reader-Overlay tarjimani kontekstga yaqin ko‘rsatadi,
          shuning uchun o‘qish bir maromda, stresssiz va tezroq bo‘ladi.
        </p>
        <div className="hero-actions">
          <Link className="primary-btn" to="/demo">Demo oynasini ochish</Link>
          <a className="ghost-btn" href="#mvp">MVP ko‘rinishi</a>
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
          <p className="glass-title">Universal o‘qish muhiti</p>
          <p className="glass-text">Bir oynada matn, kontekst, tarjima va fokus. Ish, o‘qish yoki tadqiqot uchun bir xil qulaylik.</p>
          <div className="chip-row">
            <span className="chip">Instant context</span>
            <span className="chip">Single focus</span>
            <span className="chip">Universal UX</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
