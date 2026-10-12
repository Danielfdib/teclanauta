/* Teclanauta — motor de escritura: muestra el texto, valida teclas y mide PPM y precisión */
(function () {
  const TT = window.TT;

  TT.Typer = class {
    /* opts: el, text, caseInsensitive, kb (TT.Keyboard), hands (TT.Hands), onChange, onDone, autoStart */
    constructor(opts) {
      this.o = Object.assign({ caseInsensitive: false, autoStart: true }, opts);
      this.text = this.o.text;
      this.pos = 0;
      this.correct = 0;
      this.errors = 0;
      this.streak = 0;
      this.maxStreak = 0;
      this.start = null;
      this.end = null;
      this.dead = false;
      this.done = false;
      this.errAt = new Set();
      this.render();
    }

    render() {
      const box = this.o.el;
      box.classList.add('typer');
      box.innerHTML = '';
      const view = document.createElement('div');
      view.className = 'typer-view';
      this.inner = document.createElement('div');
      this.inner.className = 'typer-inner';
      view.appendChild(this.inner);
      box.appendChild(view);
      this.spans = [];
      this.appendSpans(this.text);
      this.mark();
    }

    appendSpans(str) {
      let word = this.inner.lastElementChild && !this.inner.lastElementChild.dataset.closed ? this.inner.lastElementChild : null;
      for (const ch of str) {
        if (!word) { word = document.createElement('span'); word.className = 'w'; this.inner.appendChild(word); }
        const s = document.createElement('span');
        s.className = 'c' + (ch === ' ' ? ' sp' : '');
        s.textContent = ch;
        word.appendChild(s);
        this.spans.push(s);
        if (ch === ' ') { word.dataset.closed = '1'; word = null; }
      }
    }

    // Agrega más texto al final (contrarreloj)
    extend(str) {
      this.text += str;
      this.appendSpans(str);
    }

    expected() { return this.text[this.pos]; }

    mark() {
      const prev = this.inner.querySelector('.c.cur');
      if (prev) prev.classList.remove('cur', 'dead');
      const cur = this.spans[this.pos];
      if (cur) {
        cur.classList.add('cur');
        if (this.dead) cur.classList.add('dead');
        // Mantener la línea actual visible
        const lineH = cur.offsetHeight || 40;
        const first = this.spans[0];
        const top = cur.offsetTop - (first ? first.offsetTop : 0);
        const shift = Math.max(0, top - lineH * 1.1);
        this.inner.style.transform = `translateY(${-shift}px)`;
      }
      this.updateHints();
    }

    updateHints() {
      if (!this.o.kb) return;
      const fingers = this.done ? this.o.kb.hint(null) : this.o.kb.hint(this.expected(), this.dead);
      if (this.o.hands) this.o.hands.highlight(fingers);
    }

    begin() { if (!this.start) this.start = performance.now(); }

    // Devuelve true si la tecla fue usada por el motor
    handleKey(e) {
      if (this.done) return false;
      if (e.key === 'Dead') {
        this.dead = true;
        if (this.o.kb) this.o.kb.flash('Dead', true);
        this.mark();
        return true;
      }
      if (e.key.length !== 1) return false;
      if (this.o.autoStart) this.begin();
      if (!this.start) return true;
      const exp = this.expected();
      const typed = e.key;
      const ok = this.o.caseInsensitive ? typed.toLowerCase() === exp.toLowerCase() : typed === exp;
      this.dead = false;
      if (this.o.kb) this.o.kb.flash(typed, ok);
      const span = this.spans[this.pos];
      TT.recordKey(exp, ok);
      if (ok) {
        span.classList.add(this.errAt.has(this.pos) ? 'fixed' : 'ok');
        this.correct++;
        this.streak++;
        if (this.streak > this.maxStreak) this.maxStreak = this.streak;
        this.pos++;
        TT.sfx.key();
        if (this.pos >= this.text.length) {
          this.done = true;
          this.end = performance.now();
        }
      } else {
        this.errors++;
        this.streak = 0;
        this.errAt.add(this.pos);
        span.classList.remove('bad');
        void span.offsetWidth;
        span.classList.add('bad');
        TT.sfx.error();
      }
      this.mark();
      if (this.o.onChange) this.o.onChange(this, ok);
      if (this.done && this.o.onDone) this.o.onDone(this);
      return true;
    }

    finish() {
      if (!this.done) { this.done = true; this.end = performance.now(); this.updateHints(); }
    }

    elapsed() {
      if (!this.start) return 0;
      return (this.end || performance.now()) - this.start;
    }

    stats() {
      const ms = this.elapsed();
      const min = ms / 60000;
      const ppm = min > 0.02 ? (this.correct / 5) / min : 0;
      const total = this.correct + this.errors;
      const acc = total ? (this.correct / total) * 100 : 100;
      return { ppm, acc, chars: this.correct, errors: this.errors, timeMs: ms, streak: this.maxStreak };
    }
  };

  /* Panel de resultados compartido: muestra números y animación de conteo */
  TT.countUp = (el, to, ms) => {
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / (ms || 900));
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('es');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
})();
