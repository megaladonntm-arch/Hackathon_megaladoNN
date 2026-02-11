import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { apiFetch } from '../api';

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' },
  { value: 'uz', label: 'Uzbek' },
  { value: 'tr', label: 'Turkish' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' }
];

const MODE_MAGNIFIER = 'magnifier';
const MODE_OVERLAY = 'overlay';
const MODE_SPLIT = 'split';

const defaultText =
  "Chet tilini o'qish tarjima aynan kerak joyda paydo bo'lsa, ancha osonlashadi. " +
  "Lupani istalgan so'z yoki ibora ustiga olib borsangiz, ma'no darhol ko'rinadi va diqqat chalg'imaydi. " +
  "Shuningdek, qatlamli yoki bo'lingan rejimlarga o'tib, kontekst bilan o'qishingiz mumkin.";

function Demo() {
  const { isAuthed, token } = useAuth();
  const navigate = useNavigate();
  const stageRef = useRef(null);

  const [inputText, setInputText] = useState(defaultText);
  const [targetLang, setTargetLang] = useState('ru');
  const [mode, setMode] = useState(MODE_MAGNIFIER);
  const [translatedText, setTranslatedText] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [randomCount, setRandomCount] = useState(5);
  const [randomWords, setRandomWords] = useState([]);
  const [randomTotal, setRandomTotal] = useState(0);
  const [randomStatus, setRandomStatus] = useState('idle');
  const [randomError, setRandomError] = useState('');
  const [lensState, setLensState] = useState({
    x: 0,
    y: 0,
    visible: false,
    word: '',
    text: ''
  });

  const canTranslate = inputText.trim().length > 0;

  const modeLabel = useMemo(() => {
    if (mode === MODE_MAGNIFIER) return '1-rejim: Lupa';
    if (mode === MODE_OVERLAY) return '2-rejim: Qatlamli';
    return "3-rejim: Bo'lingan";
  }, [mode]);

  const sourceTokens = useMemo(() => inputText.match(/\S+/g) || [], [inputText]);
  const translatedTokens = useMemo(() => translatedText.match(/\S+/g) || [], [translatedText]);

  const translateText = useCallback(async (text, language) => {
    const data = await apiFetch('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text, target_language: language })
    }, token);
    return data.translated_text || '';
  }, [token]);

  const handleTranslate = useCallback(async () => {
    if (!canTranslate) {
      return;
    }
    setStatus('loading');
    setError('');
    try {
      const result = await translateText(inputText, targetLang);
      setTranslatedText(result);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Translation failed.');
    }
  }, [canTranslate, inputText, targetLang, translateText]);

  const handleRandomWords = useCallback(async () => {
    if (!translatedText.trim()) {
      setRandomError('Avval tarjimani oling.');
      setRandomWords([]);
      setRandomTotal(0);
      return;
    }
    setRandomStatus('loading');
    setRandomError('');
    try {
      const data = await apiFetch('/api/random-words', {
        method: 'POST',
        body: JSON.stringify({ text: translatedText, count: Number(randomCount) || 1 })
      });
      setRandomWords(data.random_words || []);
      setRandomTotal(data.word_count || 0);
      setRandomStatus('success');
    } catch (err) {
      setRandomStatus('error');
      setRandomError(err.message || "So'rovda xatolik.");
    }
  }, [randomCount, translatedText]);

  const updateLens = useCallback(
    (event) => {
      const stage = stageRef.current;
      if (!stage) {
        return;
      }
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const wordEl = target && target.closest('[data-word-index]');
      if (!wordEl || !stage.contains(wordEl)) {
        setLensState((prev) => ({ ...prev, visible: false }));
        return;
      }

      const index = Number(wordEl.dataset.wordIndex || 0);
      const originalWord = sourceTokens[index] || '';
      const translatedWord = translatedTokens[index] || '';

      setLensState({
        x: event.clientX,
        y: event.clientY,
        visible: true,
        word: originalWord,
        text: translatedWord || (translatedText ? "Tarjima yo'q" : "«Tarjima qilish» ni bosing")
      });
    },
    [sourceTokens, translatedTokens, translatedText]
  );

  return (
    <main className="page demo">
      {!isAuthed ? (
        <section className="section auth-gate">
          <div className="auth-gate-content">
            <h1>Demo uchun kirish kerak</h1>
            <p className="muted">
              Demo imkoniyatlarini ko'rish uchun ro'yxatdan o'ting yoki tizimga kiring.
            </p>
            <div className="auth-gate-actions">
              <button className="primary-btn" type="button" onClick={() => navigate('/auth')}>
                Kirish / Ro'yxatdan o'tish
              </button>
              <button className="ghost-btn" type="button" onClick={() => navigate('/')}>
                Bosh sahifa
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {isAuthed ? (
        <section className="demo-hero">
          <div>
            <h1>Demo</h1>
            <p className="muted">Matnni bir marta tarjima qilamiz va lupaning ichida ko'rsatamiz.</p>
          </div>
          <div className="mode-pill">{modeLabel}</div>
        </section>
      ) : null}

      {isAuthed ? (
        <section className="demo-controls panel">
          <div className="control-row">
            <label htmlFor="demo-text">Tarjima uchun matn</label>
            <p className="muted">Matnni shu yerga joylang.</p>
            <textarea
              id="demo-text"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Tarjima uchun matn kiriting"
            />
          </div>
          <div className="control-row">
            <label htmlFor="demo-lang">Tarjima tili</label>
            <select
              id="demo-lang"
              value={targetLang}
              onChange={(event) => setTargetLang(event.target.value)}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="control-actions">
            <button className="primary-btn" onClick={handleTranslate} disabled={!canTranslate || status === 'loading'}>
              {status === 'loading' ? 'Tarjima...' : 'Tarjima qilish'}
            </button>
            <button
              className="ghost-btn"
              onClick={() => {
                setInputText('');
                setTranslatedText('');
                setStatus('idle');
                setError('');
                setLensState((prev) => ({ ...prev, visible: false, word: '', text: '' }));
                setRandomWords([]);
                setRandomTotal(0);
                setRandomStatus('idle');
                setRandomError('');
              }}
            >
              Tozalash
            </button>
            {error && <span className="error-text">{error}</span>}
          </div>
          <div className="random-words">
            <div className="random-words-head">
              <p className="muted">Tarjimadan tasodifiy so'zlar</p>
              {randomTotal > 0 && (
                <span className="random-total">Jami so'zlar: {randomTotal}</span>
              )}
            </div>
            <div className="random-words-controls">
              <input
                type="number"
                min="1"
                max="500"
                value={randomCount}
                onChange={(event) => setRandomCount(event.target.value)}
              />
              <button className="ghost-btn" onClick={handleRandomWords} disabled={randomStatus === 'loading'}>
                {randomStatus === 'loading' ? 'Hisoblayapman...' : "So'zlarni ko'rsatish"}
              </button>
              {randomError && <span className="error-text">{randomError}</span>}
            </div>
            <div className="random-words-list">
              {(randomWords.length ? randomWords : ["Ma'lumot yo'q"]).map((word, index) => (
                <span key={`${word}-${index}`} className="random-chip">
                  {word}
                </span>
              ))}
            </div>
          </div>
          <div className="mode-switch">
            <button
              type="button"
              className={mode === MODE_MAGNIFIER ? 'mode-chip active' : 'mode-chip'}
              onClick={() => setMode(MODE_MAGNIFIER)}
            >
              1. Lupa-kursor
            </button>
            <button
              type="button"
              className={mode === MODE_OVERLAY ? 'mode-chip active' : 'mode-chip'}
              onClick={() => setMode(MODE_OVERLAY)}
            >
              2. Tarjima qatlamda
            </button>
            <button
              type="button"
              className={mode === MODE_SPLIT ? 'mode-chip active' : 'mode-chip'}
              onClick={() => setMode(MODE_SPLIT)}
            >
              3. Bo'lingan ko'rinish
            </button>
          </div>
        </section>
      ) : null}

      {isAuthed && mode === MODE_MAGNIFIER && (
        <section className="magnifier">
          <div className="section-head">
            <h2>1-rejim: Kursor o'rnida lupa</h2>
            <p>Avval butun matnni tarjima qiling, so'ng lupani so'z ustiga olib boring.</p>
          </div>
          <div
            ref={stageRef}
            className="magnifier-stage"
            onMouseMove={updateLens}
            onMouseLeave={() => setLensState((prev) => ({ ...prev, visible: false }))}
          >
            <div className="magnifier-text">
              {(sourceTokens.length ? sourceTokens : ['Yuqoriga', 'matn', 'kiriting']).map((token, index) => (
                <span key={`${token}-${index}`} data-word-index={index}>
                  {token}{' '}
                </span>
              ))}
            </div>
            <div
              className={lensState.visible ? 'magnifier-lens show' : 'magnifier-lens'}
              style={{
                left: lensState.x,
                top: lensState.y
              }}
            >
              <div className="lens-title">{lensState.word || 'Tarjima'}</div>
              <div className="lens-body">
                {lensState.text || "So'z ustiga olib boring"}
              </div>
            </div>
          </div>
        </section>
      )}

      {isAuthed && mode === MODE_OVERLAY && (
        <section className="overlay-mode">
          <div className="section-head">
            <h2>2-rejim: Tarjima ikkinchi qatlamda</h2>
            <p>Asl matn asosiy bo'lib qoladi, tarjima ustiga yumshoq tushadi.</p>
          </div>
          <div className="overlay-stage">
            <div className="overlay-original">{inputText || 'Yuqoriga matn kiriting'}</div>
            <div className="overlay-translation">{translatedText || "Avval «Tarjima qilish» ni bosing"}</div>
          </div>
        </section>
      )}

      {isAuthed && mode === MODE_SPLIT && (
        <section className="split-mode">
          <div className="section-head">
            <h2>3-rejim: Ikki ustun</h2>
            <p>Xotirjam o'qish va solishtirish uchun klassik bo'linish.</p>
          </div>
          <div className="split-panels">
            <div className="split-panel">
              <h3>Asl matn</h3>
              <p>{inputText || 'Yuqoriga matn kiriting'}</p>
            </div>
            <div className="split-panel">
              <h3>Tarjima</h3>
              <p>{translatedText || "Avval «Tarjima qilish» ni bosing"}</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default Demo;
