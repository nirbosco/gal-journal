/* Book reader for Gal's stories: cover, pages, end. Page turns right-to-left like a Hebrew book.
   Usage: GalBook.open({ title, date, color, pages: [{ text, img }] })
   Navigation: tap the left side or swipe right = next page; arrows on a keypad; Escape/back closes. */
(function () {
  const PAPER = { yellow: '#ffe066', pink: '#ffa8c5', mint: '#8ce99a', sky: '#8fd3ff', lilac: '#c4b5fd', orange: '#ffc078' };
  const CSS = `
  .bk-overlay{position:fixed;inset:0;z-index:100;background:#3b2f4a;display:flex;flex-direction:column;overflow:hidden;
    background-image:radial-gradient(rgba(255,255,255,.06) 1.5px,transparent 2px);background-size:22px 22px;
    padding:calc(8px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom));font-family:'Rubik',system-ui,sans-serif;direction:rtl}
  .bk-top{display:flex;align-items:center;gap:10px;color:#fff;margin-bottom:8px}
  .bk-top .bk-name{flex:1;font-family:'Playpen Sans Hebrew','Rubik',sans-serif;font-weight:800;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .bk-top button{width:38px;height:38px;border-radius:12px;border:2px solid #fff;background:transparent;color:#fff;font-size:18px;cursor:pointer}
  .bk-count{font-size:13px;opacity:.85;min-width:44px;text-align:left}
  .bk-stage{flex:1;position:relative;perspective:1800px;display:flex;align-items:center;justify-content:center;min-height:0}
  .bk-book{position:relative;width:min(100%, calc((100vh - 150px) * .74), 560px);aspect-ratio:.74;max-height:100%}
  .bk-under,.bk-flip{position:absolute;inset:0}
  .bk-flip{transform-origin:right center;transform-style:preserve-3d;display:none;z-index:2}
  .bk-flip.on{display:block}
  .bk-front,.bk-back{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
  .bk-back{transform:rotateY(180deg);background:linear-gradient(90deg,#efe6cf,#fbf6e9 40%,#f3ead3);border-radius:6px 16px 16px 6px;box-shadow:0 8px 30px rgba(0,0,0,.35)}
  .bk-page{position:absolute;inset:0;border-radius:16px 6px 6px 16px;overflow:hidden;display:flex;flex-direction:column;
    background:#fffdf5;box-shadow:0 10px 30px rgba(0,0,0,.35),inset -14px 0 18px -12px rgba(0,0,0,.25);border:2px solid #2b2d42}
  .bk-page::after{content:"";position:absolute;top:0;bottom:0;right:0;width:10px;background:linear-gradient(90deg,transparent,rgba(0,0,0,.12))}
  .bk-lines{flex:1;min-height:0;overflow-y:auto;padding:12px 16px 4px;
    background-image:linear-gradient(transparent calc(var(--lh) - 1px),#dce8f3 calc(var(--lh) - 1px),#dce8f3 var(--lh));background-size:100% var(--lh);background-attachment:local}
  .bk-img{display:block;width:calc(100% - 24px);margin:12px 12px 0;max-height:46%;object-fit:cover;border-radius:6px;border:2px solid #2b2d42;flex:none;background:#eee}
  .bk-text{font-family:'Playpen Sans Hebrew','Rubik',sans-serif;color:#2b2d42;white-space:pre-wrap;font-size:var(--fs);line-height:var(--lh);margin:0}
  .bk-num{flex:none;text-align:center;font-family:'Playpen Sans Hebrew',sans-serif;font-size:13px;color:#8a8da8;padding:4px 0 8px}
  .bk-cover{justify-content:center;align-items:center;text-align:center;padding:20px 18px;gap:14px;background:var(--c)}
  .bk-cover h1{font-family:'Playpen Sans Hebrew','Rubik',sans-serif;font-weight:800;font-size:clamp(24px,7vw,40px);line-height:1.2;margin:0;color:#2b2d42}
  .bk-cover .bk-cimg{width:78%;aspect-ratio:1;object-fit:cover;border:5px solid #fff;outline:2px solid #2b2d42;border-radius:6px;transform:rotate(-2deg);box-shadow:0 6px 16px rgba(0,0,0,.2)}
  .bk-cover .bk-emoji{font-size:clamp(70px,24vw,120px)}
  .bk-cover .bk-by{font-family:'Playpen Sans Hebrew',sans-serif;font-size:18px;color:#2b2d42}
  .bk-cover .bk-date{font-size:13px;color:#4b4e68}
  .bk-end{justify-content:center;align-items:center;gap:12px;text-align:center}
  .bk-end .big{font-family:'Playpen Sans Hebrew',sans-serif;font-weight:800;font-size:46px;color:#2b2d42}
  .bk-end button{border:2.5px solid #2b2d42;border-radius:14px;background:#8ce99a;padding:9px 18px;font:inherit;font-weight:700;box-shadow:0 3px 0 #2b2d42;cursor:pointer}
  .bk-nav{display:flex;justify-content:space-between;gap:10px;margin-top:10px}
  .bk-nav button{flex:1;max-width:200px;border:2.5px solid #fff;border-radius:14px;background:rgba(255,255,255,.12);color:#fff;padding:9px 0;font:inherit;font-weight:700;font-size:15px;cursor:pointer}
  .bk-nav button:disabled{opacity:.3}
  .bk-hint{position:absolute;bottom:6px;left:0;right:0;text-align:center;color:#fff;font-size:12px;opacity:.7;pointer-events:none;transition:opacity .6s}
  @media (max-height:560px){.bk-top{margin-bottom:4px}.bk-top button{width:32px;height:32px;font-size:15px}.bk-nav{margin-top:6px}.bk-nav button{padding:6px 0;font-size:13px}.bk-book{width:min(100%, calc((100vh - 110px) * .74))}}
  `;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let s = null; // state of the open book

  function sizeFor(text, hasImg) {
    const n = (text || '').length, room = hasImg ? 0.55 : 1;
    const w = n / room;
    return w > 900 ? [14, 24] : w > 550 ? [15, 26] : w > 300 ? [17, 30] : [20, 34];
  }

  function render(i) {
    const p = s.items[i];
    if (p.type === 'cover') {
      const img = s.pages.find(x => x.img)?.img;
      return `<div class="bk-page bk-cover" style="--c:${PAPER[s.color] || PAPER.lilac}">
        ${img ? `<img class="bk-cimg" src="${esc(img)}" alt="">` : '<div class="bk-emoji">📖</div>'}
        <h1>${esc(s.title || 'הסיפור שלי')}</h1>
        <div class="bk-by">מאת גל</div>${s.date ? `<div class="bk-date">${esc(s.date)}</div>` : ''}</div>`;
    }
    if (p.type === 'end') {
      return `<div class="bk-page bk-end"><div class="big">סוף</div><div style="font-size:40px">✨</div>
        <button type="button" data-restart>📖 לקרוא שוב מההתחלה</button></div>`;
    }
    const [fs, lh] = sizeFor(p.text, !!p.img);
    return `<div class="bk-page">
      ${p.img ? `<img class="bk-img" src="${esc(p.img)}" alt="">` : ''}
      <div class="bk-lines" style="--fs:${fs}px;--lh:${lh}px"><p class="bk-text">${esc(p.text)}</p></div>
      <div class="bk-num">${p.n}</div></div>`;
  }

  // Shrink the text until the whole page fits (small phones like the Qin F25).
  function fit(host) {
    const box = host.querySelector('.bk-lines');
    if (!box) return;
    let fs = parseFloat(box.style.getPropertyValue('--fs'));
    while (box.scrollHeight > box.clientHeight + 2 && fs > 12) {
      fs -= 1;
      box.style.setProperty('--fs', fs + 'px');
      box.style.setProperty('--lh', Math.round(fs * 1.65) + 'px');
    }
  }
  function put(host, i) { host.innerHTML = render(i); fit(host); }

  function update() {
    put(s.under, s.i);
    s.count.textContent = `${s.i + 1}/${s.items.length}`;
    s.prev.disabled = s.i === 0;
    s.next.disabled = s.i === s.items.length - 1;
    const r = s.under.querySelector('[data-restart]');
    if (r) r.onclick = ev => { ev.stopPropagation(); s.i = 0; update(); };
  }

  function turn(dir) {
    if (!s || s.busy) return;
    const to = s.i + dir;
    if (to < 0 || to >= s.items.length) return;
    s.busy = true;
    s.hint.style.opacity = 0;
    const f = s.flip, front = s.front;
    f.style.transition = 'none';
    if (dir > 0) {
      f.style.transform = 'rotateY(0deg)';
      f.classList.add('on');
      put(front, s.i);
      put(s.under, to);
    } else {
      f.style.transform = 'rotateY(180deg)';
      f.classList.add('on');
      put(front, to);
    }
    f.classList.add('on');
    void f.offsetWidth;
    f.style.transition = 'transform .6s cubic-bezier(.45,.05,.35,1)';
    f.style.transform = dir > 0 ? 'rotateY(180deg)' : 'rotateY(0deg)';
    setTimeout(() => {
      s.i = to; update();
      f.classList.remove('on'); s.busy = false;
    }, 620);
  }

  function onKey(e) {
    if (!s) return;
    if (e.key === 'ArrowLeft' || e.key === 'Enter' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); turn(1); }
    else if (e.key === 'ArrowRight' || e.key === 'PageUp') { e.preventDefault(); turn(-1); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  }
  function onPop() { if (s) teardown(); }

  function teardown() {
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('popstate', onPop);
    s.root.remove(); document.body.style.overflow = s.prevOverflow; s = null;
  }
  function close() { if (!s) return; if (s.pushed) history.back(); else teardown(); }

  window.GalBook = {
    open(opts) {
      if (s) teardown();
      if (!document.getElementById('bk-style')) {
        const st = document.createElement('style'); st.id = 'bk-style'; st.textContent = CSS; document.head.appendChild(st);
      }
      const pages = (opts.pages || []).filter(p => (p.text || '').trim() || p.img);
      const items = [{ type: 'cover' }, ...pages.map((p, k) => ({ type: 'page', text: (p.text || '').trim(), img: p.img, n: k + 1 })), { type: 'end' }];
      const root = document.createElement('div');
      root.className = 'bk-overlay';
      root.innerHTML = `
        <div class="bk-top"><button type="button" data-close aria-label="סגירה">✕</button>
          <div class="bk-name">${esc(opts.title || 'הסיפור שלי')}</div><div class="bk-count"></div></div>
        <div class="bk-stage"><div class="bk-book">
          <div class="bk-under"></div>
          <div class="bk-flip"><div class="bk-front"></div><div class="bk-back"></div></div>
        </div><div class="bk-hint">לוחצים בצד שמאל או מחליקים ימינה כדי לדפדף</div></div>
        <div class="bk-nav"><button type="button" data-prev>→ אחורה</button><button type="button" data-next>קדימה ←</button></div>`;
      document.body.appendChild(root);
      s = {
        root, items, pages, i: 0, busy: false, title: opts.title, date: opts.date, color: opts.color,
        under: root.querySelector('.bk-under'), flip: root.querySelector('.bk-flip'), front: root.querySelector('.bk-front'),
        count: root.querySelector('.bk-count'), prev: root.querySelector('[data-prev]'), next: root.querySelector('[data-next]'),
        hint: root.querySelector('.bk-hint'), prevOverflow: document.body.style.overflow, pushed: false,
      };
      document.body.style.overflow = 'hidden';
      root.querySelector('[data-close]').onclick = close;
      s.prev.onclick = () => turn(-1);
      s.next.onclick = () => turn(1);
      const book = root.querySelector('.bk-book');
      let x0 = null, y0 = null;
      book.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      book.addEventListener('touchend', e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); turn(dx > 0 ? 1 : -1); }
      });
      book.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        const r = book.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
        if (x < 0.4) turn(1); else if (x > 0.6) turn(-1);
      });
      document.addEventListener('keydown', onKey, true);
      try { history.pushState({ galBook: 1 }, ''); s.pushed = true; window.addEventListener('popstate', onPop); } catch {}
      update();
      setTimeout(() => { if (s) s.hint.style.opacity = 0; }, 3500);
    },
    close,
  };
})();
