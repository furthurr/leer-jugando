/* Une letras: arrastrar (o tocar y tocar) la consonante hasta una vocal para formar la sílaba. */
(function (raiz) {
  'use strict';
  const { el, animar } = raiz.LEER.dom;

  function uneLetras(ejercicio, ctx) {
    const rutaModelo = ctx.clavesAudio.ruta('silabas', ejercicio.silaba);
    const vocales = new Map();
    let resuelto = false;

    const resultado = el('div', { class: 'resultado-silaba', 'aria-live': 'polite' });

    function soltarEn(vocal) {
      if (resuelto) return;
      if (vocal === ejercicio.objetivo) {
        resuelto = true;
        resultado.textContent = ejercicio.consonante + vocal;
        vocales.get(vocal).classList.add('correcta');
        ctx.reproducir(rutaModelo);
        ctx.responder(vocal);
      } else {
        animar(vocales.get(vocal), 'sacudir');
        ctx.responder(vocal);
      }
    }

    const botonesVocal = ejercicio.opciones.map((v) => {
      const b = el('button', { class: 'ficha', texto: v, dataset: { vocal: v } });
      b.addEventListener('click', () => { if (seleccionada) { soltarEn(v); limpiarSeleccion(); } });
      vocales.set(v, b);
      return b;
    });

    const consonante = el('button', { class: 'ficha consonante', texto: ejercicio.consonante });

    // Modo toque-toque (dedos pequeños): tocar consonante y luego la vocal.
    let seleccionada = false;
    const limpiarSeleccion = () => { seleccionada = false; consonante.classList.remove('seleccionada'); };
    consonante.addEventListener('click', () => {
      seleccionada = !seleccionada;
      consonante.classList.toggle('seleccionada', seleccionada);
    });

    // Modo arrastre con Pointer Events (toque y ratón).
    consonante.addEventListener('pointerdown', (ev) => {
      if (resuelto) return;
      ev.preventDefault();
      const fantasma = consonante.cloneNode(true);
      fantasma.classList.add('arrastrando');
      const r = consonante.getBoundingClientRect();
      const mover = (e) => {
        fantasma.style.left = (e.clientX - r.width / 2) + 'px';
        fantasma.style.top = (e.clientY - r.height / 2) + 'px';
      };
      mover(ev);
      document.body.append(fantasma);
      consonante.setPointerCapture(ev.pointerId);
      const alMover = (e) => mover(e);
      const alSoltar = (e) => {
        consonante.removeEventListener('pointermove', alMover);
        consonante.removeEventListener('pointerup', alSoltar);
        fantasma.remove();
        const destino = document.elementFromPoint(e.clientX, e.clientY);
        const caja = destino && destino.closest('[data-vocal]');
        if (caja) soltarEn(caja.dataset.vocal);
      };
      consonante.addEventListener('pointermove', alMover);
      consonante.addEventListener('pointerup', alSoltar);
    });

    const nodo = el('div', { class: 'pantalla centro' },
      el('button', { class: 'ficha oreja', 'aria-label': 'Escuchar la sílaba', onclick: () => ctx.reproducir(rutaModelo) },
        el('img', { class: 'persona-hablando', src: 'assets/persona-hablando.svg', alt: '', 'aria-hidden': 'true', draggable: 'false' })),
      el('div', { class: 'une' },
        consonante,
        el('div', { class: 'vocales' }, ...botonesVocal),
        resultado));

    return {
      nodo,
      alMostrar: () => ctx.instruccionLuego(rutaModelo),
      marcarPista: () => vocales.get(ejercicio.objetivo).classList.add('pista'),
    };
  }

  raiz.LEER.actividades['une-letras'] = uneLetras;
})(this);
