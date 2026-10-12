/* Teclanauta — "Carrera espacial" contra rivales y "Contrarreloj" de 60 segundos */
(function () {
  const TT = window.TT;
  TT.screens = TT.screens || {};
  const D = TT.data;

  const LEVELS = [
    { id: 'novato', name: 'Novato', ppm: [8, 12, 16], desc: 'Rivales a 8, 12 y 16 PPM' },
    { id: 'piloto', name: 'Piloto', ppm: [15, 22, 28], desc: 'Rivales a 15, 22 y 28 PPM' },
    { id: 'experto', name: 'Experto', ppm: [25, 35, 45], desc: 'Rivales a 25, 35 y 45 PPM' }
  ];
  const RIVALS = [
    { name: 'Robotín', icon: '🤖' },
    { name: 'Zork', icon: '👾' },
    { name: 'Capitana Nova', icon: '🛸' }
  ];
  const TEXTS = [
    { id: 'palabras', name: 'Palabras sueltas', desc: 'Solo minúsculas, sin signos' },
    { id: 'datos', name: 'Datos curiosos', desc: 'Oraciones con mayúsculas, tildes y signos' }
  ];
  const DURATION = 60000;

  const plainWords = () => Array.from(new Set(D.words.concat(D.gameWords.easy, D.gameWords.mid))).filter((w) => /^[a-zñ]+$/.test(w));
  function wordsText(minLen) {
    const pool = plainWords();
    const out = [];
    let len = 0;
    while (len < minLen) { const w = TT.pick(pool); out.push(w); len += w.length + 1; }
    return out.join(' ');
  }
  function factsText(minLen) {
    const out = [];
    let len = 0;
    for (const f of TT.shuffle(D.facts)) { out.push(f); len += f.length + 1; if (len >= minLen) break; }
    return out.join(' ');
  }

  TT.screens.carrera = {
    kind: 'carrera',
    level: 'piloto',
    textType: 'palabras',

    render(app) { this.app = app; this.setup(); },
    destroy() { this.stopLoops(); },
    stopLoops() { cancelAnimationFrame(this.raf); clearTimeout(this.cdT); this.running = false; },

    setup() {
      this.stopLoops();
      this.mode = 'setup';
      const S = TT.state;
      this.app.innerHTML = `
        <div class="page-head">
          <button class="btn ghost" data-go="inicio">← Inicio</button>
          <div><p class="eyebrow">Misión</p><h1>🏁 Carrera espacial</h1></div>
          <div class="best-badge"><small>Victorias · Contrarreloj</small><b>${S.records.carreraVictorias} · ${S.records.contrarreloj} PPM</b></div>
        </div>
        <div class="tabs">
          <button class="tab ${this.kind === 'carrera' ? 'on' : ''}" data-kind="carrera">🚀 Carrera contra rivales</button>
          <button class="tab ${this.kind === 'reloj' ? 'on' : ''}" data-kind="reloj">⏱️ Contrarreloj 60 s</button>
        </div>
        <div class="setup-grid">
          <div class="panel">
            <h3>¿Cómo se juega?</h3>
            ${this.kind === 'carrera' ? `
            <ol class="howto">
              <li>Tu nave 🚀 avanza con cada letra correcta. Llegá a la meta 🏁 antes que las naves rivales.</li>
              <li>Si te equivocás, la letra se marca en rojo y tenés que escribir la correcta para seguir.</li>
              <li>Ganar contra rivales más rápidos te da más experiencia.</li>
            </ol>` : `
            <ol class="howto">
              <li>Tenés <b>60 segundos</b> para escribir todas las palabras que puedas.</li>
              <li>El reloj arranca con tu primera tecla.</li>
              <li>Tu resultado son tus <b>PPM</b>: palabras por minuto. ¡Superá tu récord!</li>
            </ol>`}
          </div>
          <div class="panel">
            ${this.kind === 'carrera' ? `
              <h3>Rivales</h3>
              <div class="chips" id="levels">${LEVELS.map((l) => `<button class="chip-btn ${l.id === this.level ? 'on' : ''}" data-level="${l.id}"><b>${l.name}</b><small>${l.desc}</small></button>`).join('')}</div>` : ''}
            <h3>Texto</h3>
            <div class="chips" id="texts">${TEXTS.map((t) => `<button class="chip-btn ${t.id === this.textType ? 'on' : ''}" data-text="${t.id}"><b>${t.name}</b><small>${t.desc}</small></button>`).join('')}</div>
            <label class="switch"><input type="checkbox" id="kbToggle" ${TT.state.settings.keyboard ? 'checked' : ''}> Mostrar teclado de ayuda</label>
            <button class="btn primary big" id="go">${this.kind === 'carrera' ? '🏁 ¡A la pista!' : '⏱️ Empezar'} <kbd>Enter</kbd></button>
          </div>
        </div>`;
      const sel = (attr, key) => this.app.querySelectorAll(`[data-${attr}]`).forEach((b) => b.addEventListener('click', () => {
        this[key] = b.dataset[attr]; TT.sfx.click();
        if (attr === 'kind') return this.setup();
        this.app.querySelectorAll(`[data-${attr}]`).forEach((x) => x.classList.toggle('on', x === b));
      }));
      sel('kind', 'kind'); sel('level', 'level'); sel('text', 'textType');
      this.app.querySelector('#kbToggle').addEventListener('change', (e) => { TT.state.settings.keyboard = e.target.checked; TT.save(); });
      this.app.querySelector('#go').addEventListener('click', () => this.begin());
    },

    begin() { if (this.kind === 'carrera') this.beginRace(); else this.beginClock(); },

    kbHTML() { return TT.state.settings.keyboard ? '<div class="panel kb-panel compact"><div class="kb-host"></div><div class="hands-host"></div></div>' : ''; },
    mountTyper(text, opts) {
      let kb = null, hands = null;
      const host = this.app.querySelector('.kb-host');
      if (host) { kb = new TT.Keyboard(host, { small: true }); hands = new TT.Hands(this.app.querySelector('.hands-host')); }
      this.typer = new TT.Typer(Object.assign({ el: this.app.querySelector('#typerBox'), text, kb, hands, caseInsensitive: false }, opts));
    },

    /* ---------- Carrera ---------- */
    beginRace() {
      this.stopLoops();
      this.mode = 'countdown';
      const lv = LEVELS.find((l) => l.id === this.level);
      const minLen = Math.max(130, lv.ppm[1] * 6);
      const text = this.textType === 'datos' ? factsText(minLen) : wordsText(minLen);
      this.rivals = RIVALS.map((r, i) => ({ ...r, ppm: lv.ppm[i] }));
      this.app.innerHTML = `
        <div class="race panel">
          ${[{ name: 'Vos', icon: '🚀', me: true }].concat(this.rivals).map((r, i) => `
            <div class="lane ${r.me ? 'me' : ''}">
              <div class="lane-name">${r.me ? '<b>Vos</b>' : `${r.name}<small>${r.ppm} PPM</small>`}</div>
              <div class="lane-road"><div class="racer ${r.me ? 'rocket' : ''}" id="racer${i}">${r.icon}</div><div class="finish">🏁</div></div>
            </div>`).join('')}
        </div>
        <div class="live-bar panel">
          <div class="live"><span class="lv" id="lvTime">0,0</span><span class="ll">Segundos</span></div>
          <div class="live"><span class="lv" id="lvPpm">0</span><span class="ll">PPM</span></div>
          <div class="live"><span class="lv" id="lvAcc">100%</span><span class="ll">Precisión</span></div>
          <div class="live"><span class="lv" id="lvPos">—</span><span class="ll">Puesto</span></div>
          <button class="btn ghost small" id="quit">Salir <kbd>Esc</kbd></button>
        </div>
        <div class="typer-box panel" id="typerBox"></div>
        ${this.kbHTML()}
        <div class="countdown" id="cd"></div>`;
      this.app.querySelector('#quit').addEventListener('click', () => this.setup());
      this.mountTyper(text, { autoStart: false, onDone: () => this.raceEnd() });
      this.countdown(() => {
        this.mode = 'race';
        this.typer.begin();
        this.running = true;
        this.raf = requestAnimationFrame(() => this.raceLoop());
      });
    },

    countdown(then) {
      const cd = this.app.querySelector('#cd');
      let n = 3;
      const step = () => {
        if (n > 0) {
          cd.textContent = n; cd.className = 'countdown show'; TT.sfx.beep();
          n--; this.cdT = setTimeout(step, 750);
        } else {
          cd.textContent = '¡YA!'; cd.className = 'countdown show go'; TT.sfx.go();
          this.cdT = setTimeout(() => { cd.className = 'countdown'; }, 600);
          then();
        }
      };
      step();
    },

    rivalProgress(r, ms) {
      return Math.min(1, ((ms / 60000) * r.ppm * 5) / this.typer.text.length);
    },

    raceLoop() {
      if (!this.running) return;
      const ms = this.typer.elapsed();
      const me = this.typer.pos / this.typer.text.length;
      const setX = (i, p) => { const el = this.app.querySelector('#racer' + i); if (el) el.style.left = `calc(${p * 100}% - ${p * 34}px)`; };
      setX(0, me);
      let ahead = 0;
      this.rivals.forEach((r, i) => { const p = this.rivalProgress(r, ms); setX(i + 1, p); if (p > me) ahead++; });
      const st = this.typer.stats();
      const $ = (id) => this.app.querySelector(id);
      $('#lvTime').textContent = (ms / 1000).toFixed(1).replace('.', ',');
      $('#lvPpm').textContent = Math.round(st.ppm);
      $('#lvAcc').textContent = Math.round(st.acc) + '%';
      $('#lvPos').textContent = `${ahead + 1}°`;
      if (ms > 180000) { this.raceEnd(true); return; }
      this.raf = requestAnimationFrame(() => this.raceLoop());
    },

    raceEnd(timeout) {
      if (this.mode !== 'race') return;
      this.typer.finish();
      this.stopLoops();
      this.mode = 'results';
      const st = this.typer.stats();
      const len = this.typer.text.length;
      const myMin = st.timeMs / 60000;
      const place = timeout ? 4 : 1 + this.rivals.filter((r) => len / (r.ppm * 5) < myMin).length;
      const S = TT.state;
      if (place === 1) S.records.carreraVictorias++;
      TT.recordSession({ mode: 'carrera', ppm: st.ppm, acc: st.acc, chars: st.chars, timeMs: st.timeMs });
      const mult = { novato: 1, piloto: 1.5, experto: 2 }[this.level];
      const xp = TT.addXP(((5 - place) * 30 + st.ppm * 2) * mult);
      TT.checkAchievements({ acc: Math.round(st.acc), chars: st.chars, streak: st.streak, ganoExperto: place === 1 && this.level === 'experto' });
      if (place === 1) TT.sfx.win(); else TT.sfx.lose();
      const medal = ['🥇', '🥈', '🥉', '🏅'][place - 1];
      const podium = [{ name: 'Vos', icon: '🚀', t: myMin, me: true }]
        .concat(this.rivals.map((r) => ({ name: r.name, icon: r.icon, t: len / (r.ppm * 5) })))
        .sort((a, b) => a.t - b.t);
      const fact = this.textType === 'datos' ? `<p class="fact">🧠 <b>¿Sabías que…?</b> ${TT.esc(this.typer.text)}</p>` : '';
      this.enter = () => this.beginRace();
      TT.results(this.app, {
        icon: medal,
        title: place === 1 ? '¡Ganaste la carrera!' : `Llegaste en el puesto ${place}°`,
        subtitle: place === 1 ? 'Ninguna nave pudo alcanzarte.' : `Para ganar necesitás más de ${Math.max(...this.rivals.map((r) => r.ppm))} PPM. ¡Vos podés!`,
        top: `<ol class="podium">${podium.map((p, i) => `<li class="${p.me ? 'me' : ''}"><span>${i + 1}°</span> ${p.icon} ${p.name} <small>${(p.t * 60).toFixed(1).replace('.', ',')} s</small></li>`).join('')}</ol>`,
        stats: [['PPM', Math.round(st.ppm)], ['Precisión', Math.round(st.acc) + '%'], ['Tiempo', TT.fmtTime(st.timeMs)]],
        xp,
        extra: fact,
        buttons: [
          { label: '↻ Revancha', cls: 'primary', key: 'Enter', action: () => this.beginRace() },
          { label: 'Cambiar rivales', action: () => this.setup() },
          { label: 'Inicio', cls: 'ghost', action: () => TT.go('inicio') }
        ]
      });
    },

    /* ---------- Contrarreloj ---------- */
    beginClock() {
      this.stopLoops();
      this.mode = 'clock';
      const text = this.textType === 'datos' ? factsText(600) : wordsText(500);
      this.app.innerHTML = `
        <div class="clock-head panel">
          <div class="clock-ring"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="52"/><circle class="fg" id="ring" cx="60" cy="60" r="52"/></svg><span id="clockNum">60</span></div>
          <div class="live"><span class="lv" id="lvPpm">0</span><span class="ll">PPM</span></div>
          <div class="live"><span class="lv" id="lvAcc">100%</span><span class="ll">Precisión</span></div>
          <div class="live"><span class="lv" id="lvWords">0</span><span class="ll">Palabras</span></div>
          <button class="btn ghost small" id="quit">Salir <kbd>Esc</kbd></button>
        </div>
        <div class="typer-box panel" id="typerBox"></div>
        <p class="center muted small" id="startHint">El reloj arranca con tu primera tecla.</p>
        ${this.kbHTML()}`;
      this.app.querySelector('#quit').addEventListener('click', () => this.setup());
      this.mountTyper(text, { onDone: () => this.clockEnd() });
      this.running = true;
      this.raf = requestAnimationFrame(() => this.clockLoop());
    },

    clockLoop() {
      if (!this.running) return;
      const t = this.typer;
      const ms = t.elapsed();
      const left = Math.max(0, DURATION - ms);
      const $ = (id) => this.app.querySelector(id);
      $('#clockNum').textContent = Math.ceil(left / 1000);
      const C = 2 * Math.PI * 52;
      $('#ring').style.strokeDasharray = C;
      $('#ring').style.strokeDashoffset = C * (1 - left / DURATION);
      $('#ring').classList.toggle('low', left < 10000);
      const st = t.stats();
      $('#lvPpm').textContent = Math.round(st.ppm);
      $('#lvAcc').textContent = Math.round(st.acc) + '%';
      $('#lvWords').textContent = t.text.slice(0, t.pos).split(' ').length - 1;
      if (t.start) { const h = $('#startHint'); if (h) h.style.visibility = 'hidden'; }
      if (t.text.length - t.pos < 120) t.extend(' ' + (this.textType === 'datos' ? factsText(300) : wordsText(300)));
      if (t.start && left <= 0) { this.clockEnd(); return; }
      this.raf = requestAnimationFrame(() => this.clockLoop());
    },

    clockEnd() {
      if (this.mode !== 'clock') return;
      this.typer.finish();
      this.stopLoops();
      this.mode = 'results';
      const st = this.typer.stats();
      const ppm = Math.round(st.ppm);
      const S = TT.state;
      const record = ppm > S.records.contrarreloj;
      if (record) S.records.contrarreloj = ppm;
      TT.recordSession({ mode: 'carrera', ppm: st.ppm, acc: st.acc, chars: st.chars, timeMs: st.timeMs });
      const xp = TT.addXP(ppm * 4 * (st.acc / 100));
      TT.checkAchievements({ acc: Math.round(st.acc), chars: st.chars, streak: st.streak });
      TT.sfx.win();
      this.enter = () => this.beginClock();
      const verdict = ppm >= 50 ? '¡Velocidad luz! Escribís como un profesional.' : ppm >= 35 ? '¡Turbo! Más rápido que la mayoría de los adultos.' : ppm >= 20 ? '¡Muy bien! Vas por buen camino.' : 'Cada día vas a sumar más palabras. ¡Seguí practicando!';
      TT.results(this.app, {
        icon: '⏱️',
        title: `${ppm} palabras por minuto`,
        subtitle: verdict,
        stats: [['PPM', ppm], ['Precisión', Math.round(st.acc) + '%'], ['Letras correctas', st.chars], ['Errores', st.errors]],
        record,
        xp,
        buttons: [
          { label: '↻ Otra vez', cls: 'primary', key: 'Enter', action: () => this.beginClock() },
          { label: 'Opciones', action: () => this.setup() },
          { label: 'Inicio', cls: 'ghost', action: () => TT.go('inicio') }
        ]
      });
    },

    onKey(e) {
      if (this.mode === 'setup' || this.mode === 'results') {
        if (e.key === 'Enter') { (this.mode === 'setup' ? this.begin() : this.enter()); return true; }
        return false;
      }
      if (e.key === 'Escape') { this.setup(); return true; }
      if (this.mode === 'countdown') return e.key.length === 1;
      if (this.mode === 'race' || this.mode === 'clock') {
        return this.typer.handleKey(e) || e.key === ' ' || e.key === "'" || e.key === '/';
      }
      return false;
    }
  };
})();
