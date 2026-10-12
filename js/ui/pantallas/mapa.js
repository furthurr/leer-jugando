/* Mapa de niveles: camino con estrellas, candados y acceso a la zona de adultos (Req 3.5, 5.5, 7.1). */
(function (raiz) {
  'use strict';
  const { el, mantenerPulsado } = raiz.LEER.dom;

  function svg(tag, atributos) {
    const nodo = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(atributos).forEach(([nombre, valor]) => nodo.setAttribute(nombre, valor));
    return nodo;
  }

  function nombreActividad(nivel) {
    if (nivel.tipo === 'vocales') return 'Vocales';
    if (nivel.tipo === 'consonante') return 'Letra ' + nivel.titulo;
    if (nivel.tipo === 'palabras') return 'Palabras';
    if (nivel.tipo === 'frases') return 'Pequeñas frases';
    return 'Cuentos';
  }

  function mapa(app) {
    const estado = app.estado;
    const niveles = app.contenido.niveles;
    const orden = niveles.map((n) => n.id);

    const altura = niveles.length * 190 + 40;
    const posiciones = niveles.map((n, i) => ({ x: [280, 440, 550, 440, 280, 200][i % 6], y: 110 + i * 190 }));
    const grid = el('div', { class: 'mapa', estilo: { height: altura + 'px' } });
    const camino = svg('svg', { class: 'mapa-camino', viewBox: '0 0 800 ' + altura, preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
    let trazado = posiciones.length ? 'M ' + posiciones[0].x + ' ' + posiciones[0].y : '';
    posiciones.slice(1).forEach((p, i) => {
      const anterior = posiciones[i];
      const medio = (anterior.y + p.y) / 2;
      trazado += ' C ' + anterior.x + ' ' + medio + ', ' + p.x + ' ' + medio + ', ' + p.x + ' ' + p.y;
    });
    ['borde', 'arena', 'huellas'].forEach((clase) => camino.append(svg('path', { d: trazado, class: 'camino-' + clase })));
    grid.append(camino);
    const lista = el('ol', { class: 'mapa-paradas', 'aria-label': 'Elige un nivel de tu aventura de lectura' });
    grid.append(lista);
    let etapaActual = null;
    const siguientePorHacer = niveles.find((n) => app.progreso.estaDesbloqueado(orden, n.id, estado) && !estado.niveles[n.id]);

    niveles.forEach((n, i) => {
      const posicion = posiciones[i];
      const parada = el('li', {
        class: 'mapa-parada' + (posicion.x >= 400 ? ' parada-derecha' : '') + (siguientePorHacer && siguientePorHacer.id === n.id ? ' parada-actual' : ''),
        estilo: { left: (posicion.x / 8) + '%', top: posicion.y + 'px' },
      });
      if (n.etapa !== etapaActual) {
        etapaActual = n.etapa;
        parada.append(el('h2', { class: 'etapa-titulo', texto: app.contenido.etapas[n.etapa] }));
      }
      const desbloqueado = app.progreso.estaDesbloqueado(orden, n.id, estado);
      const estrellas = estado.niveles[n.id] ? estado.niveles[n.id].estrellas : 0;
      const esSiguiente = siguientePorHacer && siguientePorHacer.id === n.id;

      const boton = el('button', {
        class: 'nivel' + (desbloqueado ? (estado.niveles[n.id] ? ' completado' : '') : ' bloqueado') + (esSiguiente ? ' siguiente' : '') + (n.tipo === 'vocales' ? ' nivel-vocales' : '') + (n.titulo.length > 5 ? ' vocales-completas' : ''),
        'aria-label': 'Nivel ' + (i + 1) + ', ' + nombreActividad(n) + (n.tipo === 'vocales' ? ' ' + n.titulo : '') + (desbloqueado ? (estrellas ? ', ' + estrellas + ' estrellas' : ', disponible') : ', cerrado') + (esSiguiente ? ', estás aquí' : ''),
        'aria-current': esSiguiente ? 'step' : null,
        'data-nivel': n.id,
        onclick() {
          if (desbloqueado) app.jugarNivel(n.id);
          else app.reproducir(app.clavesAudio.ruta('instr', 'bloqueado'));
        },
      },
        el('span', { class: 'nivel-contenido', texto: desbloqueado ? n.titulo : '🔒', 'aria-hidden': 'true' }));
      parada.append(boton);
      if (estrellas && desbloqueado) parada.append(el('span', { class: 'estrellas', texto: '⭐'.repeat(estrellas), 'aria-hidden': 'true' }));
      parada.append(el('span', { class: 'parada-etiqueta', texto: esSiguiente ? '¡Aquí estás tú!' : nombreActividad(n), 'aria-hidden': 'true' }));
      if (esSiguiente) parada.append(el('img', { class: 'mapa-avatar', src: 'assets/aventura-personaje.svg', alt: '', 'aria-hidden': 'true' }));
      if (i % 3 === 0) parada.append(el('img', { class: 'mapa-paisaje', src: 'assets/aventura-paisaje.svg', alt: '', 'aria-hidden': 'true' }));
      lista.append(parada);
    });

    const engranaje = el('button', { class: 'icono engranaje', texto: '⚙️', 'aria-label': 'Zona de adultos (mantén pulsado)' });
    mantenerPulsado(engranaje, 3000, () => app.irAAdultos());

    const completados = niveles.filter((n) => estado.niveles[n.id]).length;
    const nodo = el('div', { class: 'pantalla pantalla-mapa' },
      el('div', { class: 'cabecera-mapa' },
        el('span', { class: 'total-estrellas', texto: '⭐ ' + app.progreso.totalEstrellas(estado) }),
        engranaje),
      el('h1', { class: 'titulo', texto: 'Mi aventura de lectura' }),
      el('p', { class: 'mapa-subtitulo', texto: 'Cada pasito, una nueva palabra' }),
      el('p', { class: 'mapa-resumen', texto: completados + ' de ' + niveles.length + ' actividades completadas' }),
      grid,
      el('p', { class: 'mapa-meta', texto: completados === niveles.length ? '¡Completaste tu aventura! Puedes volver a jugar tus niveles favoritos.' : '¡Una gran aventura empieza con una letra!' }));

    app.enfocar = () => app.reproducir(app.clavesAudio.ruta('instr', 'mapa'));
    return nodo;
  }

  raiz.LEER.pantallas.mapa = mapa;
})(this);
