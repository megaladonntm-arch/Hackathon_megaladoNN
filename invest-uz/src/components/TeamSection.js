function TeamSection() {
  return (
    <section className="team section section-team" id="team">
      <div className="section-head">
        <h2>Jamoa</h2>
        <p>Bolalar uchun foydali va xavfsiz o‘qish tajribasi yaratamiz.</p>
      </div>
      <div className="team-grid">
        <div className="team-card">
          <div className="team-role">Lead</div>
          <p className="team-name">MegaladoNN</p>
          <p className="team-desc">Arxitektura va bolalar uchun qulay yechimlar.</p>
        </div>
        <div className="team-card">
          <div className="team-role">UI/UX</div>
          <p className="team-name">Product Design</p>
          <p className="team-desc">Quvnoq va tushunarli dizayn.</p>
        </div>
        <div className="team-card">
          <div className="team-role">Backend</div>
          <p className="team-name">Integration</p>
          <p className="team-desc">Tez va ishonchli tarjima xizmati.</p>
        </div>
      </div>
      <a className="link-chip" href="https://github.com/megaladonntm-arch" target="_blank" rel="noreferrer">
        GitHub: megaladonntm-arch
      </a>
    </section>
  );
}

export default TeamSection;
