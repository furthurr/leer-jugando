/* Único módulo que toca el almacenamiento del navegador. */
(function (raiz) {
  'use strict';

  const progreso = typeof module !== 'undefined' && module.exports
    ? require('../dominio/progreso.js')
    : raiz.LEER.progreso;

  const CLAVE = 'leer.v1';

  /**
   * @param {Storage|null} storage  normalmente window.localStorage (inyectado)
   * @param {{warn: Function}} registro  normalmente console
   */
  function crearAlmacen(storage, registro) {
    return {
      /** @returns {{ok:boolean, datos:object}} siempre con un estado válido. */
      cargar() {
        if (!storage) return { ok: false, datos: progreso.inicial() };
        try {
          const crudo = storage.getItem(CLAVE);
          if (crudo === null) return { ok: true, datos: progreso.inicial() };
          return { ok: true, datos: progreso.normalizar(JSON.parse(crudo)) };
        } catch (err) {
          registro.warn('[almacen] progreso ilegible, se empieza de cero:', err && err.message);
          return { ok: false, datos: progreso.inicial() };
        }
      },

      /** @returns {{ok:boolean}} */
      guardar(estado) {
        if (!storage) return { ok: false };
        try {
          storage.setItem(CLAVE, JSON.stringify(estado));
          return { ok: true };
        } catch (err) {
          registro.warn('[almacen] no se pudo guardar:', err && err.message);
          return { ok: false };
        }
      },
    };
  }

  const api = { crearAlmacen, CLAVE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { raiz.LEER = raiz.LEER || {}; raiz.LEER.almacen = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
