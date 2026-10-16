/* Pantalla de inicio: un botón grande que, al tocarlo, desbloquea el audio (Req 2.5). */
(function (raiz) {
  'use strict';
  const { el } = raiz.LEER.dom;

  function inicio(app) {
    const jugar = el('button', {
      class: 'boton-grande', texto: '▶ Jugar',
      onclick() {
        jugar.disabled = true;
        // Algunos WebViews móviles dejan pendiente la promesa de play() aunque
        // el audio ya se haya iniciado. El desbloqueo no debe bloquear la app.
        app.reproductor.desbloquear();
        app.audioListo = true;
        app.continuarDesdeInicio();
      },
    });

    return el('div', { class: 'pantalla centro' },
      el('div', { class: 'emoji-gigante', texto: '📚✨' }),
      el('h1', { class: 'titulo', texto: 'Leer jugando' }),
      jugar);
  }

  raiz.LEER.pantallas.inicio = inicio;
})(this);
