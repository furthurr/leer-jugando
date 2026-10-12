/* Voz del dispositivo para nombres que no cuentan con un MP3 pregrabado. */
(function (raiz) {
  'use strict';

  const PREFERENCIA = [/^es[-_]MX/i, /^es[-_]419/i, /^es[-_](US|CO|AR|CL|PE|VE)/i, /^es/i];

  /** @param {SpeechSynthesis|undefined} sintesis  normalmente window.speechSynthesis */
  function crearVozNombre(sintesis, registro) {
    let voz = null;

    function elegir() {
      if (!sintesis) return null;
      const voces = sintesis.getVoices() || [];
      for (const p of PREFERENCIA) {
        const v = voces.find((x) => p.test(x.lang));
        if (v) return v;
      }
      return null;
    }

    if (sintesis) {
      voz = elegir();
      if ('onvoiceschanged' in sintesis) sintesis.onvoiceschanged = () => { voz = elegir(); };
    }

    return {
      disponible: () => Boolean(voz),
      /** Promesa que se resuelve al terminar; no hace nada si no hay voz en español (Req 9.9). */
      decir(texto, volumen = 1) {
        if (!voz || !texto) return Promise.resolve();
        return new Promise((resolver) => {
          try {
            sintesis.cancel();
            const u = new raiz.SpeechSynthesisUtterance(texto);
            u.voice = voz; u.lang = voz.lang; u.rate = 0.9; u.volume = volumen;
            u.onend = resolver;
            u.onerror = () => resolver();
            sintesis.speak(u);
            setTimeout(resolver, 4000); // algunos navegadores no disparan onend
          } catch (err) {
            registro.warn('[voz] no se pudo decir el nombre:', err && err.message);
            resolver();
          }
        });
      },
    };
  }

  const api = { crearVozNombre };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { raiz.LEER = raiz.LEER || {}; raiz.LEER.vozNombre = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
