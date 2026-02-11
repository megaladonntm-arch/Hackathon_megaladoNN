import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../api';

const facts = [
  "Redok tarjimani matn ustida ko'rsatadi, fokus yo'qolmaydi.",
  "\"Lupa\" rejimida kursor ostidagi so'zning tarjimasi chiqadi.",
  "\"Qoplama\" rejimida tarjima asl matn ustiga yumshoq tushadi.",
  'Split-view rejimida asl va tarjima yonma-yon turadi.',
  'Yordamchi faqat megaladoNN loyihasi haqida javob beradi.',
  "Platforma 8-16 yoshdagi o'quvchilar uchun mo'ljallangan.",
  "Tarjimadan tasodifiy so'zlar lug'atni mustahkamlaydi.",
  "Matnni joylang, tilni tanlang - qolganini tizim qiladi.",
  "Turli rejimlar bir matnni bir necha usulda o'qishga yordam beradi.",
  "Redok o'qishni tezroq va qiziqarliroq qiladi.",
  "Viktorina rejimi matn bo'yicha avtomatik savollar yaratadi.",
  "AI yordamchi loyiha funksiyalarini tez tushuntirib beradi."
];

const quickQuestions = [
  'Loyiha nima qiladi?',
  'Qanday ishlaydi?',
  'Qaysi rejimlar bor?',
  "Kimlar uchun mo'ljallangan?",
  'Qaysi funksiyalar bor?',
  'Viktorina qanday ishlaydi?'
];

const defaultGreeting =
  "Salom! Men megaladoNN AI yordamchisiman. Loyiha haqida savol bering, men faqat shu mavzuda javob beraman.";

const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
const EDGE_GAP = 8;
const DEFAULT_BUBBLE_SIZE = 58;

function sanitizeText(text) {
  return (text || '').replace(emojiRegex, '').trim();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function AiHelperWidget() {
  const [open, setOpen] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [messages, setMessages] = useState([{ role: 'assistant', content: defaultGreeting }]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(null);
  const listRef = useRef(null);
  const helperRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressClickRef = useRef(false);

  const currentFact = useMemo(() => facts[factIndex], [factIndex]);

  const clampPosition = useCallback((x, y) => {
    const rect = helperRef.current?.getBoundingClientRect();
    const width = rect?.width || DEFAULT_BUBBLE_SIZE;
    const height = rect?.height || DEFAULT_BUBBLE_SIZE;
    const maxX = Math.max(EDGE_GAP, window.innerWidth - width - EDGE_GAP);
    const maxY = Math.max(EDGE_GAP, window.innerHeight - height - EDGE_GAP);
    return {
      x: clamp(x, EDGE_GAP, maxX),
      y: clamp(y, EDGE_GAP, maxY)
    };
  }, []);

  useEffect(() => {
    setFactIndex(Math.floor(Math.random() * facts.length));
  }, []);

  useEffect(() => {
    const initialX = Math.max(
      EDGE_GAP,
      window.innerWidth - DEFAULT_BUBBLE_SIZE - 22
    );
    const initialY = clamp(window.innerHeight * 0.18, 84, 140);
    setPosition(clampPosition(initialX, initialY));
  }, [clampPosition]);

  useEffect(() => {
    if (!position) return;
    const onResize = () => {
      setPosition((prev) => (prev ? clampPosition(prev.x, prev.y) : prev));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [position, clampPosition]);

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
        const data = await apiFetch('/api/assistant', {
          method: 'POST',
          body: JSON.stringify({ message: trimmed })
        });
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

  const handlePointerDown = useCallback(
    (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      const fallbackX = Math.max(EDGE_GAP, window.innerWidth - DEFAULT_BUBBLE_SIZE - 22);
      const fallbackY = clamp(window.innerHeight * 0.18, 84, 140);
      const origin = position || clampPosition(fallbackX, fallbackY);
      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: origin.x,
        originY: origin.y,
        moved: false
      };
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [position, clampPosition]
  );

  const handlePointerMove = useCallback(
    (event) => {
      const state = dragStateRef.current;
      if (!state || state.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;
      if (!state.moved && Math.hypot(deltaX, deltaY) > 3) {
        state.moved = true;
      }
      const next = clampPosition(state.originX + deltaX, state.originY + deltaY);
      setPosition(next);
    },
    [clampPosition]
  );

  const stopDrag = useCallback((event) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    suppressClickRef.current = state.moved;
    dragStateRef.current = null;
    setIsDragging(false);
  }, []);

  const toggleOpen = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setOpen((prev) => !prev);
  }, []);

  return (
    <div
      ref={helperRef}
      className={`${open ? 'ai-helper open' : 'ai-helper'}${isDragging ? ' dragging' : ''}`}
      style={
        position
          ? {
              top: `${position.y}px`,
              left: `${position.x}px`,
              right: 'auto'
            }
          : undefined
      }
    >
      <div className="ai-helper-anchor">
        <div className="ai-plaque">
          <button
            type="button"
            className="ai-bubble"
            onClick={toggleOpen}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            aria-expanded={open}
          >
            AI
          </button>
          <div className="ai-fact">{currentFact}</div>
        </div>
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
