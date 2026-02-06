function HowItWorks() {
  return (
    <section className="how section section-demo" id="demo">
      <div className="section-head">
        <h2>Qanday ishlaydi</h2>
        <p>Uchta rejim: lupaning ichida tarjima, ustma-ust ko‘rinish va ikki ustun.</p>
      </div>
      <div className="how-grid">
        <div className="how-card">
          <h3>Lupa rejimi</h3>
          <p>So‘z ustiga borsang, tarjima doira ichida chiqadi.</p>
        </div>
        <div className="how-card">
          <h3>Ustma-ust</h3>
          <p>Tarjima original ustida yumshoq ko‘rinadi, matn yo‘qolmaydi.</p>
        </div>
        <div className="how-card">
          <h3>Ikki ustun</h3>
          <p>Original va tarjima yonma-yon, o‘qish oson.</p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
