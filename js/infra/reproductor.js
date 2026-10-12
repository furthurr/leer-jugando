/* Reproductor de audio con un único canal: nunca suenan dos audios a la vez. */
(function (raiz) {
  'use strict';

  /**
   * @param {() => HTMLAudioElement} crearAudio  fábrica inyectada (normalmente () => new Audio())
   * @param {{warn: Function}} registro
   */
  // WAV mono de ~0.02 s en silencio, embebido. Sirve para "despertar" el audio
  // con el primer toque sin cargar ningún archivo externo.
  const SILENCIO = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

  function crearReproductor(crearAudio, registro) {
    const audio = crearAudio();
    let volumen = 0.9;
    let turno = 0;           // invalida secuencias anteriores
    let terminarActual = null;

    function detener() {
      turno++;
      audio.pause();
      if (terminarActual) { terminarActual(); terminarActual = null; }
    }

    /** Reproduce una ruta; la promesa se resuelve al terminar, al fallar o al ser interrumpida. */
    function reproducirUno(ruta) {
      return new Promise((resolver) => {
        const fin = () => {
          audio.onended = null; audio.onerror = null;
          if (terminarActual === fin) terminarActual = null;
          resolver();
        };
        terminarActual = fin;
        audio.onended = fin;
        audio.onerror = () => { registro.warn('[audio] no se encontró', ruta); fin(); };
        audio.src = ruta;
        audio.volume = volumen;
        try { audio.currentTime = 0; } catch (_) { /* algunos navegadores no lo permiten antes de cargar */ }
        const p = audio.play();
        if (p && p.catch) p.catch((err) => { if (err && err.name !== 'AbortError') registro.warn('[audio]', ruta, err.message); fin(); });
      });
    }

    function reproducir(ruta) {
      detener();
      return ruta ? reproducirUno(ruta) : Promise.resolve();
    }

    /** Reproduce varias rutas en cadena; se corta si empieza otro audio. Acepta funciones async como pasos. */
    async function secuencia(pasos, pausaMs = 0) {
      detener();
      const miTurno = turno;
      for (const paso of pasos) {
        if (turno !== miTurno) return;
        if (typeof paso === 'function') await paso();
        else if (paso) await reproducirUno(paso);
        if (pausaMs && turno === miTurno) await new Promise((r) => setTimeout(r, pausaMs));
      }
    }

    return {
      reproducir, secuencia, detener,
      ocupado: () => turno,
      setVolumen(v) { volumen = Math.min(1, Math.max(0, Number(v) || 0)); audio.volume = volumen; },
      getVolumen: () => volumen,
      /**
       * Desbloquea el audio en navegadores que exigen un gesto del usuario (Req 2.5).
       * Usa un WAV silencioso embebido (data URI) en lugar de un <audio> sin src:
       * así no intenta cargar un recurso file:// y no dispara la advertencia de
       * "unique security origin" de Chrome. Nunca rechaza, para no bloquear el inicio.
       */
      desbloquear() {
        return new Promise((resolver) => {
          try {
            audio.src = SILENCIO;
            audio.volume = 0;
            const p = audio.play();
            const listo = () => { try { audio.pause(); audio.currentTime = 0; } catch (_) {} audio.volume = volumen; resolver(); };
            if (p && p.then) p.then(listo, listo);
            else listo();
          } catch (_) { audio.volume = volumen; resolver(); }
        });
      },
    };
  }

  const api = { crearReproductor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { raiz.LEER = raiz.LEER || {}; raiz.LEER.reproductor = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
