import { Link } from 'react-router-dom';

function HeroSection() {
  return (
    <section className="hero section section-landing" id="landing">
      <div className="hero-content">
        <p className="eyebrow">Kids Lead</p>
        <h1>Reader-Overlay Kids</h1>
        <p className="hero-lead">
          8-16 yosh uchun quvnoq va oson o‘qish. So‘zlar tarjimasi yoningda paydo bo‘ladi,
          shuning uchun chalg‘imaysan va o‘qish tezroq, yengilroq bo‘ladi.
        </p>
        <div className="hero-actions">
          <Link className="primary-btn" to="/demo">Demo ni ko‘rish</Link>
          <a className="ghost-btn" href="#mvp">Qanday ishlaydi</a>
        </div>
        <div className="hero-meta">
          <div>
            <p className="meta-title">Fokus</p>
            <p className="meta-value">Diqqat bir joyda</p>
          </div>
          <div>
            <p className="meta-title">Platforma</p>
            <p className="meta-value">Web ilova</p>
          </div>
          <div>
            <p className="meta-title">Format</p>
            <p className="meta-value">Overlay yordamchi</p>
          </div>
        </div>
      </div>
      <div className="hero-card">
        <div className="glass">
          <p className="glass-title">O‘qish oson, lekin qiziqarli</p>
          <p className="glass-text">Matn, tarjima va kontekst bir joyda. Dars, kitob yoki maqola uchun qulay.</p>
          <div className="chip-row">
            <span className="chip">Tez tarjima</span>
            <span className="chip">Bir ekran</span>
            <span className="chip">Quvnoq dizayn</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
