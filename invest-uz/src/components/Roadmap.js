function Roadmap() {
  return (
    <section className="roadmap section section-mvp" id="mvp">
      <div className="section-head">
        <h2>MVP</h2>
        <p>Minimal, lekin real qiymat beradigan funksiyalar to‘plami.</p>
      </div>
      <div className="roadmap-list">
        <div className="roadmap-item">
          <span>3 ta rejim</span>
          <p>Magnifier, Layer va Split-view bir joyda.</p>
        </div>
        <div className="roadmap-item">
          <span>Tez tarjima</span>
          <p>Bir marta tarjima qilinadi, o‘qish davomida qayta ishlatiladi.</p>
        </div>
        <div className="roadmap-item">
          <span>Overlay oynasi</span>
          <p>Window API orqali yonma-oyna yoki ichki panel.</p>
        </div>
        <div className="roadmap-item">
          <span>Universal UX</span>
          <p>O‘qish, ish va tadqiqot uchun bir xil oqim.</p>
        </div>
      </div>
    </section>
  );
}

export default Roadmap;
