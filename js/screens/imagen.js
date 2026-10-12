/* Teclanauta — juego "Adivina la imagen" */
(function () {
  const TT = window.TT;
  TT.screens = TT.screens || {};
  const D = TT.data;
  const ROUNDS = 10;
  const DIFFS = [
    { id: 'facil', name: 'Fácil', desc: 'Palabras cortas · 20 s', base: 16, min: 1, max: 5 },
    { id: 'normal', name: 'Normal', desc: 'Palabras medianas · 15 s', base: 11, min: 5, max: 8 },
    { id: 'dificil', name: 'Difícil', desc: 'Palabras largas · 12 s', base: 7, min: 8, max: 99 }
  ];

  TT.screens.imagen = {
    cat: 'todas',
    diff: 'normal',

    render(app) {
      this.app = app;
      this.setup();
    },
    destroy() { cancelAnimationFrame(this.raf); clearTimeout(this.nextT); },

    setup() {
      this.mode = 'setup';
      const S = TT.state;
      this.app.innerHTML = `
        <div class="page-head">
          <button class="btn ghost" data-go="inicio">← Inicio</button>
          <div><p class="eyebrow">Misión</p><h1>🦇 Adivina la imagen</h1></div>
          <div class="best-badge"><small>Récord</small><b>${S.records.imagen.toLocaleString('es')}</b></div>
        </div>
        <div class="setup-grid">
          <div class="panel">
            <h3>¿Cómo se juega?</h3>
            <ol class="howto">
              <li>Aparece una imagen: escribí su <b>nombre</b> en minúsculas.</li>
              <li>Las <b>tildes cuentan</b>: apretá <kbd>´</kbd> y después la vocal (´ + a = á).</li>
              <li>Cuanto más rápido y sin errores, <b>más puntos</b>. Las respuestas seguidas suman <b>racha 🔥</b>.</li>
              <li>¿Trabado? <kbd>Tab</kbd> te muestra una letra y <kbd>Enter</kbd> te dice la palabra en voz alta (cuestan puntos).</li>
            </ol>
          </div>
          <div class="panel">
            <h3>Categoría</h3>
            <div class="chips" id="cats">
              ${D.imageCategories.map((c) => `<button class="chip-btn ${c.id === this.cat ? 'on' : ''}" data-cat="${c.id}">${c.icon} ${c.name}</button>`).join('')}
            </div>
            <h3>Dificultad</h3>
            <div class="chips" id="diffs">
              ${DIFFS.map((d) => `<button class="chip-btn ${d.id === this.diff ? 'on' : ''}" data-diff="${d.id}"><b>${d.name}</b><small>${d.desc}</small></button>`).join('')}
            </div>
            <button class="btn primary big" id="go">🚀 Despegar <kbd>Enter</kbd></button>
          </div>
        </div>`;
      this.app.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
        this.cat = b.dataset.cat; TT.sfx.click();
        this.app.querySelectorAll('[data-cat]').forEach((x) => x.classList.toggle('on', x === b));
      }));
      this.app.querySelectorAll('[data-diff]').forEach((b) => b.addEventListener('click', () => {
        this.diff = b.dataset.diff; TT.sfx.click();
        this.app.querySelectorAll('[data-diff]').forEach((x) => x.classList.toggle('on', x === b));
      }));
      this.app.querySelector('#go').addEventListener('click', () => this.start());
    },

    buildQueue() {
      const d = DIFFS.find((x) => x.id === this.diff);
      const inCat = D.images.filter((it) => this.cat === 'todas' || it[0] === this.cat);
      const len = (it) => it[2].length;
      let pool = inCat.filter((it) => len(it) >= d.min && len(it) <= d.max);
      if (pool.length < ROUNDS) {
        // Completar con las más cercanas a la dificultad elegida
        const mid = (d.min + Math.min(d.max, 12)) / 2;
        const rest = inCat.filter((it) => !pool.includes(it)).sort((a, b) => Math.abs(len(a) - mid) - Math.abs(len(b) - mid));
        pool = pool.concat(rest.slice(0, ROUNDS - pool.length));
      }
      return TT.shuffle(pool).slice(0, ROUNDS);
    },

    start() {
      this.mode = 'play';
      this.queue = this.buildQueue();
      this.round = 0;
      this.score = 0;
      this.streak = 0;
      this.bestStreak = 0;
      this.correctKeys = 0;
      this.errorKeys = 0;
      this.typingMs = 0;
      this.log = [];
      this.app.innerHTML = `
        <div class="game-hud panel">
          <div class="hud-item"><span class="ll">Ronda</span><span class="lv" id="hRound">1/${ROUNDS}</span></div>
          <div class="hud-item"><span class="ll">Puntos</span><span class="lv" id="hScore">0</span></div>
          <div class="hud-item"><span class="ll">Racha</span><span class="lv" id="hStreak">—</span></div>
          <div class="hud-item grow"><span class="ll">Tiempo</span><div class="timebar"><i id="hTime"></i></div></div>
          <button class="btn ghost small" id="quit">Salir</button>
        </div>
        <div class="img-stage">
          <div class="img-orb" id="orb"><span class="emoji" id="emoji"></span></div>
          <div class="float-pts" id="fpts"></div>
        </div>
        <div class="slots" id="slots"></div>
        <p class="center muted small" id="accHint">Recordá: para la tilde apretá <kbd>´</kbd> y después la vocal.</p>
        <div class="img-tools">
          <button class="btn" id="bHint">💡 Pista <kbd>Tab</kbd></button>
          ${TT.canSpeak ? '<button class="btn" id="bSay">🔈 Escuchar <kbd>Enter</kbd></button>' : ''}
        </div>`;
      this.app.querySelector('#quit').addEventListener('click', () => this.setup());
      this.app.querySelector('#bHint').addEventListener('click', () => this.hint());
      const say = this.app.querySelector('#bSay');
      if (say) say.addEventListener('click', () => this.say());
      this.nextRound();
    },

    nextRound() {
      if (this.round >= this.queue.length) return this.end();
      const it = this.queue[this.round];
      this.item = it;
      this.cands = [it[2]].concat(it[3] || []).map((w) => w.toLowerCase());
      this.target = this.cands[0];
      this.typed = '';
      this.hinted = new Set();
      this.errors = 0;
      this.listened = false;
      this.locked = false;
      this.dead = false;
      const d = DIFFS.find((x) => x.id === this.diff);
      this.limit = (d.base + this.target.length * 0.8) * 1000;
      this.t0 = performance.now();
      this.app.querySelector('#hRound').textContent = `${this.round + 1}/${ROUNDS}`;
      const orb = this.app.querySelector('#orb');
      orb.className = 'img-orb enter';
      this.app.querySelector('#emoji').textContent = it[1];
      this.renderSlots();
      cancelAnimationFrame(this.raf);
      const tick = () => {
        const left = this.limit - (performance.now() - this.t0);
        const bar = this.app.querySelector('#hTime');
        if (!bar) return;
        bar.style.width = Math.max(0, (left / this.limit) * 100) + '%';
        bar.classList.toggle('low', left < 4000);
        if (left <= 0 && !this.locked) { this.timeout(); return; }
        if (!this.locked) this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    },

    renderSlots(state) {
      const box = this.app.querySelector('#slots');
      box.innerHTML = this.target.split('').map((c, i) => {
        if (c === ' ') return '<span class="slot-gap"></span>';
        let cls = 'slot';
        let ch = '';
        if (state === 'reveal') { ch = c; cls += i < this.typed.length ? ' ok' : ' miss'; }
        else if (i < this.typed.length) { ch = this.typed[i]; cls += this.hinted.has(i) ? ' hinted' : ' ok'; }
        else if (i === this.typed.length) { cls += ' cur'; if (this.dead) ch = '´'; }
        if (state === 'solved') cls += ' solved';
        return `<span class="${cls}" style="--i:${i}">${TT.esc(ch)}</span>`;
      }).join('');
    },

    shake() {
      const cur = this.app.querySelector('.slot.cur');
      if (cur) { cur.classList.remove('shake'); void cur.offsetWidth; cur.classList.add('shake'); }
    },

    type(ch) {
      const nt = this.typed + ch.toLowerCase();
      let m = this.target.startsWith(nt) ? this.target : this.cands.find((c) => c.startsWith(nt));
      const expected = this.target[this.typed.length];
      if (m) {
        if (m !== this.target) this.target = m;
        this.typed = nt;
        this.correctKeys++;
        TT.recordKey(expected === nt[nt.length - 1] ? expected : nt[nt.length - 1], true);
        TT.sfx.key();
        if (this.typed === this.target) return this.solve();
        this.renderSlots();
      } else {
        this.errors++;
        this.errorKeys++;
        this.streakBroken = true;
        TT.recordKey(expected, false);
        TT.sfx.error();
        this.renderSlots();
        this.shake();
      }
    },

    hint() {
      if (this.mode !== 'play' || this.locked) return;
      const i = this.typed.length;
      if (this.target[i] === ' ') { this.typed += ' '; }
      this.hinted.add(this.typed.length);
      this.typed += this.target[this.typed.length];
      TT.sfx.click();
      if (this.typed === this.target) return this.solve();
      this.renderSlots();
    },

    say() {
      if (this.mode !== 'play' || this.locked) return;
      this.listened = true;
      TT.speak(this.target, true);
    },

    solve() {
      this.locked = true;
      cancelAnimationFrame(this.raf);
      const elapsed = performance.now() - this.t0;
      this.typingMs += elapsed;
      const left = Math.max(0, this.limit - elapsed) / 1000;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      let pts = 50 + this.target.length * 10 + Math.ceil(left) * 5 - this.errors * 10;
      pts *= Math.pow(0.7, this.hinted.size);
      if (this.listened) pts -= 20;
      pts = Math.max(10, Math.round(pts * (1 + Math.min(this.streak - 1, 10) * 0.1)));
      this.score += pts;
      this.log.push({ emoji: this.item[1], word: this.target, ok: true, hints: this.hinted.size + (this.listened ? 1 : 0) });
      this.renderSlots('solved');
      const orb = this.app.querySelector('#orb');
      orb.className = 'img-orb win';
      const fp = this.app.querySelector('#fpts');
      fp.textContent = `+${pts}`;
      fp.className = 'float-pts show';
      this.app.querySelector('#hScore').textContent = this.score.toLocaleString('es');
      this.app.querySelector('#hStreak').textContent = this.streak > 1 ? `🔥 x${this.streak}` : '—';
      TT.sfx.word();
      TT.speak(this.target);
      this.round++;
      this.nextT = setTimeout(() => { fp.className = 'float-pts'; this.nextRound(); }, 1300);
    },

    timeout() {
      this.locked = true;
      this.typingMs += this.limit;
      this.streak = 0;
      this.log.push({ emoji: this.item[1], word: this.target, ok: false });
      this.renderSlots('reveal');
      this.app.querySelector('#orb').className = 'img-orb lose';
      this.app.querySelector('#hStreak').textContent = '—';
      TT.sfx.lose();
      TT.speak(this.target);
      this.round++;
      this.nextT = setTimeout(() => this.nextRound(), 2000);
    },

    end() {
      this.mode = 'results';
      cancelAnimationFrame(this.raf);
      const S = TT.state;
      const okCount = this.log.filter((l) => l.ok).length;
      const perfect = okCount === ROUNDS && this.log.every((l) => !l.hints);
      const record = this.score > S.records.imagen;
      if (record) S.records.imagen = this.score;
      const total = this.correctKeys + this.errorKeys;
      const acc = total ? (this.correctKeys / total) * 100 : 100;
      const ppm = this.typingMs > 0 ? (this.correctKeys / 5) / (this.typingMs / 60000) : 0;
      TT.recordSession({ mode: 'imagen', ppm, acc, chars: this.correctKeys, timeMs: this.typingMs });
      const xp = TT.addXP(this.score / 4);
      TT.checkAchievements({ imagenPerfecta: perfect, acc: Math.round(acc), chars: this.correctKeys });
      if (okCount >= 6) TT.sfx.win(); else TT.sfx.lose();
      this.enter = () => this.start();
      TT.results(this.app, {
        icon: okCount >= 8 ? '🏆' : okCount >= 5 ? '🌟' : '🛰️',
        title: `${okCount} de ${ROUNDS} acertadas`,
        subtitle: perfect ? '¡Perfecto y sin pistas! Ojo de águila.' : okCount >= 8 ? '¡Excelente vocabulario y dedos rápidos!' : okCount >= 5 ? '¡Bien! Con práctica vas a llegar a 10.' : 'Probá con la dificultad Fácil para entrar en calor.',
        stats: [['Puntos', this.score.toLocaleString('es')], ['Mejor racha', this.bestStreak], ['Precisión', Math.round(acc) + '%'], ['PPM', Math.round(ppm)]],
        record,
        xp,
        extra: `<div class="word-review">${this.log.map((l) => `<div class="wr ${l.ok ? 'ok' : 'bad'}"><span class="e">${l.emoji}</span><span>${TT.esc(l.word)}</span><span class="m">${l.ok ? (l.hints ? '✓ con ayuda' : '✓') : '✗'}</span></div>`).join('')}</div>`,
        buttons: [
          { label: '↻ Jugar otra vez', cls: 'primary', key: 'Enter', action: () => this.start() },
          { label: 'Cambiar categoría', action: () => this.setup() },
          { label: 'Inicio', cls: 'ghost', action: () => TT.go('inicio') }
        ]
      });
    },

    onKey(e) {
      if (this.mode === 'setup') {
        if (e.key === 'Enter') { this.start(); return true; }
        return false;
      }
      if (this.mode === 'results') {
        if (e.key === 'Enter') { this.enter(); return true; }
        return false;
      }
      if (this.mode !== 'play') return false;
      if (e.key === 'Tab') { this.hint(); return true; }
      if (e.key === 'Enter') { this.say(); return true; }
      if (e.key === 'Escape') { this.setup(); return true; }
      if (this.locked) return e.key.length === 1;
      if (e.key === 'Dead') { this.dead = true; this.renderSlots(); return true; }
      if (e.key.length !== 1) return false;
      this.dead = false;
      if (this.typed.length === 0 && this.correctKeys === 0 && this.errorKeys === 0) TT.state.modes.imagen = true;
      this.type(e.key);
      return true;
    }
  };
})();
