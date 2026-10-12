/* Teclanauta — estadísticas y medallas */
(function () {
  const TT = window.TT;
  TT.screens = TT.screens || {};

  const MODE = {
    leccion: { name: 'Lección', cls: 'm-lessons' },
    imagen: { name: 'Adivina la imagen', cls: 'm-image' },
    lluvia: { name: 'Meteoritos', cls: 'm-rain' },
    carrera: { name: 'Carrera', cls: 'm-race' }
  };

  function chartSVG(hist) {
    const data = hist.slice(-30);
    if (data.length < 2) return '<p class="muted center">Jugá al menos dos partidas para ver tu evolución.</p>';
    const W = 640, H = 220, P = { l: 36, r: 12, t: 14, b: 26 };
    const max = Math.max(20, Math.ceil(Math.max(...data.map((d) => d.ppm)) / 10) * 10);
    const x = (i) => P.l + (i / (data.length - 1)) * (W - P.l - P.r);
    const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
    const grid = [];
    for (let v = 0; v <= max; v += max / 4) {
      grid.push(`<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${P.l - 8}" y="${y(v) + 4}" class="axis" text-anchor="end">${Math.round(v)}</text>`);
    }
    const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.ppm).toFixed(1)}`).join(' ');
    const area = `${path} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
    const dots = data.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.ppm)}" r="4.5" class="dot ${MODE[d.mode] ? MODE[d.mode].cls : ''}"><title>${MODE[d.mode] ? MODE[d.mode].name : d.mode}: ${d.ppm} PPM · ${d.acc}% · ${d.d}</title></circle>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de tus PPM">
      <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee" stop-opacity=".35"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></linearGradient></defs>
      ${grid.join('')}
      <path d="${area}" fill="url(#ga)"/>
      <path d="${path}" class="line"/>
      ${dots}
      <text x="${P.l}" y="${H - 6}" class="axis">más antigua</text>
      <text x="${W - P.r}" y="${H - 6}" class="axis" text-anchor="end">más reciente</text>
    </svg>`;
  }

  // Agrupa estadísticas por tecla física (á cuenta como A, mayúsculas como su letra)
  function byPhysicalKey(ks) {
    const out = {};
    Object.keys(ks).forEach((c) => {
      const info = TT.charInfo(c);
      if (!info) return;
      const id = c === ' ' ? ' ' : info.key.k;
      if (!id) return;
      out[id] = out[id] || { h: 0, e: 0 };
      out[id].h += ks[c].h; out[id].e += ks[c].e;
    });
    return out;
  }

  function weakKeys(ks) {
    return Object.keys(ks)
      .filter((c) => c !== ' ' && ks[c].h + ks[c].e >= 8)
      .map((c) => ({ c, rate: ks[c].e / (ks[c].h + ks[c].e), n: ks[c].h + ks[c].e }))
      .filter((x) => x.rate > 0.02)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 6);
  }

  TT.screens.estadisticas = {
    render(app) {
      const S = TT.state;
      const recent = S.history.slice(-20);
      const avgAcc = recent.length ? Math.round(recent.reduce((a, h) => a + h.acc, 0) / recent.length) : 0;
      const avgPpm = recent.length ? Math.round(recent.reduce((a, h) => a + h.ppm, 0) / recent.length) : 0;
      const weak = weakKeys(S.keyStats);
      app.innerHTML = `
        <div class="page-head">
          <button class="btn ghost" data-go="inicio">← Inicio</button>
          <div><p class="eyebrow">Bitácora de vuelo</p><h1>📊 Estadísticas</h1></div>
        </div>
        <div class="stat-cards">
          <div class="panel sc"><b>${S.records.mejorPpm}</b><span>Mejor PPM</span></div>
          <div class="panel sc"><b>${avgPpm}</b><span>PPM promedio (últimas 20)</span></div>
          <div class="panel sc"><b>${avgAcc}%</b><span>Precisión promedio</span></div>
          <div class="panel sc"><b>${S.totals.chars.toLocaleString('es')}</b><span>Letras escritas</span></div>
          <div class="panel sc"><b>${TT.fmtTime(S.totals.timeMs)}</b><span>Tiempo escribiendo</span></div>
          <div class="panel sc"><b>${S.totals.games}</b><span>Partidas jugadas</span></div>
        </div>
        <div class="panel">
          <h3>📈 Tu velocidad en las últimas partidas</h3>
          ${chartSVG(S.history)}
          <div class="legend">${Object.values(MODE).map((m) => `<span><i class="dot ${m.cls}"></i>${m.name}</span>`).join('')}</div>
        </div>
        <div class="two-col">
          <div class="panel">
            <h3>🌡️ Mapa de errores del teclado</h3>
            <p class="muted small">Verde = casi sin errores · Rojo = muchos errores · Gris = todavía sin datos. Pasá el mouse por una tecla para ver el detalle.</p>
            <div class="kb-host"></div>
            <div class="heat-legend"><span class="heat-0"></span><span class="heat-1"></span><span class="heat-2"></span><span class="heat-3"></span><span class="heat-4"></span></div>
          </div>
          <div class="panel">
            <h3>🩺 Teclas a mejorar</h3>
            ${weak.length ? `
              <ul class="weak-list">${weak.map((w) => {
                const info = TT.charInfo(w.c);
                return `<li><kbd class="${info ? TT.fingerClass(info.key.f) : ''}">${TT.esc(w.c.toUpperCase())}</kbd>
                  <div class="wbar"><i style="width:${Math.min(100, w.rate * 300)}%"></i></div>
                  <span>${Math.round(w.rate * 100)}%</span>
                  <small>${info ? TT.fingerNames[info.key.f] : ''}</small></li>`;
              }).join('')}</ul>
              <button class="btn primary" id="practice">🎯 Practicar estas teclas</button>`
              : '<p class="muted">Todavía no hay suficientes datos, o ¡no tenés teclas débiles! Seguí jugando y volvé a mirar.</p>'}
          </div>
        </div>
        <p class="center"><button class="btn ghost danger small" id="reset">Borrar todo mi progreso</button></p>`;
      const kb = new TT.Keyboard(app.querySelector('.kb-host'), { small: true });
      kb.heat(byPhysicalKey(S.keyStats));
      const pr = app.querySelector('#practice');
      if (pr) pr.addEventListener('click', () => TT.go('leccion', { custom: TT.weakLesson(weak.map((w) => w.c)) }));
      app.querySelector('#reset').addEventListener('click', () => {
        if (window.confirm('¿Seguro? Se borran tus lecciones, récords, medallas y estadísticas. No se puede deshacer.')) {
          TT.resetAll();
          TT.go('inicio');
        }
      });
    }
  };

  TT.screens.logros = {
    render(app) {
      const S = TT.state;
      const got = TT.achievements.filter((a) => S.achievements[a.id]).length;
      app.innerHTML = `
        <div class="page-head">
          <button class="btn ghost" data-go="inicio">← Inicio</button>
          <div><p class="eyebrow">Colección</p><h1>🏅 Medallas</h1></div>
          <div class="best-badge"><small>Conseguidas</small><b>${got} / ${TT.achievements.length}</b></div>
        </div>
        <div class="pbar big medal-progress"><i style="width:${(got / TT.achievements.length) * 100}%"></i></div>
        <div class="medal-grid">
          ${TT.achievements.map((a) => {
            const d = S.achievements[a.id];
            return `<div class="medal ${d ? 'on' : ''}">
              <div class="medal-icon">${d ? a.icon : '🔒'}</div>
              <div class="medal-name">${a.name}</div>
              <div class="medal-desc">${a.desc}</div>
              ${d ? `<div class="medal-date">${d.split('-').reverse().join('/')}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
        <h2 class="section-title">Rangos</h2>
        <div class="rank-path">
          ${TT.data.ranks.map((r) => `<div class="rp ${S.xp >= r.xp ? 'on' : ''}"><span>${r.icon}</span><b>${r.name}</b><small>${r.xp.toLocaleString('es')} XP</small></div>`).join('')}
        </div>`;
    }
  };
})();
