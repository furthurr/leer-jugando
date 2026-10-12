/* Arma la palabra: dibujo + sílabas desordenadas que se colocan en orden. */
(function (raiz) {
  'use strict';
  const { el, animar } = raiz.LEER.dom;

  function armaPalabra(ejercicio, ctx) {
    const rutaModelo = ctx.clavesAudio.ruta('palabras', ejercicio.palabra);

    const huecos = ejercicio.objetivo.map(() => el('div', { class: 'hueco' }));
    const bancoFichas = new Map();

    function colocar(silaba, boton) {
      if (boton.classList.contains('usada')) return;
      const esperada = ejercicio.objetivo[ctx.paso()];
      if (silaba !== esperada) {
        // Incorrecta: solo suena el error (lo maneja la sesión) y no se selecciona.
        animar(boton, 'sacudir');
        ctx.responder(silaba);
        return;
      }
      // Correcta: se marca como seleccionada al instante para que el niño lo vea.
      const pos = ctx.paso();
      huecos[pos].textContent = silaba;
      huecos[pos].classList.add('lleno');
      boton.classList.add('usada');
      ctx.reproducir(ctx.clavesAudio.ruta('silabas', silaba));
      ctx.responder(silaba);
    }

    const fichas = ejercicio.opciones.map((s, i) => {
      const b = el('button', { class: 'ficha', texto: s, dataset: { i }, onclick: () => colocar(s, b) });
      bancoFichas.set(i, b);
      return b;
    });

    const nodo = el('div', { class: 'pantalla centro' },
      el('button', { class: 'imagen-opcion', texto: ejercicio.imagen, 'aria-label': 'Escuchar la palabra', onclick: () => ctx.reproducir(rutaModelo) }),
      el('div', { class: 'huecos' }, ...huecos),
      el('div', { class: 'fichas' }, ...fichas));

    return {
      nodo,
      alMostrar: () => ctx.instruccion(),
      // La pista resalta la siguiente sílaba esperada.
      marcarPista() {
        const siguiente = ejercicio.objetivo[ctx.paso()];
        for (const b of fichas) if (b.textContent === siguiente && !b.classList.contains('usada')) { b.classList.add('pista'); break; }
      },
    };
  }

  raiz.LEER.actividades['arma-palabra'] = armaPalabra;
})(this);
