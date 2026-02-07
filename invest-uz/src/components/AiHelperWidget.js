import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const facts = [
  "Reader-Overlay Kids tarjimani matn ustida ko'rsatadi, fokus yo'qolmaydi.",
  "\"Lupa\" rejimida kursor ostidagi so'zning tarjimasi chiqadi.",
  "\"Qoplama\" rejimida tarjima asl matn ustiga yumshoq tushadi.",
  'Split-view rejimida asl va tarjima yonma-yon turadi.',
  'Yordamchi faqat megaladoNN loyihasi haqida javob beradi.',
  "Platforma 8-16 yoshdagi o'quvchilar uchun mo'ljallangan.",
  "Tarjimadan tasodifiy so'zlar lug'atni mustahkamlaydi.",
  "Matnni joylang, tilni tanlang — qolganini tizim qiladi.",
  "Turli rejimlar bir matnni bir necha usulda o'qishga yordam beradi.",
  "Reader-Overlay Kids o'qishni tezroq va qiziqarliroq qiladi."
];

const quickQuestions = [
  'Loyiha nima qiladi?',
  'Qanday ishlaydi?',
  'Qaysi rejimlar bor?',
  "Kimlar uchun mo'ljallangan?"
];

const defaultGreeting =
  "Salom! Men megaladoNN IIman. Loyiha haqida savol bering, men faqat shu mavzuda javob beraman.";

const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

function sanitizeText(text) {
  return (text || '').replace(emojiRegex, '').trim();
}

function AiHelperWidget() {
  const [open, setOpen] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [messages, setMessages] = useState([{ role: 'assistant', content: defaultGreeting }]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const listRef = useRef(null);

  const currentFact = useMemo(() => facts[factIndex], [factIndex]);

  useEffect(() => {
    setFactIndex(Math.floor(Math.random() * facts.length));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFactIndex((prev) => {
        if (facts.length <= 1) return prev;
        let next = Math.floor(Math.random() * facts.length);
        if (next === prev) {
          next = (next + 1) % facts.length;
        }
        return next;
      });
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open || !listRef.current) {
      return;
    }
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, open]);

  const sendMessage = useCallback(
    async (overrideMessage) => {
      const trimmed = (overrideMessage ?? input).trim();
      if (!trimmed || status === 'loading') {
        return;
      }

      setInput('');
      setError('');
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setStatus('loading');

      try {
        const response = await fetch(`${API_BASE}/api/assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed })
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload.detail || 'Yordamchi hozircha ishlamayapti.';
          throw new Error(message);
        }

        const data = await response.json();
        const cleanedAnswer = sanitizeText(
          data.answer || "Men faqat megaladoNN loyihasi haqida javob beraman."
        );
        setMessages((prev) => [...prev, { role: 'assistant', content: cleanedAnswer }]);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err.message || 'Sorovda xatolik.');
      }
    },
    [input, status]
  );

  return (
    <div className={open ? 'ai-helper open' : 'ai-helper'}>
      <div className="ai-helper-anchor">
        <button
          type="button"
          className="ai-bubble"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          AI
        </button>
        <div className="ai-fact">{currentFact}</div>
      </div>

      {open && (
        <div className="ai-panel">
          <div className="ai-panel-head">
            <div>
              <p className="ai-title">AI megaladoNN</p>
              <p className="ai-subtitle">Faqat Reader-Overlay Kids haqida javob beraman</p>
            </div>
            <button type="button" className="ai-close" onClick={() => setOpen(false)}>
              Yopish
            </button>
          </div>
          <div className="ai-question-row">
            {quickQuestions.map((question) => (
              <button
                key={question}
                type="button"
                className="ai-question"
                onClick={() => sendMessage(question)}
                disabled={status === 'loading'}
              >
                {question}
              </button>
            ))}
          </div>
          <div className="ai-messages" ref={listRef}>
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={msg.role === 'user' ? 'ai-message user' : 'ai-message assistant'}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <div className="ai-input-row">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Loyiha haqida so'rang..."
            />
            <button type="button" className="ai-send" onClick={() => sendMessage()} disabled={status === 'loading'}>
              {status === 'loading' ? '...' : 'Yuborish'}
            </button>
          </div>
          {error && <div className="ai-error">{error}</div>}
        </div>
      )}
    </div>
  );
}

export default AiHelperWidget;
