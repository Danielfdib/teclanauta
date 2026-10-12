/* Teclanauta — juego "Lluvia de meteoritos" */
(function () {
  const TT = window.TT;
  TT.screens = TT.screens || {};
  const D = TT.data;
  const KILLS_PER_LEVEL = 8;
  const STARTS = [
    { level: 1, name: 'Cadete', desc: 'Empieza lento, palabras cortas' },
    { level: 3, name: 'Piloto', desc: 'Empieza en el nivel 3' },
    { level: 5, name: 'Comandante', desc: 'Empieza en el nivel 5, con tildes' }
  ];

  // Bancos de palabras sin tildes y con tildes
  let plain = null, accented = null;
  function banks() {
    if (plain) return;
    const all = new Set(D.words.concat(D.gameWords.easy, D.gameWords.mid, D.gameWords.hard));
    plain = Array.from(all).filter((w) => /^[a-zñ]+$/.test(w) && w.length >= 2);
    accented = D.accentWords.slice();
  }
  function lengthRange(level) {
    return [[2, 4], [3, 5], [4, 6], [5, 7], [5, 8], [6, 9], [6, 10]][Math.min(level, 7) - 1];
  }

  TT.screens.lluvia = {
    start: 1,

    render(app) {
      this.app = app;
      banks();
      this.setup();
    },
    destroy() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      window.removeEventListener('blur', this.onBlur);
    },

    setup() {
      this.mode = 'setup';
      this.running = false;
      cancelAnimationFrame(this.raf);
      const S = TT.state;
      this.app.innerHTML = `
        <div class="page-head">
          <button class="btn ghost" data-go="inicio">← Inicio</button>
          <div><p class="eyebrow">Misión</p><h1>☄️ Lluvia de meteoritos</h1></div>
          <div class="best-badge"><small>Récord</small><b>${S.records.lluvia.toLocaleString('es')}</b></div>
        </div>
        <div class="setup-grid">
          <div class="panel">
            <h3>¿Cómo se juega?</h3>
            <ol class="howto">
              <li>Caen meteoritos con palabras. <b>Escribí la palabra</b> para disparar tu láser y destruirlo.</li>
              <li>Con la primera letra apuntás al meteorito <b>más cercano al suelo</b> que empiece con esa letra.</li>
              <li>Si un meteorito toca el planeta perdés un <b>escudo 🛡️</b>. Con 3 golpes, se termina la partida.</li>
              <li>Cada ${KILLS_PER_LEVEL} meteoritos <b>subís de nivel</b>: caen más rápido y con palabras más largas.</li>
              <li><kbd>Backspace</kbd> cambia de objetivo · <kbd>Esc</kbd> pausa.</li>
            </ol>
          </div>
          <div class="panel">
            <h3>Nivel de inicio</h3>
            <div class="chips" id="starts">
              ${STARTS.map((s) => `<button class="chip-btn ${s.level === this.start ? 'on' : ''}" data-start="${s.level}"><b>${s.name}</b><small>${s.desc}</small></button>`).join('')}
            </div>
            <button class="btn primary big" id="go">🚀 Defender el planeta <kbd>Enter</kbd></button>
          </div>
        </div>`;
      this.app.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => {
        this.start = +b.dataset.start; TT.sfx.click();
        this.app.querySelectorAll('[data-start]').forEach((x) => x.classList.toggle('on', x === b));
      }));
      this.app.querySelector('#go').addEventListener('click', () => this.begin());
    },

    begin() {
      this.mode = 'play';
      this.level = this.start;
      this.kills = 0;
      this.levelKills = 0;
      this.score = 0;
      this.shields = 3;
      this.combo = 0;
      this.correctKeys = 0;
      this.errorKeys = 0;
      this.activeMs = 0;
      this.meteors = [];
      this.target = null;
      this.spawnIn = 0.5;
      this.paused = false;
      this.app.innerHTML = `
        <div class="game-hud panel">
          <div class="hud-item"><span class="ll">Puntos</span><span class="lv" id="hScore">0</span></div>
          <div class="hud-item"><span class="ll">Nivel</span><span class="lv" id="hLevel">${this.level}</span></div>
          <div class="hud-item"><span class="ll">Escudos</span><span class="lv" id="hShields"></span></div>
          <div class="hud-item"><span class="ll">Combo</span><span class="lv" id="hCombo">—</span></div>
          <div class="hud-item grow"><span class="ll">Próximo nivel</span><div class="pbar"><i id="hLvl"></i></div></div>
          <button class="btn ghost small" id="pauseBtn">⏸ Pausa <kbd>Esc</kbd></button>
        </div>
        <div class="arena" id="arena">
          <div class="ground"><div class="city">🏠🏢🏡🏫🏠🏬🏡🏥🏠🏢</div></div>
          <div class="ship" id="ship">🚀</div>
          <div class="banner" id="banner"></div>
          <div class="pause-layer" id="pauseLayer" hidden>
            <div class="panel center"><h2>⏸ Pausa</h2><p>Apretá <kbd>Esc</kbd> para seguir.</p>
            <div class="btn-row center"><button class="btn primary" id="resume">Continuar</button><button class="btn ghost" id="quit">Salir</button></div></div>
          </div>
        </div>`;
      this.arena = this.app.querySelector('#arena');
      this.ship = this.app.querySelector('#ship');
      this.size();
      this.renderHud();
      this.app.querySelector('#pauseBtn').addEventListener('click', () => this.togglePause());
      this.app.querySelector('#resume').addEventListener('click', () => this.togglePause());
      this.app.querySelector('#quit').addEventListener('click', () => this.setup());
      this.onBlur = () => { if (this.mode === 'play' && !this.paused) this.togglePause(); };
      window.addEventListener('blur', this.onBlur);
      this.showBanner(`Nivel ${this.level}`);
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame((t) => this.loop(t));
    },

    size() {
      const r = this.arena.getBoundingClientRect();
      this.W = r.width;
      this.H = r.height;
      this.groundY = this.H - 64;
    },

    renderHud() {
      const $ = (id) => this.app.querySelector(id);
      $('#hScore').textContent = this.score.toLocaleString('es');
      $('#hLevel').textContent = this.level;
      $('#hShields').textContent = '🛡️'.repeat(this.shields) + '▫️'.repeat(3 - this.shields);
      $('#hCombo').textContent = this.combo > 1 ? `x${this.combo}` : '—';
      $('#hLvl').style.width = (this.levelKills / KILLS_PER_LEVEL) * 100 + '%';
    },

    showBanner(text) {
      const b = this.app.querySelector('#banner');
      b.textContent = text;
      b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    },

    pickWord() {
      const [mn, mx] = lengthRange(this.level);
      const used = new Set(this.meteors.map((m) => m.word));
      const firsts = new Set(this.meteors.map((m) => m.word[0]));
      const accChance = this.level >= 5 ? 0.35 : this.level >= 4 ? 0.2 : 0;
      let pool = Math.random() < accChance ? accented.filter((w) => w.length <= mx + 1) : plain.filter((w) => w.length >= mn && w.length <= mx);
      let cand = pool.filter((w) => !used.has(w) && !firsts.has(w[0]));
      if (!cand.length) cand = pool.filter((w) => !used.has(w));
      return TT.pick(cand.length ? cand : pool);
    },

    spawn() {
      const word = this.pickWord();
      const el = document.createElement('div');
      el.className = 'meteor';
      el.innerHTML = `<div class="rock"></div><div class="mword"></div>`;
      this.arena.appendChild(el);
      const w = Math.max(90, word.length * 17 + 30);
      // Evitar que aparezca encima de otro meteorito reciente
      let x, tries = 0;
      do { x = TT.rand(10, this.W - w - 10); tries++; }
      while (tries < 8 && this.meteors.some((m) => m.y < 120 && Math.abs(m.x - x) < w));
      const fall = Math.max(4.2, 14 - (this.level - 1) * 1.5);
      const m = { el, word, x, y: -70, w, typed: 0, speed: (this.groundY + 70) / fall };
      this.meteors.push(m);
      this.paintWord(m);
      el.style.width = w + 'px';
      this.place(m);
    },

    paintWord(m) {
      const done = TT.esc(m.word.slice(0, m.typed));
      const rest = TT.esc(m.word.slice(m.typed));
      m.el.querySelector('.mword').innerHTML = `<span class="t">${done}</span>${rest}`;
      m.el.classList.toggle('targeted', m === this.target);
    },
    place(m) { m.el.style.transform = `translate(${m.x}px, ${m.y}px)`; },

    loop(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (!this.paused) {
        this.activeMs += dt * 1000;
        this.spawnIn -= dt;
        const maxOn = 2 + this.level;
        if (this.spawnIn <= 0 && this.meteors.length < maxOn) {
          this.spawn();
          this.spawnIn = Math.max(0.9, 2.8 - (this.level - 1) * 0.28);
        }
        for (const m of this.meteors.slice()) {
          m.y += m.speed * dt;
          this.place(m);
          if (m.y + 60 >= this.groundY) this.crash(m);
        }
        // La nave apunta al objetivo
        if (this.target) {
          const sx = this.W / 2, sy = this.H - 120;
          const tx = this.target.x + this.target.w / 2, ty = this.target.y + 30;
          const ang = Math.atan2(tx - sx, sy - ty) * 180 / Math.PI;
          this.ship.style.transform = `translateX(-50%) rotate(${ang - 45}deg)`;
        } else {
          this.ship.style.transform = 'translateX(-50%) rotate(-45deg)';
        }
      }
      this.raf = requestAnimationFrame((t) => this.loop(t));
    },

    removeMeteor(m) {
      this.meteors = this.meteors.filter((x) => x !== m);
      if (this.target === m) this.target = null;
    },

    crash(m) {
      this.removeMeteor(m);
      m.el.remove();
      this.shields--;
      this.combo = 0;
      this.boomAt(m.x + m.w / 2, this.groundY, true);
      TT.sfx.hit();
      this.arena.classList.remove('shake'); void this.arena.offsetWidth; this.arena.classList.add('shake');
      this.renderHud();
      if (this.shields <= 0) this.gameOver();
    },

    boomAt(x, y, big) {
      const b = document.createElement('div');
      b.className = 'boom' + (big ? ' big' : '');
      b.style.left = x + 'px';
      b.style.top = y + 'px';
      b.innerHTML = '<span>💥</span>' + Array.from({ length: 8 }, (_, i) => `<i style="--a:${i * 45}deg"></i>`).join('');
      this.arena.appendChild(b);
      setTimeout(() => b.remove(), 700);
    },

    laser(m) {
      const sx = this.W / 2, sy = this.H - 122;
      const tx = m.x + m.w / 2, ty = m.y + 30;
      const len = Math.hypot(tx - sx, ty - sy);
      const ang = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI;
      const l = document.createElement('div');
      l.className = 'laser';
      l.style.left = sx + 'px';
      l.style.top = sy + 'px';
      l.style.width = len + 'px';
      l.style.transform = `rotate(${ang}deg)`;
      this.arena.appendChild(l);
      setTimeout(() => l.remove(), 260);
    },

    destroyMeteor(m) {
      this.laser(m);
      TT.sfx.laser();
      setTimeout(() => TT.sfx.boom(), 80);
      this.boomAt(m.x + m.w / 2, m.y + 30);
      m.el.remove();
      this.removeMeteor(m);
      this.combo++;
      this.kills++;
      this.levelKills++;
      TT.state.totals.meteors++;
      this.score += m.word.length * 10 * this.level + this.combo * 5;
      if (this.levelKills >= KILLS_PER_LEVEL) {
        this.level++;
        this.levelKills = 0;
        TT.sfx.levelup();
        this.showBanner(`¡Nivel ${this.level}!`);
      }
      this.renderHud();
    },

    keyChar(ch) {
      const c = ch.toLowerCase();
      if (!this.target) {
        const cands = this.meteors.filter((m) => m.word[0] === c).sort((a, b) => b.y - a.y);
        if (!cands.length) return this.miss(this.meteors.length ? null : null);
        this.target = cands[0];
      }
      const m = this.target;
      if (m.word[m.typed] === c) {
        m.typed++;
        this.correctKeys++;
        TT.recordKey(c, true);
        TT.sfx.key();
        if (m.typed >= m.word.length) this.destroyMeteor(m);
        else this.paintWord(m);
        this.meteors.forEach((x) => x !== m && x.el.classList.remove('targeted'));
      } else {
        TT.recordKey(m.word[m.typed], false);
        this.miss();
      }
    },

    miss() {
      this.errorKeys++;
      this.combo = 0;
      TT.sfx.error();
      if (this.target) {
        const el = this.target.el;
        el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong');
      }
      this.renderHud();
    },

    togglePause() {
      if (this.mode !== 'play') return;
      this.paused = !this.paused;
      this.app.querySelector('#pauseLayer').hidden = !this.paused;
      this.last = performance.now();
    },

    gameOver() {
      this.running = false;
      this.mode = 'results';
      cancelAnimationFrame(this.raf);
      window.removeEventListener('blur', this.onBlur);
      const S = TT.state;
      const record = this.score > S.records.lluvia;
      if (record) S.records.lluvia = this.score;
      if (this.level > S.records.lluviaNivel) S.records.lluviaNivel = this.level;
      const total = this.correctKeys + this.errorKeys;
      const acc = total ? (this.correctKeys / total) * 100 : 100;
      const ppm = this.activeMs > 0 ? (this.correctKeys / 5) / (this.activeMs / 60000) : 0;
      TT.recordSession({ mode: 'lluvia', ppm, acc, chars: this.correctKeys, timeMs: this.activeMs });
      const xp = TT.addXP(this.score / 8);
      TT.checkAchievements({ acc: Math.round(acc), chars: this.correctKeys });
      TT.sfx.lose();
      this.enter = () => this.begin();
      setTimeout(() => {
        if (this.mode !== 'results') return;
        TT.results(this.app, {
          icon: '🌍',
          title: 'Fin de la misión',
          subtitle: this.kills >= 30 ? '¡El planeta está a salvo gracias a vos!' : 'Los meteoritos ganaron esta vez… ¡pero podés volver a intentarlo!',
          stats: [['Puntos', this.score.toLocaleString('es')], ['Nivel', this.level], ['Meteoritos', this.kills], ['PPM', Math.round(ppm)], ['Precisión', Math.round(acc) + '%']],
          record,
          xp,
          buttons: [
            { label: '↻ Jugar otra vez', cls: 'primary', key: 'Enter', action: () => this.begin() },
            { label: 'Cambiar nivel', action: () => this.setup() },
            { label: 'Inicio', cls: 'ghost', action: () => TT.go('inicio') }
          ]
        });
      }, 900);
    },

    onKey(e) {
      if (this.mode === 'setup' || this.mode === 'results') {
        if (e.key === 'Enter') { (this.mode === 'setup' ? this.begin() : this.enter()); return true; }
        return false;
      }
      if (this.mode !== 'play') return false;
      if (e.key === 'Escape') { this.togglePause(); return true; }
      if (this.paused) return e.key.length === 1;
      if (e.key === 'Backspace') {
        if (this.target) { this.target.typed = 0; this.paintWord(this.target); this.target.el.classList.remove('targeted'); this.target = null; }
        return true;
      }
      if (e.key === 'Dead') return true;
      if (e.key.length !== 1 || e.key === ' ') return e.key === ' ';
      this.keyChar(e.key);
      return true;
    }
  };
})();
