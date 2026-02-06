import { useCallback, useMemo, useRef, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

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
  'Reading a foreign language becomes effortless when translation appears exactly where you need it. ' +
  'Move the magnifier over any word or phrase to instantly see the meaning without breaking focus. ' +
  'You can also switch to layered or split modes to read with context.';

function Demo() {
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
    if (mode === MODE_MAGNIFIER) return 'Mode 1: Magnifier';
    if (mode === MODE_OVERLAY) return 'Mode 2: Layered';
    return 'Mode 3: Split';
  }, [mode]);

  const sourceTokens = useMemo(() => inputText.match(/\S+/g) || [], [inputText]);
  const translatedTokens = useMemo(() => translatedText.match(/\S+/g) || [], [translatedText]);

  const translateText = useCallback(async (text, language) => {
    const response = await fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_language: language })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = payload.detail || 'Translation failed.';
      throw new Error(message);
    }

    const data = await response.json();
    return data.translated_text || '';
  }, []);

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
      setRandomError('Сначала получите перевод.');
      setRandomWords([]);
      setRandomTotal(0);
      return;
    }
    setRandomStatus('loading');
    setRandomError('');
    try {
      const response = await fetch(`${API_BASE}/api/random-words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: translatedText, count: Number(randomCount) || 1 })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload.detail || 'Не удалось получить случайные слова.';
        throw new Error(message);
      }
      const data = await response.json();
      setRandomWords(data.random_words || []);
      setRandomTotal(data.word_count || 0);
      setRandomStatus('success');
    } catch (err) {
      setRandomStatus('error');
      setRandomError(err.message || 'Ошибка запроса.');
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
        text: translatedWord || (translatedText ? 'Нет перевода' : 'Нажмите «Перевести»')
      });
    },
    [sourceTokens, translatedTokens, translatedText]
  );

  return (
    <main className="page demo">
      <section className="demo-hero">
        <div>
          <h1>Demo</h1>
          <p className="muted">Переводим весь текст один раз и показываем перевод в лупе.</p>
        </div>
        <div className="mode-pill">{modeLabel}</div>
      </section>

      <section className="demo-controls panel">
        <div className="control-row">
          <label htmlFor="demo-text">Текст для перевода</label>
          <textarea
            id="demo-text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="Вставьте текст для перевода"
          />
        </div>
        <div className="control-row">
          <label htmlFor="demo-lang">Язык перевода</label>
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
            {status === 'loading' ? 'Перевод...' : 'Перевести'}
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
            Очистить
          </button>
          {error && <span className="error-text">{error}</span>}
        </div>
        <div className="random-words">
          <div className="random-words-head">
            <p className="muted">Случайные слова из перевода</p>
            {randomTotal > 0 && (
              <span className="random-total">Всего слов: {randomTotal}</span>
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
              {randomStatus === 'loading' ? 'Считаю...' : 'Показать слова'}
            </button>
            {randomError && <span className="error-text">{randomError}</span>}
          </div>
          <div className="random-words-list">
            {(randomWords.length ? randomWords : ['Нет данных']).map((word, index) => (
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
            1. Лупа-курсор
          </button>
          <button
            type="button"
            className={mode === MODE_OVERLAY ? 'mode-chip active' : 'mode-chip'}
            onClick={() => setMode(MODE_OVERLAY)}
          >
            2. Перевод на слое
          </button>
          <button
            type="button"
            className={mode === MODE_SPLIT ? 'mode-chip active' : 'mode-chip'}
            onClick={() => setMode(MODE_SPLIT)}
          >
            3. Split-view
          </button>
        </div>
      </section>

      {mode === MODE_MAGNIFIER && (
        <section className="magnifier">
          <div className="section-head">
            <h2>Режим 1: Лупа вместо курсора</h2>
            <p>Сначала переведи весь текст, затем наведи лупу на слово.</p>
          </div>
          <div
            ref={stageRef}
            className="magnifier-stage"
            onMouseMove={updateLens}
            onMouseLeave={() => setLensState((prev) => ({ ...prev, visible: false }))}
          >
            <div className="magnifier-text">
              {(sourceTokens.length ? sourceTokens : ['Введите', 'текст', 'выше']).map((token, index) => (
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
              <div className="lens-title">{lensState.word || 'Перевод'}</div>
              <div className="lens-body">
                {lensState.text || 'Наведите на слово'}
              </div>
            </div>
          </div>
        </section>
      )}

      {mode === MODE_OVERLAY && (
        <section className="overlay-mode">
          <div className="section-head">
            <h2>Режим 2: Перевод на втором слое</h2>
            <p>Оригинал остается основным, перевод мягко накладывается поверх.</p>
          </div>
          <div className="overlay-stage">
            <div className="overlay-original">{inputText || 'Введите текст выше'}</div>
            <div className="overlay-translation">{translatedText || 'Сначала нажмите «Перевести»'}</div>
          </div>
        </section>
      )}

      {mode === MODE_SPLIT && (
        <section className="split-mode">
          <div className="section-head">
            <h2>Режим 3: Два столбца</h2>
            <p>Классическое разделение для спокойного чтения и сверки.</p>
          </div>
          <div className="split-panels">
            <div className="split-panel">
              <h3>Оригинал</h3>
              <p>{inputText || 'Введите текст выше'}</p>
            </div>
            <div className="split-panel">
              <h3>Перевод</h3>
              <p>{translatedText || 'Сначала нажмите «Перевести»'}</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default Demo;
