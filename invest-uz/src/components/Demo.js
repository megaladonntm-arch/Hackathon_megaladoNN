import { useCallback, useEffect, useRef, useState } from 'react';

function Demo() {
  const overlayRef = useRef(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const renderOverlay = (text) => {
    const win = overlayRef.current;
    if (!win || win.closed) {
      return;
    }
    const target = win.document.getElementById('overlay-text');
    if (target) {
      target.textContent = text || 'Matndan parcha tanlanganda bu yerda ko‘rinadi.';
    }
  };

  const openOverlay = () => {
    if (overlayRef.current && !overlayRef.current.closed) {
      overlayRef.current.focus();
      return;
    }
    const win = window.open('', 'readerOverlay', 'width=360,height=480,top=120,left=120');
    if (!win) {
      return;
    }
    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Reader-Overlay</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&display=swap" />
          <style>
            :root { color-scheme: dark; }
            body { margin: 0; font-family: 'Sora', sans-serif; background: #0b0f14; color: #e9eef3; }
            .wrap { padding: 20px; display: grid; gap: 16px; }
            .title { font-weight: 700; font-size: 18px; letter-spacing: 0.02em; }
            .box { background: #121820; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px; min-height: 240px; line-height: 1.5; }
            .hint { color: rgba(233,238,243,0.6); font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="title">Reader-Overlay</div>
            <div id="overlay-text" class="box">Matndan parcha tanlanganda bu yerda ko‘rinadi.</div>
            <div class="hint">Main oynadagi matndan parcha tanlang.</div>
          </div>
        </body>
      </html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
    overlayRef.current = win;
    setOverlayOpen(true);
    renderOverlay(selectedText);
    win.addEventListener('beforeunload', () => setOverlayOpen(false));
  };

  const handleSelection = useCallback(() => {
    const text = window.getSelection()?.toString() || '';
    setSelectedText(text);
    renderOverlay(text);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [handleSelection]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (overlayRef.current && overlayRef.current.closed) {
        overlayRef.current = null;
        setOverlayOpen(false);
      }
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="page demo">
      <section className="demo-hero">
        <div>
          <h1>Demo</h1>
          <p className="muted">Overlay oynasini oching va matndan parcha tanlab ko‘ring.</p>
        </div>
        <button className="primary-btn" onClick={openOverlay}>Overlayni ochish</button>
      </section>

      <section className="demo-grid">
        <div className="demo-reader">
          <h2>Matn</h2>
          <p>
            Reading foreign texts becomes easier when translation or context appears next to your line of sight. Select any sentence in
            this paragraph to see the overlay update. This keeps your focus on the meaning instead of switching tabs.
          </p>
          <p>
            Reader-Overlay works great for learning, research, and fast comprehension. Highlight a few words and the companion window
            instantly mirrors your selection.
          </p>
        </div>
        <div className="demo-selection">
          <h2>Tanlangan parcha</h2>
          <div className="selection-box">{selectedText || 'Hozircha hech narsa tanlanmadi.'}</div>
          <div className="status">
            <span className={overlayOpen ? 'dot on' : 'dot'}></span>
            <p>{overlayOpen ? 'Overlay ochiq' : 'Overlay yopiq'}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Demo;
