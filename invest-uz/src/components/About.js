import React from 'react';

function About() {
  return (
    <section className="about section" id="about">
      <div className="section-head">
        <h2>Loyiha haqida</h2>
        <p>Texnologiyalar, muallif, maqsad va kelajak haqida ma'lumot.</p>
      </div>
      <div className="panel">
        <h3>Texnologiyalar steki</h3>
        <ul>
          <li>Frontend: React, CSS, Context API</li>
          <li>Backend: Python, FastAPI</li>
          <li>AI: OpenAI, NLP, Custom ML</li>
        </ul>
        <h3>Nimalar qilindi</h3>
        <ul>
          <li>O'qish uchun yordamchi vidjet</li>
          <li>Matn tarjimasi va tahlili</li>
          <li>Bolalar uchun UX/UI</li>
        </ul>
        <h3>Kelajak rejalar</h3>
        <ul>
          <li>Ko'proq tillar</li>
          <li>Gamifikatsiya</li>
          <li>Funksiyalarni kengaytirish</li>
        </ul>
        <h3>Muallif</h3>
        <ul>
          <li>megaladoNN, yosh: 15</li>
          <li>Telegram: <a href="https://t.me/MGDSSAATEAM" target="_blank" rel="noreferrer">@MGDSSAATEAM</a></li>
        </ul>
      </div>
    </section>
  );
}

export default About;
