/* Teclanauta — navegación entre pantallas, teclado global y panel de resultados */
(function () {
  const TT = window.TT;
  TT.screens = TT.screens || {};
  let current = null;
  let currentName = null;

  TT.go = (name, params) => {
    if (current && current.destroy) current.destroy();
    if (TT.canSpeak) window.speechSynthesis.cancel();
    const scr = TT.screens[name] || TT.screens.inicio;
    current = scr;
    currentName = name;
    const app = TT.$('#app');
    app.innerHTML = '';
    app.className = 'screen-' + name;
    scr.render(app, params || {});
    window.scrollTo(0, 0);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    TT.$$('.nav [data-go]').forEach((b) => b.classList.toggle('active', b.dataset.go === name));
    // El hash permite usar el botón "atrás" del navegador
    const hash = '#' + name + (params && params.id ? '/' + params.id : '');
    if (location.hash !== hash) { skipHash = true; location.hash = hash; }
  };

  let skipHash = false;
  function fromHash() {
    const [name, id] = location.hash.replace('#', '').split('/');
    if (!TT.screens[name]) return TT.go('inicio');
    TT.go(name, id ? { id: isNaN(+id) ? id : +id } : {});
  }
  window.addEventListener('hashchange', () => {
    if (skipHash) { skipHash = false; return; }
    fromHash();
  });

  // Todas las teclas pasan por la pantalla activa
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || (e.ctrlKey && !e.altKey)) return; // atajos del navegador (AltGr = Ctrl+Alt se permite)
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (current && current.onKey) {
      const used = current.onKey(e);
      if (used) {
        e.preventDefault();
        if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
      }
    }
  });

  // Botones de navegación declarativos: data-go="pantalla" data-id="..."
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    TT.sfx.click();
    const params = {};
    if (b.dataset.id) params.id = isNaN(+b.dataset.id) ? b.dataset.id : +b.dataset.id;
    TT.go(b.dataset.go, params);
  });

  /* Panel de resultados reutilizable.
     cfg: icon, title, subtitle, stats [[etiqueta, valor]], xp, record, extra, buttons [{label, cls, action, key}] */
  TT.results = (container, cfg) => {
    const el = document.createElement('div');
    el.className = 'results panel pop';
    el.innerHTML = `
      <div class="res-icon">${cfg.icon || '🚀'}</div>
      <h2>${cfg.title}</h2>
      ${cfg.subtitle ? `<p class="muted">${cfg.subtitle}</p>` : ''}
      ${cfg.top || ''}
      <div class="res-stats">${(cfg.stats || []).map((s) => `<div class="stat"><div class="v">${s[1]}</div><div class="l">${s[0]}</div></div>`).join('')}</div>
      ${cfg.record ? '<div class="record">🏆 ¡Nuevo récord!</div>' : ''}
      ${cfg.xp ? `<div class="xp-gain">+<span>0</span> XP</div>` : ''}
      ${cfg.extra || ''}
      <div class="res-actions"></div>`;
    const actions = el.querySelector('.res-actions');
    (cfg.buttons || []).forEach((b) => {
      const btn = document.createElement('button');
      btn.className = 'btn ' + (b.cls || '');
      btn.innerHTML = b.label + (b.key ? ` <kbd>${b.key}</kbd>` : '');
      btn.addEventListener('click', () => { TT.sfx.click(); b.action(); });
      actions.appendChild(btn);
    });
    container.innerHTML = '';
    container.appendChild(el);
    if (cfg.xp) TT.countUp(el.querySelector('.xp-gain span'), cfg.xp, 1000);
    return el;
  };

  // Cabecera
  TT.$('#btnSound').addEventListener('click', () => {
    TT.state.settings.sound = !TT.state.settings.sound;
    TT.save(); TT.updateTopbar(); TT.sfx.click();
  });
  TT.$('#btnVoice').addEventListener('click', () => {
    TT.state.settings.voice = !TT.state.settings.voice;
    TT.save(); TT.updateTopbar();
    if (TT.state.settings.voice) TT.speak('Voz activada');
  });

  // Arranque
  TT.markDay();
  TT.updateTopbar();
  TT.starfield();
  TT.checkAchievements();
  fromHash();
})();
