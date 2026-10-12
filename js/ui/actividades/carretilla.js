/* Carretilla: la serie de una consonante (ma-me-mi-mo-mu); al tocar cada ficha suena. */
(function (raiz) {
  'use strict';
  const { el } = raiz.LEER.dom;

  /** @returns {{nodo:HTMLElement, puedeContinuar:()=>boolean}} */
  function carretilla(ejercicio, ctx) {
    const oidas = new Set();
    let continuar = () => {};
    let listo = false;

    const fichas = ejercicio.items.map((s) => el('button', {
      class: 'ficha grande', texto: s,
      onclick(ev) {
        ctx.reproducir(ctx.clavesAudio.ruta(ejercicio.categoria, s));
        oidas.add(s);
        ev.currentTarget.classList.add('oida');
        if (!listo && oidas.size === ejercicio.items.length) { listo = true; continuar(); }
      },
    }));

    const nodo = el('div', { class: 'pantalla centro' },
      el('div', { class: 'tren' }, el('span', { class: 'locomotora', texto: '🚂' }), ...fichas));

    return {
      nodo,
      alMostrar() {
        if (ejercicio.letra) ctx.instruccionLuego(ctx.clavesAudio.ruta('letras', ejercicio.letra));
        else ctx.instruccion();
      },
      /** Carretilla no se "falla": el botón siguiente aparece al oír todas. */
      sinRespuesta: true,
      onListo(fn) { continuar = fn; },
      puedeContinuar: () => oidas.size === ejercicio.items.length,
    };
  }

  raiz.LEER.actividades.carretilla = carretilla;
})(this);
