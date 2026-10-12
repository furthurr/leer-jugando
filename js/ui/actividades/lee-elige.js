/* Lee y elige: palabra o frase escrita + imágenes; se toca la que corresponde. */
(function (raiz) {
  'use strict';
  const { el, animar } = raiz.LEER.dom;

  function leeElige(ejercicio, ctx) {
    const categoria = ejercicio.tipo === 'lee-elige-frase' ? 'frases' : 'palabras';
    const rutaModelo = ctx.clavesAudio.ruta(categoria, ejercicio.objetivo);

    // Texto con cada palabra tocable para oírla (Req 2.3).
    const palabras = ctx.clavesAudio.palabrasDeTexto(ejercicio.texto);
    const textoNodo = el('p', { class: 'texto-lectura' },
      ...palabras.map((p) => el('button', {
        class: 'palabra-toque', texto: p,
        onclick: () => ctx.reproducir(ctx.clavesAudio.ruta('palabras', p)),
      })));

    const botones = new Map();
    const opciones = ejercicio.opciones.map((op) => {
      const b = el('button', {
        class: 'imagen-opcion', texto: ejercicio.imagenes[op],
        'aria-label': 'Elegir ' + op, onclick: () => ctx.responder(op),
      });
      botones.set(op, b);
      return b;
    });

    const nodo = el('div', { class: 'pantalla centro' },
      el('div', { class: 'fichas' },
        el('button', { class: 'ficha oreja', 'aria-label': 'Escuchar', onclick: () => ctx.reproducir(rutaModelo) },
          el('img', { class: 'persona-hablando', src: 'assets/persona-hablando.svg', alt: '', 'aria-hidden': 'true', draggable: 'false' })),
        textoNodo),
      el('div', { class: 'fichas' }, ...opciones));

    return {
      nodo,
      alMostrar: () => ctx.instruccion(),
      marcarIncorrecta: (op) => animar(botones.get(op), 'sacudir'),
      marcarPista: () => botones.get(ejercicio.objetivo).classList.add('pista'),
      marcarCorrecta: (op) => botones.get(op).classList.add('correcta'),
    };
  }

  raiz.LEER.actividades['lee-elige-palabra'] = leeElige;
  raiz.LEER.actividades['lee-elige-frase'] = leeElige;

  // La pregunta de comprensión del cuento reutiliza la misma mecánica (imágenes).
  function pregunta(ejercicio, ctx) {
    const botones = new Map();
    const opciones = ejercicio.opciones.map((op) => {
      const b = el('button', { class: 'imagen-opcion', texto: ejercicio.imagenes[op], 'aria-label': 'Elegir', onclick: () => ctx.responder(op) });
      botones.set(op, b);
      return b;
    });
    const rutaPregunta = ctx.clavesAudio.ruta('instr', ejercicio.instruccion);
    const nodo = el('div', { class: 'pantalla centro' },
      el('button', { class: 'ficha oreja', texto: '❓', 'aria-label': 'Repetir la pregunta', onclick: () => ctx.reproducir(rutaPregunta) }),
      el('div', { class: 'fichas' }, ...opciones));
    return {
      nodo,
      alMostrar: () => ctx.reproducir(rutaPregunta),
      marcarIncorrecta: (op) => animar(botones.get(op), 'sacudir'),
      marcarPista: () => botones.get(ejercicio.objetivo).classList.add('pista'),
      marcarCorrecta: (op) => botones.get(op).classList.add('correcta'),
    };
  }
  raiz.LEER.actividades.pregunta = pregunta;
})(this);
