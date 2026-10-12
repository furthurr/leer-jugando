/* Saludo inicial: "¡Hola! <Nombre> ¡Bienvenido/a!" con nombre escrito y hablado (Req 9.7-9.9). */
(function (raiz) {
  'use strict';
  const { el } = raiz.LEER.dom;

  function saludo(app) {
    const estado = app.estado;
    const nombre = estado.perfil.nombre;
    const variante = raiz.LEER.perfil.variante(estado.perfil.sexo);
    const ruta = (clave) => app.clavesAudio.ruta('instr', clave);

    const nodo = el('div', { class: 'pantalla centro' },
      el('div', { class: 'emoji-gigante', texto: '🎉' }),
      el('h1', { class: 'titulo', texto: nombre ? '¡Hola, ' + nombre + '!' : '¡Hola!' }),
      el('button', { class: 'boton-grande', texto: 'Vamos ▶', onclick: () => app.irAMapa() }));

    app.enfocar = () => {
      // "¡Hola!" → nombre (MP3 de Google si está grabado) → "¡Bienvenido/a!".
      const pasos = [ruta('hola')];
      const pasoNombre = app.pasoNombre(nombre);
      if (pasoNombre) pasos.push(pasoNombre);
      pasos.push(ruta('bienvenida-' + variante));
      app.reproductor.secuencia(pasos, 120);
    };

    return nodo;
  }

  raiz.LEER.pantallas.saludo = saludo;
})(this);
