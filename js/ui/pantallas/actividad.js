/* Pantalla de actividad: recorre los ejercicios del nivel y conecta cada uno con la sesión. */
(function (raiz) {
  'use strict';
  const { el, esperar } = raiz.LEER.dom;

  function actividad(app, nivelId) {
    const nivel = app.contenido.niveles.find((n) => n.id === nivelId);
    const sesion = app.sesion.crear(nivel, app.contenido, Math.random);

    const rutaInstr = (clave) => app.clavesAudio.ruta('instr', clave);
    const detener = () => app.reproductor.detener();
    /** Ruta del sonido modelo del ejercicio (lo que el niño debe reconocer). */
    const rutaModelo = (ejercicio) => ejercicio.modelo
      ? app.clavesAudio.ruta(ejercicio.modelo.categoria, ejercicio.modelo.texto)
      : null;

    const casa = el('button', { class: 'icono', texto: '🏠', 'aria-label': 'Volver al mapa', onclick: () => app.irAMapa() });
    const puntos = el('div', { class: 'puntos' });
    const altavoz = el('button', { class: 'icono', 'aria-label': 'Repetir instrucción' },
      el('img', { class: 'persona-hablando', src: 'assets/persona-hablando.svg', alt: '', 'aria-hidden': 'true', draggable: 'false' }));
    const barra = el('div', { class: 'barra' }, casa, puntos, altavoz);
    const zona = el('div', { class: 'zona-ejercicio' });
    const nodo = el('div', { class: 'pantalla' }, barra, zona);

    function pintarPuntos() {
      puntos.textContent = '';
      sesion.ejercicios.forEach((_, i) => {
        const clase = i < sesion.indice() ? 'punto hecho' : i === sesion.indice() ? 'punto actual' : 'punto';
        puntos.append(el('span', { class: clase }));
      });
    }

    let vista = null;

    // Contexto que cada actividad recibe (inyección, no acceso global).
    function contextoPara(ejercicio) {
      const instruccion = () => app.reproductor.reproducir(rutaInstr(ejercicio.instruccion));
      return {
        clavesAudio: app.clavesAudio,
        reproducir: (ruta) => app.reproductor.reproducir(ruta),
        secuencia: (pasos, pausa) => app.reproductor.secuencia(pasos, pausa),
        detener,
        instruccion,
        instruccionLuego: (rutaModelo) => app.reproductor.secuencia([ejercicio.instruccion ? rutaInstr(ejercicio.instruccion) : null, rutaModelo], 150),
        paso: () => sesion.paso(),
        responder: (resp) => manejarRespuesta(resp, ejercicio),
        continuar: () => siguiente(),
      };
    }

    async function manejarRespuesta(respuesta, ejercicio) {
      const r = sesion.responder(respuesta);
      if (r.parcial) return r;
      if (r.correcto) {
        if (vista.marcarCorrecta) vista.marcarCorrecta(respuesta);
        // Esperar a que termine cada audio, con tope de seguridad: si el navegador
        // no dispara "ended" (p. ej. en file://), no debe quedarse bloqueado.
        await Promise.race([app.reproductor.reproducir(app.clavesAudio.ruta('efectos', 'acierto')), esperar(2000)]);
        await Promise.race([app.reproductor.reproducir(rutaInstr(app.felicitacionAleatoria())), esperar(5000)]);
        await esperar(250);
        avanzar(r.fin);
      } else {
        if (vista.marcarIncorrecta) vista.marcarIncorrecta(respuesta);
        if (r.pista) {
          // Pista (Req 5.3): resaltar la correcta y volver a reproducir el sonido modelo.
          const modelo = rutaModelo(ejercicio);
          app.reproductor.secuencia(
            [app.clavesAudio.ruta('efectos', 'casi'), rutaInstr('pista'), modelo].filter(Boolean),
            150,
          );
          if (vista.marcarPista) vista.marcarPista();
        } else {
          app.reproductor.secuencia([app.clavesAudio.ruta('efectos', 'casi'), rutaInstr('casi')], 120);
        }
      }
      return r;
    }

    function avanzar(forzarFin) {
      const fin = forzarFin === true || sesion.indice() >= sesion.ejercicios.length;
      if (fin) { app.terminarNivel(nivel, sesion.resultado()); return; }
      mostrarActual();
    }

    /** Carretilla y cuento no se "responden": hay que cerrar el ejercicio en la sesión antes de avanzar. */
    function siguiente() {
      detener();
      const r = sesion.completar();
      avanzar(r.fin);
    }

    function mostrarActual() {
      const ejercicio = sesion.actual();
      if (!ejercicio) { app.terminarNivel(nivel, sesion.resultado()); return; }
      const fabrica = raiz.LEER.actividades[ejercicio.tipo];
      vista = fabrica(ejercicio, contextoPara(ejercicio));
      zona.textContent = '';
      zona.append(vista.nodo);
      pintarPuntos();
      altavoz.onclick = () => (vista.alMostrar ? vista.alMostrar() : app.reproductor.reproducir(rutaInstr(ejercicio.instruccion)));

      // Carretilla y cuento no se "responden": avanzan con su propio botón al terminar.
      siguienteMostrado = false;
      if (vista.onListo) vista.onListo(() => mostrarSiguiente());
      if (vista.alMostrar) vista.alMostrar();
    }

    let siguienteMostrado = false;
    function mostrarSiguiente() {
      if (siguienteMostrado) return;
      siguienteMostrado = true;
      zona.append(botonSiguiente());
    }

    function botonSiguiente() {
      return el('div', { class: 'acciones' }, el('button', { class: 'boton-grande boton-exito', texto: '👉', 'aria-label': 'Siguiente', onclick: () => siguiente() }));
    }

    app.enfocar = mostrarActual;
    return nodo;
  }

  raiz.LEER.pantallas.actividad = actividad;
})(this);
