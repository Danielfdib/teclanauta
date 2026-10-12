/* Teclanauta — núcleo: guardado, sonido, voz, rangos, logros, avisos y fondo de estrellas */
(function () {
  const TT = window.TT;

  /* ---------- Utilidades ---------- */
  TT.$ = (sel, root) => (root || document).querySelector(sel);
  TT.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  TT.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  TT.rand = (a, b) => a + Math.random() * (b - a);
  TT.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  TT.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  TT.fmtTime = (ms) => {
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m} min ${s % 60} s` : `${s} s`;
  };
  TT.today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  TT.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Guardado en el navegador ---------- */
  const KEY = 'teclanauta_v1';
  const defaults = () => ({
    xp: 0,
    lessons: {},
    records: { imagen: 0, lluvia: 0, lluviaNivel: 0, carreraVictorias: 0, contrarreloj: 0, mejorPpm: 0 },
    keyStats: {},
    history: [],
    totals: { chars: 0, timeMs: 0, meteors: 0, games: 0 },
    modes: {},
    days: [],
    achievements: {},
    settings: { sound: true, voice: true, keyboard: true }
  });
  function merge(base, over) {
    for (const k in over) {
      const b = base[k], o = over[k];
      if (o && typeof o === 'object' && !Array.isArray(o) && b && typeof b === 'object' && !Array.isArray(b)) merge(b, o);
      else base[k] = o;
    }
    return base;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return merge(defaults(), JSON.parse(raw));
    } catch (e) { /* sin almacenamiento disponible */ }
    return defaults();
  }
  TT.state = load();
  TT.save = () => { try { localStorage.setItem(KEY, JSON.stringify(TT.state)); } catch (e) { /* ignorar */ } };
  TT.resetAll = () => { TT.state = defaults(); TT.markDay(); TT.save(); TT.updateTopbar(); };
  TT.markDay = () => {
    const d = TT.today();
    if (!TT.state.days.includes(d)) { TT.state.days.push(d); TT.save(); }
  };

  /* ---------- Sonido (sintetizado, sin archivos) ---------- */
  let ctx = null;
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, when, slideTo) {
    const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol) {
    const c = ac(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(2400, c.currentTime);
    f.frequency.exponentialRampToValueAtTime(120, c.currentTime + dur);
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start();
  }
  const sounds = {
    key: () => tone(1100, 0.025, 'square', 0.025),
    error: () => tone(170, 0.18, 'sawtooth', 0.09, 0, 90),
    good: () => { tone(660, 0.08, 'triangle', 0.12); tone(990, 0.12, 'triangle', 0.12, 0.07); },
    word: () => { tone(523, 0.08, 'triangle', 0.12); tone(659, 0.08, 'triangle', 0.12, 0.06); tone(784, 0.16, 'triangle', 0.12, 0.12); },
    laser: () => tone(1500, 0.14, 'sawtooth', 0.05, 0, 220),
    boom: () => noise(0.4, 0.35),
    hit: () => { noise(0.6, 0.45); tone(110, 0.5, 'sine', 0.3, 0, 40); },
    levelup: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.06, i * 0.1)),
    win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.13, i * 0.12)),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, i * 0.18)),
    achievement: () => [880, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.22, 'sine', 0.1, i * 0.08)),
    beep: () => tone(523, 0.15, 'sine', 0.15),
    go: () => tone(1046, 0.35, 'sine', 0.18),
    click: () => tone(700, 0.04, 'triangle', 0.06)
  };
  TT.sfx = {};
  Object.keys(sounds).forEach((k) => {
    TT.sfx[k] = () => { if (TT.state.settings.sound) { try { sounds[k](); } catch (e) { /* ignorar */ } } };
  });

  /* ---------- Voz ---------- */
  let voice = null;
  function pickVoice() {
    const vs = window.speechSynthesis.getVoices();
    voice = vs.find((v) => /^es[-_](AR|419|MX|US|CO|CL)/i.test(v.lang)) || vs.find((v) => /^es/i.test(v.lang)) || null;
  }
  TT.canSpeak = 'speechSynthesis' in window;
  if (TT.canSpeak) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }
  TT.speak = (text, force) => {
    if (!TT.canSpeak) return;
    if (!force && !TT.state.settings.voice) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : 'es-ES';
    if (voice) u.voice = voice;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  /* ---------- Rangos y experiencia ---------- */
  TT.rankInfo = (xp) => {
    const R = TT.data.ranks;
    let i = 0;
    while (i + 1 < R.length && xp >= R[i + 1].xp) i++;
    const cur = R[i], next = R[i + 1] || null;
    const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
    return { rank: cur, next, progress, index: i };
  };
  TT.addXP = (n) => {
    n = Math.max(0, Math.round(n));
    const before = TT.rankInfo(TT.state.xp).index;
    TT.state.xp += n;
    TT.save();
    const after = TT.rankInfo(TT.state.xp);
    TT.updateTopbar();
    if (after.index > before) {
      setTimeout(() => {
        TT.sfx.levelup();
        TT.toast(`<span class="toast-icon">${after.rank.icon}</span><div><b>¡Ascenso!</b><br>Ahora sos <b>${after.rank.name}</b></div>`, 'rank');
      }, 600);
    }
    return n;
  };

  TT.updateTopbar = () => {
    const box = TT.$('#rankBox');
    if (!box) return;
    const info = TT.rankInfo(TT.state.xp);
    box.innerHTML = `
      <span class="rank-icon">${info.rank.icon}</span>
      <div class="rank-text">
        <div class="rank-name">${info.rank.name}</div>
        <div class="xpbar"><i style="width:${Math.round(info.progress * 100)}%"></i></div>
      </div>
      <div class="rank-xp"><b>${TT.state.xp.toLocaleString('es')}</b> XP</div>`;
    box.title = info.next ? `Faltan ${info.next.xp - TT.state.xp} XP para ${info.next.name}` : '¡Rango máximo!';
    const s = TT.$('#btnSound'), v = TT.$('#btnVoice');
    if (s) { s.textContent = TT.state.settings.sound ? '🔊' : '🔇'; s.classList.toggle('off', !TT.state.settings.sound); }
    if (v) { v.classList.toggle('off', !TT.state.settings.voice); v.style.display = TT.canSpeak ? '' : 'none'; }
  };

  /* ---------- Estadísticas ---------- */
  TT.recordKey = (ch, ok) => {
    const k = ch === ' ' ? ' ' : ch.toLowerCase();
    const ks = TT.state.keyStats;
    if (!ks[k]) ks[k] = { h: 0, e: 0 };
    if (ok) ks[k].h++; else ks[k].e++;
  };

  // Registra una partida terminada. info: {mode, ppm, acc, chars, timeMs}
  TT.recordSession = (info) => {
    const S = TT.state;
    S.history.push({ mode: info.mode, ppm: Math.round(info.ppm), acc: Math.round(info.acc), d: TT.today() });
    if (S.history.length > 80) S.history = S.history.slice(-80);
    S.totals.chars += info.chars || 0;
    S.totals.timeMs += info.timeMs || 0;
    S.totals.games += 1;
    S.modes[info.mode] = true;
    if ((info.chars || 0) >= 20 && info.ppm > S.records.mejorPpm) S.records.mejorPpm = Math.round(info.ppm);
    TT.markDay();
    TT.save();
  };

  /* ---------- Logros ---------- */
  const lessonsDone = (S, from, to) => {
    for (let i = from; i <= to; i++) if (!(S.lessons[i] && S.lessons[i].stars > 0)) return false;
    return true;
  };
  TT.achievements = [
    { id: 'despegue', icon: '🚀', name: 'Primer despegue', desc: 'Completá tu primera lección.', test: (S) => Object.values(S.lessons).some((l) => l.stars > 0) },
    { id: 'base', icon: '🏠', name: 'Base segura', desc: 'Completá las lecciones de la fila base (1 a 6).', test: (S) => lessonsDone(S, 1, 6) },
    { id: 'arriba', icon: '⬆️', name: 'Altura máxima', desc: 'Completá las lecciones de la fila superior (7 a 12).', test: (S) => lessonsDone(S, 7, 12) },
    { id: 'abajo', icon: '⬇️', name: 'Hasta el fondo', desc: 'Completá las lecciones de la fila inferior (13 a 17).', test: (S) => lessonsDone(S, 13, 17) },
    { id: 'graduado', icon: '🎓', name: 'Graduado espacial', desc: 'Completá las 22 lecciones.', test: (S) => lessonsDone(S, 1, 22) },
    { id: 'perfecto', icon: '⭐', name: 'Tres estrellas', desc: 'Conseguí 3 estrellas en una lección.', test: (S) => Object.values(S.lessons).some((l) => l.stars >= 3) },
    { id: 'tildes', icon: '✍️', name: 'Maestro de las tildes', desc: 'Completá la lección de tildes.', test: (S) => S.lessons[19] && S.lessons[19].stars > 0 },
    { id: 'ppm15', icon: '🐢', name: 'Motor encendido', desc: 'Alcanzá 15 palabras por minuto.', test: (S) => S.records.mejorPpm >= 15 },
    { id: 'ppm25', icon: '🚲', name: 'Velocidad crucero', desc: 'Alcanzá 25 palabras por minuto.', test: (S) => S.records.mejorPpm >= 25 },
    { id: 'ppm35', icon: '🏎️', name: 'Turbo', desc: 'Alcanzá 35 palabras por minuto.', test: (S) => S.records.mejorPpm >= 35 },
    { id: 'ppm50', icon: '⚡', name: 'Velocidad luz', desc: 'Alcanzá 50 palabras por minuto.', test: (S) => S.records.mejorPpm >= 50 },
    { id: 'punteria', icon: '🎯', name: 'Puntería perfecta', desc: '100% de precisión en una partida de 80 caracteres o más.', test: (S, c) => c.acc === 100 && c.chars >= 80 },
    { id: 'racha', icon: '🔥', name: 'Racha de fuego', desc: 'Escribí 50 teclas correctas seguidas.', test: (S, c) => c.streak >= 50 },
    { id: 'aguila', icon: '🦅', name: 'Ojo de águila', desc: 'Acertá las 10 imágenes de una ronda sin usar pistas.', test: (S, c) => c.imagenPerfecta },
    { id: 'defensor', icon: '🛡️', name: 'Defensor planetario', desc: 'Destruí 100 meteoritos en total.', test: (S) => S.totals.meteors >= 100 },
    { id: 'nivel5', icon: '☄️', name: 'Sobreviviente', desc: 'Llegá al nivel 5 en Lluvia de meteoritos.', test: (S) => S.records.lluviaNivel >= 5 },
    { id: 'victoria', icon: '🏁', name: 'Primera victoria', desc: 'Ganá una carrera espacial.', test: (S) => S.records.carreraVictorias >= 1 },
    { id: 'campeon', icon: '🏆', name: 'Campeón galáctico', desc: 'Ganá una carrera contra los rivales de nivel Experto.', test: (S, c) => c.ganoExperto },
    { id: 'explorador', icon: '🧭', name: 'Explorador', desc: 'Jugá los cuatro modos de juego.', test: (S) => ['leccion', 'imagen', 'lluvia', 'carrera'].every((m) => S.modes[m]) },
    { id: 'maraton', icon: '🏃', name: 'Maratonista', desc: 'Escribí 5.000 caracteres en total.', test: (S) => S.totals.chars >= 5000 },
    { id: 'constancia', icon: '📅', name: 'Constancia', desc: 'Practicá en 5 días distintos.', test: (S) => S.days.length >= 5 },
    { id: 'doctor', icon: '🩺', name: 'Autodiagnóstico', desc: 'Practicá tus teclas débiles desde Estadísticas.', test: (S, c) => c.practicaDebiles }
  ];
  TT.checkAchievements = (ctx) => {
    ctx = ctx || {};
    const S = TT.state;
    let delay = 900;
    TT.achievements.forEach((a) => {
      if (S.achievements[a.id]) return;
      let ok = false;
      try { ok = !!a.test(S, ctx); } catch (e) { ok = false; }
      if (ok) {
        S.achievements[a.id] = TT.today();
        setTimeout(() => {
          TT.sfx.achievement();
          TT.toast(`<span class="toast-icon">${a.icon}</span><div><b>¡Medalla desbloqueada!</b><br>${a.name}</div>`, 'medal');
        }, delay);
        delay += 1400;
      }
    });
    TT.save();
  };

  /* ---------- Avisos ---------- */
  TT.toast = (html, kind) => {
    const box = TT.$('#toasts');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = html;
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3800);
    setTimeout(() => t.remove(), 4400);
  };

  /* ---------- Fondo de estrellas ---------- */
  TT.starfield = function () {
    const cv = document.getElementById('stars');
    if (!cv) return;
    const g = cv.getContext('2d');
    let W, H, stars = [], shooting = null;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * DPR; cv.height = H * DPR;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      const n = Math.round((W * H) / 5000);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        z: Math.random() * 0.8 + 0.2,
        tw: Math.random() * Math.PI * 2
      }));
    }
    resize();
    window.addEventListener('resize', resize);
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.clearRect(0, 0, W, H);
      for (const s of stars) {
        if (!TT.reducedMotion) {
          s.y += s.z * 6 * dt;
          if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
          s.tw += dt * (1 + s.z * 2);
        }
        const a = 0.35 + 0.65 * s.z * (0.6 + 0.4 * Math.sin(s.tw));
        g.fillStyle = `rgba(220,230,255,${a})`;
        const r = s.z * 1.5;
        g.fillRect(s.x, s.y, r, r);
      }
      if (!TT.reducedMotion) {
        if (!shooting && Math.random() < 0.003) {
          shooting = { x: Math.random() * W * 0.7, y: Math.random() * H * 0.4, vx: 520, vy: 260, life: 1 };
        }
        if (shooting) {
          const s = shooting;
          s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * 1.4;
          const grad = g.createLinearGradient(s.x, s.y, s.x - s.vx * 0.15, s.y - s.vy * 0.15);
          grad.addColorStop(0, `rgba(255,255,255,${Math.max(0, s.life)})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          g.strokeStyle = grad; g.lineWidth = 2;
          g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - s.vx * 0.15, s.y - s.vy * 0.15); g.stroke();
          if (s.life <= 0) shooting = null;
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };
})();
