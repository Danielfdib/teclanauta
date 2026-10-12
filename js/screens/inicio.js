/* Teclanauta — pantalla de inicio */
(function () {
  const TT = window.TT;
  TT.screens = TT.screens || {};

  TT.screens.inicio = {
    render(app) {
      const S = TT.state;
      const L = TT.data.lessons;
      const done = L.filter((l) => S.lessons[l.id] && S.lessons[l.id].stars > 0).length;
      const stars = Object.values(S.lessons).reduce((a, l) => a + (l.stars || 0), 0);
      const medals = Object.keys(S.achievements).length;
      const next = L.find((l) => !(S.lessons[l.id] && S.lessons[l.id].stars > 0));
      const first = done === 0;

      app.innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <p class="eyebrow">Academia espacial de mecanografía</p>
          <h1>Aprendé a escribir <span class="glow">sin mirar el teclado</span></h1>
          <p class="lead">Entrená tus diez dedos con lecciones guiadas y juegos. Cada misión te da experiencia para subir de rango: de <b>Cadete espacial</b> a <b>Leyenda galáctica</b>.</p>
          <div class="hero-actions">
            ${next
              ? `<button class="btn primary big" data-go="leccion" data-id="${next.id}">${first ? '🚀 Empezar la primera lección' : `▶ Seguir: Lección ${next.id}`}</button>`
              : '<button class="btn primary big" data-go="lecciones">🎓 ¡Completaste todo! Repasar lecciones</button>'}
            <button class="btn ghost big" data-go="lecciones">Ver todas las lecciones</button>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="orbit o1"><span>🪐</span></div>
          <div class="orbit o2"><span>🛰️</span></div>
          <div class="planet"></div>
          <div class="astro">🧑‍🚀</div>
        </div>
      </section>

      <h2 class="section-title">Misiones</h2>
      <section class="missions">
        <button class="mission m-lessons" data-go="lecciones">
          <span class="m-icon">⌨️</span>
          <span class="m-title">Lecciones guiadas</span>
          <span class="m-desc">Aprendé dónde va cada dedo, fila por fila, con el teclado y las manos en pantalla.</span>
          <span class="m-foot"><span class="pbar"><i style="width:${(done / L.length) * 100}%"></i></span>${done}/${L.length} · ⭐ ${stars}</span>
        </button>
        <button class="mission m-image" data-go="imagen">
          <span class="m-icon">🦇</span>
          <span class="m-title">Adivina la imagen</span>
          <span class="m-desc">Aparece un dibujo y tenés que escribir su nombre. ¡Ojo con las tildes!</span>
          <span class="m-foot">🏆 Récord: <b>${S.records.imagen.toLocaleString('es')}</b></span>
        </button>
        <button class="mission m-rain" data-go="lluvia">
          <span class="m-icon">☄️</span>
          <span class="m-title">Lluvia de meteoritos</span>
          <span class="m-desc">Destruí los meteoritos escribiendo su palabra antes de que lleguen al planeta.</span>
          <span class="m-foot">🏆 Récord: <b>${S.records.lluvia.toLocaleString('es')}</b> · Nivel ${S.records.lluviaNivel || 0}</span>
        </button>
        <button class="mission m-race" data-go="carrera">
          <span class="m-icon">🏁</span>
          <span class="m-title">Carrera espacial</span>
          <span class="m-desc">Competí contra naves rivales o desafiá el reloj en 60 segundos.</span>
          <span class="m-foot">🥇 ${S.records.carreraVictorias} victorias · ⏱ ${S.records.contrarreloj} PPM</span>
        </button>
      </section>

      <section class="two-col">
        <div class="panel tips">
          <h3>🧑‍🚀 Antes de despegar</h3>
          <ul class="tip-list">
            <li><span>🪑</span><div><b>Sentate derecho</b>, con los pies apoyados y la pantalla a la altura de los ojos.</div></li>
            <li><span>✋</span><div><b>Dedos en la fila base:</b> A S D F con la mano izquierda y J K L Ñ con la derecha.</div></li>
            <li><span>👆</span><div>Buscá las <b>rayitas en F y J</b>: así encontrás la posición sin mirar.</div></li>
            <li><span>👀</span><div><b>Mirá la pantalla</b>, no el teclado. Al principio cuesta, después es magia.</div></li>
            <li><span>🎯</span><div><b>Primero precisión, después velocidad.</b> La rapidez llega sola con la práctica.</div></li>
            <li><span>⏱️</span><div>Mejor <b>10 minutos todos los días</b> que una hora una vez por semana.</div></li>
          </ul>
        </div>
        <div class="panel side-stats">
          <h3>📡 Tu bitácora</h3>
          <div class="mini-stats">
            <div><b>${S.records.mejorPpm}</b><span>Mejor PPM</span></div>
            <div><b>${S.totals.chars.toLocaleString('es')}</b><span>Letras escritas</span></div>
            <div><b>${medals}/${TT.achievements.length}</b><span>Medallas</span></div>
            <div><b>${S.days.length}</b><span>Días practicando</span></div>
          </div>
          <p class="muted small">PPM = palabras por minuto. Una “palabra” son 5 teclas, así se mide en todo el mundo.</p>
          <div class="btn-row">
            <button class="btn" data-go="logros">🏅 Medallas</button>
            <button class="btn" data-go="estadisticas">📊 Estadísticas</button>
          </div>
        </div>
      </section>`;
    }
  };
})();
