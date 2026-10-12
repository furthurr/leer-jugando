/* Escucha y elige: suena el modelo y el niño toca la opción correcta. */
(function (raiz) {
  'use strict';
  const { el, animar } = raiz.LEER.dom;

  function escuchaElige(ejercicio, ctx) {
    const rutaModelo = ctx.clavesAudio.ruta(ejercicio.modelo.categoria, ejercicio.modelo.texto);

    const botones = new Map();
    const opciones = ejercicio.opciones.map((op) => {
      const b = el('button', {
        class: 'ficha grande', texto: op,
        onclick: () => ctx.responder(op),
      });
      botones.set(op, b);
      return b;
    });

    const oreja = el('button', {
      class: 'ficha oreja', 'aria-label': 'Escuchar otra vez',
      onclick: () => ctx.reproducir(rutaModelo),
    }, el('img', { class: 'persona-hablando', src: 'assets/persona-hablando.svg', alt: '', 'aria-hidden': 'true', draggable: 'false' }));

    const nodo = el('div', { class: 'pantalla centro' },
      oreja,
      el('div', { class: 'fichas' }, ...opciones));

    return {
      nodo,
      alMostrar: () => ctx.instruccionLuego(rutaModelo),
      marcarIncorrecta: (op) => animar(botones.get(op), 'sacudir'),
      marcarPista: () => botones.get(ejercicio.objetivo).classList.add('pista'),
      marcarCorrecta: (op) => botones.get(op).classList.add('correcta'),
    };
  }

  raiz.LEER.actividades['escucha-elige'] = escuchaElige;
})(this);
