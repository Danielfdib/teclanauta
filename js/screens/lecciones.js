/* Teclanauta — lecciones guiadas */
(function () {
  const TT = window.TT;
  TT.screens = TT.screens || {};
  const D = TT.data;

  const byId = (id) => D.lessons.find((l) => l.id === id);
  const isDone = (id) => TT.state.lessons[id] && TT.state.lessons[id].stars > 0;
  const isUnlocked = (id) => id === 1 || TT.state.settings.unlockAll || isDone(id - 1) || isDone(id);

  // Letras permitidas hasta una lección (acumulativas)
  function allowedFor(id) {
    let s = '';
    D.lessons.forEach((l) => { if (l.id <= id) s += l.add; });
    return s;
  }
  const randStr = (pool, min, max) => {
    const n = Math.floor(TT.rand(min, max + 1));
    let s = '';
    for (let i = 0; i < n; i++) s += TT.pick(pool);
    return s;
  };

  // Genera el texto de práctica de una lección
  function genText(lesson) {
    if (lesson.custom) return lesson.text;
    if (lesson.type === 'text') {
      const parts = [];
      let len = 0;
      for (const t of TT.shuffle(lesson.texts)) { parts.push(t); len += t.length + 1; if (len > 120) break; }
      return parts.join(' ');
    }
    if (lesson.type === 'fact') return TT.shuffle(D.facts).slice(0, 2).join(' ');

    const allowed = allowedFor(lesson.id);
    const letterSet = allowed.replace(/[,.]/g, '');
    const okWord = (w) => w.split('').every((c) => letterSet.includes(c));

    if (lesson.type === 'words') {
      const words = D.words.filter(okWord);
      return TT.shuffle(Array.from(new Set(words))).slice(0, 20).join(' ');
    }

    // drill
    const neu = lesson.add.split('');
    const neuLetters = neu.filter((c) => /[a-zñ]/.test(c));
    const pool = letterSet.split('');
    const tokens = [];
    neuLetters.forEach((c) => tokens.push(c.repeat(3)));
    for (let i = 0; i < 4; i++) tokens.push(randStr(neuLetters.length ? neuLetters : pool, 2, 4));
    for (let i = 0; i < 5; i++) {
      let s = '';
      const n = Math.floor(TT.rand(3, 6));
      for (let j = 0; j < n; j++) s += Math.random() < 0.5 && neuLetters.length ? TT.pick(neuLetters) : TT.pick(pool);
      tokens.push(s);
    }
    const real = TT.shuffle(Array.from(new Set(D.words.filter((w) => okWord(w) && neuLetters.some((c) => w.includes(c))))));
    if (real.length >= 3) real.slice(0, 8).forEach((w) => tokens.push(w));
    else for (let i = 0; i < 6; i++) tokens.push(randStr(pool, 2, 5));

    let out = TT.shuffle(tokens.slice(neuLetters.length));
    out = tokens.slice(0, neuLetters.length).concat(out);
    // Signos de puntuación nuevos: se pegan al final de algunas palabras
    const punct = neu.filter((c) => c === ',' || c === '.');
    if (punct.length) {
      out = out.map((t, i) => (i % 2 === 1 ? t + TT.pick(punct) : t));
    }
    return out.join(' ');
  }

  // Texto para practicar teclas débiles (desde Estadísticas)
  TT.weakLesson = (keys) => {
    const letters = keys.filter((k) => k !== ' ');
    const tokens = [];
    letters.forEach((c) => tokens.push(c.repeat(3)));
    const all = D.words.concat(D.accentWords);
    letters.forEach((c) => {
      TT.shuffle(all.filter((w) => w.includes(c))).slice(0, 4).forEach((w) => tokens.push(w));
    });
    return {
      id: 'custom', custom: true, title: 'Teclas débiles', keys: letters, goal: 15,
      intro: `Estas son las teclas donde más te equivocás: <b>${letters.map((c) => c.toUpperCase()).join(' · ')}</b>. Escribilas despacio y fijate qué dedo usar en cada una.`,
      tip: 'Repetí esta práctica algunas veces y vas a ver cómo bajan tus errores.',
      text: TT.shuffle(tokens.slice(letters.length)).reduce((a, t) => a.concat(t), tokens.slice(0, letters.length)).join(' ')
    };
  };

  function starsFor(ppm, acc, goal) {
    if (acc < 80) return 0;
    let s = 1;
    if (acc >= 90 && ppm >= goal * 0.7) s = 2;
    if (acc >= 95 && ppm >= goal) s = 3;
    return s;
  }
  const starHTML = (n, total) => Array.from({ length: total || 3 }, (_, i) => `<span class="star ${i < n ? 'on' : ''}">★</span>`).join('');

  const keycap = (c) => {
    const info = c === 'Shift' ? { key: { f: 'lp' } } : TT.charInfo(c);
    const f = info ? info.key.f : null;
    const label = c === 'Shift' ? 'Shift' : /[a-zñ]/.test(c) ? c.toUpperCase() : c;
    const finger = c === 'Shift' ? 'meñique contrario' : f ? TT.fingerNames[f] : '';
    return `<div class="keycap-big ${TT.fingerClass(f)}"><span>${TT.esc(label)}</span><small>${finger}</small></div>`;
  };

  /* ---------- Lista de lecciones ---------- */
  TT.screens.lecciones = {
    render(app) {
      const groups = {};
      D.lessons.forEach((l) => { (groups[l.group] = groups[l.group] || []).push(l); });
      const icons = { 'Fila base': '🏠', 'Fila superior': '⬆️', 'Fila inferior': '⬇️', 'Avanzado': '🚀' };
      app.innerHTML = `
        <div class="page-head">
          <button class="btn ghost" data-go="inicio">← Inicio</button>
          <div>
            <h1>Lecciones guiadas</h1>
            <p class="muted">Completá cada lección con al menos 80% de precisión para desbloquear la siguiente.</p>
          </div>
        </div>
        ${Object.keys(groups).map((g) => `
          <h2 class="section-title">${icons[g] || ''} ${g}</h2>
          <div class="lesson-grid">
            ${groups[g].map((l) => {
              const st = TT.state.lessons[l.id];
              const un = isUnlocked(l.id);
              return `<button class="lesson-card ${un ? '' : 'locked'} ${st && st.stars ? 'done' : ''}" ${un ? `data-go="leccion" data-id="${l.id}"` : 'data-locked="1"'}>
                <span class="lc-num">${un ? l.id : '🔒'}</span>
                <span class="lc-title">${l.title}</span>
                <span class="lc-keys">${(l.keys.length ? l.keys : ['abc']).map((k) => `<kbd>${TT.esc(k.length === 1 && /[a-zñ]/.test(k) ? k.toUpperCase() : k)}</kbd>`).join('')}</span>
                <span class="lc-stars">${starHTML(st ? st.stars : 0)}</span>
                ${st && st.ppm ? `<span class="lc-best">${st.ppm} PPM · ${st.acc}%</span>` : ''}
              </button>`;
            }).join('')}
          </div>`).join('')}
        <p class="center muted small unlock-line">${TT.state.settings.unlockAll ? '' : '¿Ya sabés escribir con todos los dedos? <a href="#" id="unlockAll">Desbloquear todas las lecciones</a>'}</p>`;
      app.querySelectorAll('[data-locked]').forEach((b) => b.addEventListener('click', () => {
        TT.sfx.error();
        TT.toast('<span class="toast-icon">🔒</span><div>Completá la lección anterior para desbloquear esta.</div>');
      }));
      const ua = app.querySelector('#unlockAll');
      if (ua) ua.addEventListener('click', (e) => {
        e.preventDefault();
        TT.state.settings.unlockAll = true; TT.save();
        TT.go('lecciones');
      });
    }
  };

  /* ---------- Una lección: intro → práctica → resultado ---------- */
  TT.screens.leccion = {
    render(app, params) {
      this.app = app;
      this.lesson = params.custom || byId(params.id) || D.lessons[0];
      if (!this.lesson.custom && !isUnlocked(this.lesson.id)) this.lesson = D.lessons[0];
      this.intro();
    },
    destroy() { clearInterval(this.timer); },

    intro() {
      clearInterval(this.timer);
      const l = this.lesson;
      this.mode = 'intro';
      const best = TT.state.lessons[l.id];
      this.app.innerHTML = `
        <div class="page-head">
          <button class="btn ghost" data-go="${l.custom ? 'estadisticas' : 'lecciones'}">← ${l.custom ? 'Estadísticas' : 'Lecciones'}</button>
          <div>
            <p class="eyebrow">${l.custom ? 'Práctica personalizada' : `Lección ${l.id} · ${l.group}`}</p>
            <h1>${l.title}</h1>
          </div>
          ${best ? `<div class="best-badge">${starHTML(best.stars)}<small>Mejor: ${best.ppm} PPM</small></div>` : ''}
        </div>
        <div class="intro-grid">
          <div class="panel intro-text">
            <p class="lead">${l.intro}</p>
            ${l.keys.length ? `<div class="keycaps">${l.keys.map(keycap).join('')}</div>` : ''}
            <p class="tip">💡 ${l.tip}</p>
            ${l.id === 1 ? `<p class="small muted">Colores de los dedos: <span class="chip fp">meñique</span> <span class="chip fr">anular</span> <span class="chip fm">medio</span> <span class="chip fi">índice</span> <span class="chip ft">pulgar</span></p>` : ''}
            <div class="goal">🎯 Meta para 3 estrellas: <b>${l.goal} PPM</b> y <b>95%</b> de precisión</div>
            <button class="btn primary big" id="startBtn">¡Empezar! <kbd>Enter</kbd></button>
          </div>
          <div class="panel kb-panel"><div class="kb-host"></div><div class="hands-host"></div></div>
        </div>`;
      const kb = new TT.Keyboard(this.app.querySelector('.kb-host'));
      kb.markNew(l.keys);
      const hands = new TT.Hands(this.app.querySelector('.hands-host'));
      const fingers = Array.from(new Set(l.keys.map((c) => {
        if (c === 'Shift') return 'lp';
        const i = TT.charInfo(c); return i ? i.key.f : null;
      }).filter(Boolean)));
      hands.highlight(fingers);
      if (fingers.length > 1) hands.label.innerHTML = 'Dedos que vas a usar en esta lección';
      else if (!fingers.length) hands.label.innerHTML = 'Todos los dedos en la fila base: A S D F · J K L Ñ';
      this.app.querySelector('#startBtn').addEventListener('click', () => this.play());
    },

    play() {
      const l = this.lesson;
      this.mode = 'play';
      this.app.innerHTML = `
        <div class="page-head compact">
          <button class="btn ghost" id="backIntro">← Salir <kbd>Esc</kbd></button>
          <h2>${l.custom ? '' : `Lección ${l.id}: `}${l.title}</h2>
        </div>
        <div class="live-bar panel">
          <div class="live"><span class="lv" id="lvPpm">0</span><span class="ll">PPM</span></div>
          <div class="live"><span class="lv" id="lvAcc">100%</span><span class="ll">Precisión</span></div>
          <div class="live"><span class="lv" id="lvErr">0</span><span class="ll">Errores</span></div>
          <div class="live grow"><div class="pbar big"><i id="lvProg"></i></div><span class="ll">Progreso</span></div>
        </div>
        <div class="typer-box panel" id="typerBox"></div>
        <p class="center muted small start-hint" id="startHint">Empezá a escribir cuando quieras: el reloj arranca con la primera tecla.</p>
        <div class="panel kb-panel side"><div class="kb-host"></div><div class="hands-host"></div></div>`;
      const kb = new TT.Keyboard(this.app.querySelector('.kb-host'));
      const hands = new TT.Hands(this.app.querySelector('.hands-host'));
      this.typer = new TT.Typer({
        el: this.app.querySelector('#typerBox'),
        text: genText(l),
        kb, hands,
        onChange: () => this.updateLive(),
        onDone: () => setTimeout(() => this.finish(), 350)
      });
      this.app.querySelector('#backIntro').addEventListener('click', () => this.intro());
      clearInterval(this.timer);
      this.timer = setInterval(() => this.updateLive(), 300);
    },

    updateLive() {
      if (!this.typer) return;
      const st = this.typer.stats();
      const $ = (id) => this.app.querySelector(id);
      if (!$('#lvPpm')) return;
      $('#lvPpm').textContent = Math.round(st.ppm);
      $('#lvAcc').textContent = Math.round(st.acc) + '%';
      $('#lvErr').textContent = st.errors;
      $('#lvProg').style.width = (this.typer.pos / this.typer.text.length) * 100 + '%';
      if (this.typer.start) { const h = $('#startHint'); if (h) h.style.visibility = 'hidden'; }
    },

    finish() {
      clearInterval(this.timer);
      const l = this.lesson;
      const st = this.typer.stats();
      const ppm = Math.round(st.ppm), acc = Math.round(st.acc * 10) / 10;
      const stars = starsFor(st.ppm, st.acc, l.goal);
      const S = TT.state;
      let first = false, record = false, xp = 0;
      if (!l.custom) {
        const prev = S.lessons[l.id] || { stars: 0, ppm: 0, acc: 0 };
        first = stars > 0 && !prev.stars;
        record = prev.ppm > 0 && ppm > prev.ppm && stars > 0;
        S.lessons[l.id] = { stars: Math.max(prev.stars, stars), ppm: Math.max(prev.ppm, stars > 0 ? ppm : 0), acc: Math.max(prev.acc, stars > 0 ? Math.round(acc) : 0) };
      }
      if (stars > 0) xp = stars * 25 + Math.round(st.chars / 5) + (first ? 50 : 0);
      TT.recordSession({ mode: 'leccion', ppm: st.ppm, acc: st.acc, chars: st.chars, timeMs: st.timeMs });
      if (xp) TT.addXP(xp);
      TT.checkAchievements({ acc: st.errors === 0 ? 100 : acc, chars: st.chars, streak: st.streak, practicaDebiles: l.custom && stars > 0 });
      this.mode = 'results';

      const next = !l.custom && byId(l.id + 1);
      const canNext = next && isUnlocked(next.id);
      const messages = ['¡Casi! Necesitás al menos 80% de precisión. Andá más despacio y fijate en el dedo correcto.',
        '¡Lección superada! Para más estrellas, buscá más precisión y velocidad.',
        '¡Muy bien! Te falta poquito para las 3 estrellas.',
        '¡Perfecto! Sos una máquina de escribir espacial.'];
      if (stars > 0) TT.sfx.win(); else TT.sfx.lose();

      const buttons = [];
      if (canNext && stars > 0) buttons.push({ label: `Siguiente lección →`, cls: 'primary', key: 'Enter', action: () => TT.go('leccion', { id: next.id }) });
      buttons.push({ label: '↻ Repetir', cls: canNext && stars > 0 ? '' : 'primary', key: canNext && stars > 0 ? 'R' : 'Enter', action: () => this.play() });
      buttons.push({ label: l.custom ? 'Estadísticas' : 'Lecciones', cls: 'ghost', action: () => TT.go(l.custom ? 'estadisticas' : 'lecciones') });
      this.enter = buttons[0].action;
      this.repeat = () => this.play();

      TT.results(this.app, {
        icon: stars > 0 ? '🏅' : '🛠️',
        title: stars > 0 ? `${l.custom ? 'Práctica' : 'Lección'} completada` : 'Seguí practicando',
        subtitle: messages[stars],
        top: `<div class="big-stars">${starHTML(stars)}</div>`,
        stats: [['PPM', ppm], ['Precisión', acc + '%'], ['Errores', st.errors], ['Tiempo', TT.fmtTime(st.timeMs)]],
        record,
        xp,
        buttons
      });
    },

    onKey(e) {
      if (this.mode === 'intro') {
        if (e.key === 'Enter') { this.play(); return true; }
        return false;
      }
      if (this.mode === 'play') {
        if (e.key === 'Escape') { this.intro(); return true; }
        return this.typer.handleKey(e) || e.key === ' ' || e.key === "'" || e.key === '/';
      }
      if (this.mode === 'results') {
        if (e.key === 'Enter') { this.enter(); return true; }
        if (e.key === 'r' || e.key === 'R') { this.repeat(); return true; }
      }
      return false;
    }
  };
})();
