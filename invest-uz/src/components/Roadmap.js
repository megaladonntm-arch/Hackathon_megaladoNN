function Roadmap() {
  return (
    <section className="roadmap section section-mvp" id="mvp">
      <div className="section-head">
        <h2>MVP</h2>
        <p>Bolalar uchun kerakli va foydali funksiyalar.</p>
      </div>
      <div className="roadmap-list">
        <div className="roadmap-item">
          <span>3 ta rejim</span>
          <p>Lupa, ustma-ust va ikki ustun.</p>
        </div>
        <div className="roadmap-item">
          <span>Tez tarjima</span>
          <p>Bir marta tarjima, keyin o‘qish davomida ishlatiladi.</p>
        </div>
        <div className="roadmap-item">
          <span>Overlay oynasi</span>
          <p>Matn yonida qulay ko‘rinish.</p>
        </div>
        <div className="roadmap-item">
          <span>Oson UX</span>
          <p>O‘qish uchun sodda va tushunarli.</p>
        </div>
      </div>
    </section>
  );
}

export default Roadmap;
