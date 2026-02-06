function TeamSection() {
  return (
    <section className="team section section-team" id="team">
      <div className="section-head">
        <h2>Jamoa</h2>
        <p>Reader-Overlay loyihasi bo‘yicha asosiy rollar va kontaktlar.</p>
      </div>
      <div className="team-grid">
        <div className="team-card">
          <div className="team-role">Lead Developer</div>
          <p className="team-name">MegaladoNN</p>
          <p className="team-desc">Arxitektura, frontend va sinxronizatsiya logikasi.</p>
        </div>
        <div className="team-card">
          <div className="team-role">UI/UX Designer</div>
          <p className="team-name">Product Design</p>
          <p className="team-desc">Foydalanuvchi oqimi, vizual tizim va landing.</p>
        </div>
        <div className="team-card">
          <div className="team-role">Backend Engineer</div>
          <p className="team-name">Integration</p>
          <p className="team-desc">Tarjima va kontekst API larini ulash.</p>
        </div>
      </div>
      <a className="link-chip" href="https://github.com/megaladonntm-arch" target="_blank" rel="noreferrer">
        GitHub: megaladonntm-arch
      </a>
    </section>
  );
}

export default TeamSection;
