/* Teclanauta — teclado latinoamericano en pantalla y manos con colores por dedo */
(function () {
  const TT = window.TT;

  // Dedos: lp/lr/lm/li = meñique/anular/medio/índice izquierdo · th = pulgar · ri/rm/rr/rp = derecha
  TT.fingerNames = {
    lp: 'meñique izquierdo', lr: 'anular izquierdo', lm: 'medio izquierdo', li: 'índice izquierdo',
    th: 'pulgar', ri: 'índice derecho', rm: 'medio derecho', rr: 'anular derecho', rp: 'meñique derecho'
  };
  const k = (main, shift, f, extra) => Object.assign({ k: main, s: shift, f }, extra || {});
  const sp = (id, label, w, f) => ({ id, label, w, f, special: true });
  const letters = (str, fingers) => str.split('').map((c, i) => k(c, null, fingers[i]));

  const LAYOUT = [
    [k('|', '°', 'lp'), k('1', '!', 'lp'), k('2', '"', 'lr'), k('3', '#', 'lm'), k('4', '$', 'li'), k('5', '%', 'li'),
      k('6', '&', 'ri'), k('7', '/', 'ri'), k('8', '(', 'rm'), k('9', ')', 'rr'), k('0', '=', 'rp'), k("'", '?', 'rp'),
      k('¿', '¡', 'rp'), sp('Backspace', '⌫', 2, 'rp')],
    [sp('Tab', 'Tab', 1.5, 'lp'), ...letters('qwertyuiop', ['lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri', 'rm', 'rr', 'rp']),
      k('´', '¨', 'rp', { dead: true }), k('+', '*', 'rp'), sp('Enter', 'Enter', 1.5, 'rp')],
    [sp('Caps', 'Bloq Mayús', 1.75, 'lp'), ...letters('asdfghjklñ', ['lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri', 'rm', 'rr', 'rp']),
      k('{', '[', 'rp'), k('}', ']', 'rp'), sp('Enter2', '', 1.25, 'rp')],
    [sp('ShiftL', 'Shift', 1.25, 'lp'), k('<', '>', 'lp'), ...letters('zxcvbnm', ['lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri']),
      k(',', ';', 'rm'), k('.', ':', 'rr'), k('-', '_', 'rp'), sp('ShiftR', 'Shift', 2.75, 'rp')],
    [sp('gap1', '', 4, null), sp('Space', 'Espacio', 7, 'th'), sp('gap2', '', 4, null)]
  ];

  // Mapa carácter → tecla
  const MAP = {};
  const SPECIAL = {};
  LAYOUT.forEach((row) => row.forEach((key) => {
    if (key.special) { SPECIAL[key.id] = key; return; }
    if (!(key.k in MAP)) MAP[key.k] = { key, shift: false };
    if (key.s && !(key.s in MAP)) MAP[key.s] = { key, shift: true };
    if (/[a-zñ]/.test(key.k)) MAP[key.k.toUpperCase()] = { key, shift: true };
  }));
  MAP[' '] = { key: SPECIAL.Space, shift: false };
  const DEAD = MAP['´'].key;
  const ACC = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };

  // Qué hay que apretar para escribir un carácter
  TT.charInfo = (ch) => {
    if (MAP[ch]) return MAP[ch];
    const low = ch.toLowerCase();
    if (ACC[low]) return { key: MAP[ACC[low]].key, shift: ch !== low, dead: DEAD, deadShift: false };
    if (low === 'ü') return { key: MAP.u.key, shift: ch !== low, dead: DEAD, deadShift: true };
    return null;
  };
  const shiftFor = (finger) => (finger && finger[0] === 'l' ? SPECIAL.ShiftR : SPECIAL.ShiftL);
  const fingerClass = (f) => (f ? 'f' + (f === 'th' ? 't' : f[1]) : '');
  TT.fingerClass = fingerClass;

  TT.Keyboard = class {
    constructor(container, opts) {
      this.opts = opts || {};
      this.el = document.createElement('div');
      this.el.className = 'kb' + (this.opts.small ? ' kb-small' : '');
      this.nodes = new Map();
      LAYOUT.forEach((row) => {
        const r = document.createElement('div');
        r.className = 'kb-row';
        row.forEach((key) => {
          const d = document.createElement('div');
          d.style.flex = `${key.w || 1} 1 0`;
          if (key.id && key.id.startsWith('gap')) { d.className = 'kb-gap'; r.appendChild(d); return; }
          d.className = `key ${fingerClass(key.f)}${key.special ? ' special' : ''}`;
          if (key.special) {
            d.innerHTML = `<span class="lbl">${key.label}</span>`;
          } else if (/[a-zñ]/.test(key.k)) {
            d.innerHTML = `<span class="lbl big">${key.k.toUpperCase()}</span>`;
          } else {
            d.innerHTML = `<span class="lbl top">${TT.esc(key.s || '')}</span><span class="lbl bot">${TT.esc(key.k)}</span>`;
          }
          if (key.k === 'f' || key.k === 'j') d.classList.add('bump');
          if (key.id === 'Enter') d.classList.add('enter-top');
          if (key.id === 'Enter2') d.classList.add('enter-bot');
          this.nodes.set(key, d);
          r.appendChild(d);
        });
        this.el.appendChild(r);
      });
      container.appendChild(this.el);
      this.hinted = [];
    }
    clearHint() {
      this.hinted.forEach((n) => n.classList.remove('next'));
      this.hinted = [];
    }
    // Resalta la próxima tecla. Devuelve los dedos que deben usarse.
    hint(ch, deadDone) {
      this.clearHint();
      if (ch == null) return [];
      const info = TT.charInfo(ch);
      if (!info) return [];
      let target, shift;
      if (info.dead && !deadDone) { target = info.dead; shift = info.deadShift; }
      else { target = info.key; shift = info.shift; }
      const fingers = [target.f];
      const add = (key) => { const n = this.nodes.get(key); if (n) { n.classList.add('next'); this.hinted.push(n); } };
      add(target);
      if (shift) { const s = shiftFor(target.f); add(s); fingers.push(s.f); }
      return fingers;
    }
    // Destello al apretar una tecla
    flash(typed, ok) {
      let key = null;
      if (typed === 'Dead') key = DEAD;
      else if (typed === 'Backspace') key = SPECIAL.Backspace;
      else if (typed === 'Enter') key = SPECIAL.Enter;
      else { const info = TT.charInfo(typed); if (info) key = info.key; }
      const n = key && this.nodes.get(key);
      if (!n) return;
      n.classList.remove('press-ok', 'press-bad');
      void n.offsetWidth;
      n.classList.add(ok ? 'press-ok' : 'press-bad');
      clearTimeout(n._t);
      n._t = setTimeout(() => n.classList.remove('press-ok', 'press-bad'), 220);
    }
    // Ilumina teclas nuevas de una lección
    markNew(chars) {
      chars.forEach((c) => {
        let key = null;
        if (c === 'Shift') { [SPECIAL.ShiftL, SPECIAL.ShiftR].forEach((s) => this.nodes.get(s).classList.add('new')); return; }
        const info = TT.charInfo(c);
        if (info) key = info.key;
        const n = key && this.nodes.get(key);
        if (n) n.classList.add('new');
      });
    }
    // Mapa de calor de errores: rates = { 'a': 0.12, ... }
    heat(stats) {
      this.el.classList.add('kb-heat');
      this.nodes.forEach((n, key) => {
        const id = key.special ? (key.id === 'Space' ? ' ' : null) : key.k;
        if (id == null) return;
        const st = stats[id];
        n.classList.remove('fp', 'fr', 'fm', 'fi', 'ft');
        if (!st || st.h + st.e < 5) { n.classList.add('heat-none'); n.title = 'Sin datos suficientes'; return; }
        const rate = st.e / (st.h + st.e);
        const lvl = rate < 0.03 ? 0 : rate < 0.07 ? 1 : rate < 0.12 ? 2 : rate < 0.2 ? 3 : 4;
        n.classList.add('heat-' + lvl);
        n.title = `${key.special ? 'Espacio' : key.k.toUpperCase()}: ${Math.round(rate * 100)}% de errores (${st.h + st.e} pulsaciones)`;
      });
    }
  };

  /* ---------- Manos ---------- */
  const FINGERS_L = [
    { f: 'lp', x: 18, y: 58, h: 64 }, { f: 'lr', x: 50, y: 30, h: 92 },
    { f: 'lm', x: 82, y: 18, h: 104 }, { f: 'li', x: 114, y: 34, h: 88 }
  ];
  function handSVG(side) {
    const fingers = FINGERS_L.map((d) => {
      const f = side === 'l' ? d.f : 'r' + { p: 'p', r: 'r', m: 'm', i: 'i' }[d.f[1]];
      return `<rect class="finger ${fingerClass(f)}" data-f="${f}" x="${d.x}" y="${d.y}" width="28" height="${d.h}" rx="14"/>`;
    }).join('');
    const body = `
      <rect class="palm" x="14" y="98" width="134" height="74" rx="32"/>
      ${fingers}
      <rect class="finger ft" data-f="th" x="150" y="96" width="28" height="64" rx="14" transform="rotate(-48 164 128)"/>`;
    return side === 'l' ? `<g>${body}</g>` : `<g transform="translate(392,0) scale(-1,1)">${body}</g>`;
  }
  TT.Hands = class {
    constructor(container) {
      this.el = document.createElement('div');
      this.el.className = 'hands';
      this.el.innerHTML = `
        <svg viewBox="0 0 392 180" aria-hidden="true">${handSVG('l')}${handSVG('r')}</svg>
        <div class="hands-label"></div>`;
      container.appendChild(this.el);
      this.label = this.el.querySelector('.hands-label');
    }
    highlight(fingers) {
      this.el.querySelectorAll('.finger').forEach((n) => n.classList.toggle('on', fingers.includes(n.dataset.f)));
      if (!fingers.length) { this.label.innerHTML = '&nbsp;'; return; }
      const names = fingers.map((f) => TT.fingerNames[f]);
      this.label.innerHTML = fingers.length > 1
        ? `Usá el <b>${names[0]}</b> + <b>Shift</b> con el <b>${names[1]}</b>`
        : `Usá el <b>${names[0]}</b>`;
    }
  };
})();
