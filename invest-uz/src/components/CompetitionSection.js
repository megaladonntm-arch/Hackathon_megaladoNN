import React from 'react';

function CompetitionSection() {
  return (
    <section className="competition-section section" id="competition">
      <div className="section-header">
        <p className="eyebrow">Turnir Rejimi</p>
        <h2>O'qish orqali raqobat qil</h2>
        <p className="section-subtitle">Kitob o'qish qiziqarli bo'ladi - do'stlar bilan pochtalaringni solishtirangiz va yuqori reyting olish uchun o'qing</p>
      </div>

      <div className="competition-grid">
        <div className="competition-card">
          <div className="card-icon">Raqobatli O'qish</div>
          <h3>Raqobaviy O'qish</h3>
          <p>Boshqa o'quvchilar bilan kitoblar va matnlarni o'qish orqali raqobat qiling. Har safar o'qigan so'zlari ko'paytirib, reyting oshiringiz va turli mavzulardagi kitoblardan eng yaxshisini toping.</p>
          <ul className="feature-list">
            <li>Do'stlar bilan raqobat</li>
            <li>Turli kitoblardan tanlash</li>
            <li>Real vaqtda o'qish statistikasi</li>
          </ul>
        </div>

        <div className="competition-card">
          <div className="card-icon">Trofeylar va Mukofotlar</div>
          <h3>Trofeylar va Mukofotlar</h3>
          <p>O'qish miqyosiga qarab turli trofeylar olish imkoniyati. Kunlik, haftalik va yillik raqobatlardan g'alaba qazanib, noyob badge va trofey to'plamingizni to'ldiring.</p>
          <ul className="feature-list">
            <li>Kunlik trofeylar</li>
            <li>Haftalik podiumlar</li>
            <li>Noyob badge orjalar</li>
          </ul>
        </div>

        <div className="competition-card">
          <div className="card-icon">Reytinglar va Pozitsiyalar</div>
          <h3>Reytinglar va Pozitsiyalar</h3>
          <p>O'qish faoliyati asosida reyting tizimi o'z o'rnini topadi. Novice sinfidan Master yoki Grand Master sinfiga ko'tarilish uchun o'qing va o'z malakangizni isbotlang.</p>
          <ul className="feature-list">
            <li>O'n-bir turli reyting</li>
            <li>Progressiv o'sish sistemi</li>
            <li>Profil badge va medalyalar</li>
          </ul>
        </div>

        <div className="competition-card">
          <div className="card-icon">Global Leaderboard</div>
          <h3>Global Leaderboard</h3>
          <p>Jahan bo'ylab eng yaxshi o'quvchilarni ko'ring. Haftalik va yillik reytinglar, eng ko'p kitob o'qigan o'quvchilar, eng tezkor o'quvchilar - barcha ma'lumotlar bir joyda.</p>
          <ul className="feature-list">
            <li>Dunyo bo'ylab reytinglar</li>
            <li>Mavzu bo'ylab top 100</li>
            <li>Do'stlarim reytingi</li>
          </ul>
        </div>

        <div className="competition-card">
          <div className="card-icon">Erishkunlar va Muvaffaqiyatlar</div>
          <h3>Muvaffaqiyatlar</h3>
          <p>Maxsus e'tirozlarni oling - birinchi kitobni tugatish, turli janrlardan 10 ta kitob, 1000 so'z o'qish va boshqa ko'plab muvaffaqiyatlar.</p>
          <ul className="feature-list">
            <li>50+ achievement tipi</li>
            <li>Faqta imkoni mavjud (Secret achievements)</li>
            <li>Profonda ko'rinish</li>
          </ul>
        </div>

        <div className="competition-card">
          <div className="card-icon">Do'stlar va Jamoaviy Raqobat</div>
          <h3>Do'stlar va Jamoaviy Raqobat</h3>
          <p>Do'stlaringizni taklif qiling va bir jamoa sifatida raqobat qiling. Guruhiy turnirlarda katta kollekciya biriktiring va jamoaviy trofeylar olish imkoniyati.</p>
          <ul className="feature-list">
            <li>Do'stlar qo'shish</li>
            <li>Jamoa yaratish</li>
            <li>Jamoaviy hadyalar</li>
          </ul>
        </div>
      </div>

      <div className="mvp-info-box">
        <h3>Ushbu xususiyatlar MVP bosqichida!</h3>
        <p>Bu turib o'rnatish mumkin bo'lgan imkoniyatlar - keyingi versiyalarda yana ko'p qiziqarli narsalar kutilmay turibdi. Sizning fikringiz va tavsiyalaringiz bizning rivojlanishimizga yordam beradi.</p>
        <div className="mvp-timeline">
          <div className="timeline-item">
            <span className="timeline-badge">V1.0</span>
            <span className="timeline-text">Asosiy raqobat va reytinglar</span>
          </div>
          <div className="timeline-item">
            <span className="timeline-badge">V1.5</span>
            <span className="timeline-text">Jamoaviy turnirlari va hadyalar</span>
          </div>
          <div className="timeline-item">
            <span className="timeline-badge">V2.0</span>
            <span className="timeline-text">Ro'yxatdagi o'tuzini va global event</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CompetitionSection;
