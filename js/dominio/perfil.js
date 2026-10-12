/* Reglas del perfil del niño: nombre y variante de género para las frases. */
(function (raiz) {
  'use strict';

  const MAX = 20;
  const PATRON = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

  /** @returns {{ok:true, valor:string} | {ok:false, motivo:string}} */
  function validarNombre(texto) {
    if (typeof texto !== 'string') return { ok: false, motivo: 'vacio' };
    const valor = texto.trim().replace(/\s+/g, ' ');
    if (valor.length === 0) return { ok: false, motivo: 'vacio' };
    if (valor.length > MAX) return { ok: false, motivo: 'largo' };
    if (!PATRON.test(valor)) return { ok: false, motivo: 'caracteres' };
    return { ok: true, valor };
  }

  /** 'm' | 'f' | 'n' (neutra si no hay sexo válido). */
  function variante(sexo) {
    return sexo === 'm' || sexo === 'f' ? sexo : 'n';
  }

  const api = { validarNombre, variante, MAX };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { raiz.LEER = raiz.LEER || {}; raiz.LEER.perfil = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
