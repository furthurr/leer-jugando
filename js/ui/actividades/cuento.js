/* Cuento: una página; lectura palabra a palabra con resaltado sincronizado (Req 4.6). */
(function (raiz) {
  'use strict';
  const { el } = raiz.LEER.dom;

  function cuento(ejercicio, ctx) {
    const palabras = ctx.clavesAudio.palabrasDeTexto(ejercicio.texto);
    const botones = palabras.map((p) => el('button', {
      class: 'palabra-toque', texto: p,
      onclick: () => { ctx.detener(); ctx.reproducir(ctx.clavesAudio.ruta('palabras', p)); },
    }));

    const continuar = el('button', { class: 'boton-grande', texto: ejercicio.pagina + 1 < ejercicio.total ? '👉' : '✅', 'aria-label': 'Siguiente', onclick: () => ctx.continuar() });

    async function leerTodo() {
      const pasos = [];
      botones.forEach((b, i) => {
        pasos.push(() => { botones.forEach((x) => x.classList.remove('leyendo')); b.classList.add('leyendo'); });
        pasos.push(ctx.clavesAudio.ruta('palabras', palabras[i]));
      });
      pasos.push(() => botones.forEach((x) => x.classList.remove('leyendo')));
      await ctx.secuencia(pasos, 90);
    }

    const nodo = el('div', { class: 'pantalla centro' },
      el('div', { class: 'cuento-imagen', texto: ejercicio.imagen }),
      el('p', { class: 'cuento-texto' }, ...botones),
      el('div', { class: 'acciones' },
        el('button', { class: 'boton-texto boton-escuchar', onclick: leerTodo },
          el('img', { class: 'persona-hablando', src: 'assets/persona-hablando.svg', alt: '', 'aria-hidden': 'true', draggable: 'false' }),
          'Escuchar'),
        continuar));

    return {
      nodo,
      sinRespuesta: true,
      alMostrar() {
        if (ejercicio.pagina === 0 && ejercicio.instruccion) ctx.instruccionLuego(null).then(leerTodo);
        else leerTodo();
      },
    };
  }

  raiz.LEER.actividades.cuento = cuento;
})(this);
