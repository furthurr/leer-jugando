/* Celebración de fin de nivel: estrellas, nombre escrito y hablado, siguiente o repetir (Req 5.4). */
(function (raiz) {
  'use strict';
  const { el } = raiz.LEER.dom;

  function celebracion(app, nivel, resultado) {
    const estado = app.estado;
    const nombre = estado.perfil.nombre;
    const variante = raiz.LEER.perfil.variante(estado.perfil.sexo);
    const ruta = (c) => app.clavesAudio.ruta('instr', c);

    const estrellas = el('div', { class: 'estrellas-grandes' },
      ...[0, 1, 2].map((i) => el('span', { class: i < resultado.estrellas ? '' : 'apagada', texto: '⭐' })));

    const haySiguiente = app.siguienteNivel(nivel.id);
    const acciones = el('div', { class: 'acciones' },
      el('button', { class: 'boton-texto', texto: '🔁 Otra vez', onclick: () => app.jugarNivel(nivel.id) }),
      el('button', { class: 'icono', texto: '🏠', 'aria-label': 'Mapa', onclick: () => app.irAMapa() }),
      haySiguiente ? el('button', { class: 'boton-grande boton-exito', texto: '👉', 'aria-label': 'Siguiente nivel', onclick: () => app.jugarNivel(haySiguiente) }) : null);

    const nodo = el('div', { class: 'pantalla centro' },
      estrellas,
      el('h1', { class: 'titulo', texto: nombre ? '¡Muy bien, ' + nombre + '!' : '¡Muy bien!' }),
      acciones);

    app.enfocar = () => {
      const pasos = [app.clavesAudio.ruta('efectos', 'fanfarria')];
      const pasoNombre = app.pasoNombre(nombre);
      if (pasoNombre) pasos.push(pasoNombre);
      pasos.push(ruta('nivel-completo-' + variante));
      app.reproductor.secuencia(pasos, 150);
    };

    return nodo;
  }

  raiz.LEER.pantallas.celebracion = celebracion;
})(this);
