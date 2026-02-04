function HowItWorks() {
  return (
    <section className="how" id="how">
      <div className="section-head">
        <h2>Yechim qanday ishlaydi</h2>
        <p>Asosiy oynada tanlangan matn Window API orqali alohida overlay oynasiga uzatiladi.</p>
      </div>
      <div className="how-grid">
        <div className="how-card">
          <h3>React UI</h3>
          <p>Asosiy interfeysda o‘qish muhiti va tanlangan matnni kuzatish.</p>
        </div>
        <div className="how-card">
          <h3>Window API</h3>
          <p>window.open orqali kichik companion oynasi yaratiladi va sinxron ishlaydi.</p>
        </div>
        <div className="how-card">
          <h3>Real-time sync</h3>
          <p>Tanlangan matn bir zumda overlay oynada ko‘rinadi.</p>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
