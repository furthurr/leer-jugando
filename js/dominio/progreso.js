/* Estado del jugador: desbloqueo, estrellas, perfil y volumen. Funciones puras e inmutables. */
(function (raiz) {
  'use strict';

  const perfilApi = typeof module !== 'undefined' && module.exports
    ? require('./perfil.js')
    : raiz.LEER.perfil;

  const VERSION = 1;

  function inicial() {
    return {
      version: VERSION,
      perfil: { nombre: null, sexo: null },
      perfilListo: false,
      niveles: {},
      todoDesbloqueado: false,
      volumen: 0.9,
    };
  }

  const limitar = (n, min, max) => Math.min(max, Math.max(min, n));

  function calcularEstrellas(aciertosPrimerIntento, total) {
    if (!total) return 1;
    const p = aciertosPrimerIntento / total;
    if (p >= 0.9) return 3;
    if (p >= 0.6) return 2;
    return 1;
  }

  function estaDesbloqueado(orden, id, estado) {
    const i = orden.indexOf(id);
    if (i < 0) return false;
    if (i === 0 || estado.todoDesbloqueado) return true;
    return orden.slice(0, i).every((anterior) => Boolean(estado.niveles[anterior]));
  }

  function registrar(estado, id, estrellas) {
    const nuevas = limitar(Math.round(Number(estrellas) || 1), 1, 3);
    const previas = estado.niveles[id] ? estado.niveles[id].estrellas : 0;
    return {
      ...estado,
      niveles: { ...estado.niveles, [id]: { estrellas: Math.max(previas, nuevas) } },
    };
  }

  function totalEstrellas(estado) {
    return Object.values(estado.niveles).reduce((s, n) => s + n.estrellas, 0);
  }

  function conPerfil(estado, { nombre, sexo }) {
    const v = perfilApi.validarNombre(nombre);
    return {
      ...estado,
      perfil: { nombre: v.ok ? v.valor : null, sexo: sexo === 'm' || sexo === 'f' ? sexo : null },
      perfilListo: true,
    };
  }

  function tienePerfil(estado) {
    return estado.perfilListo === true;
  }

  function reiniciar(estado) {
    return { ...estado, niveles: {}, todoDesbloqueado: false };
  }

  /** Convierte cualquier dato leído del almacenamiento en un estado válido. */
  function normalizar(datos) {
    const base = inicial();
    if (!datos || typeof datos !== 'object' || datos.version !== VERSION) return base;

    const niveles = {};
    if (datos.niveles && typeof datos.niveles === 'object') {
      for (const [id, n] of Object.entries(datos.niveles)) {
        const e = n && n.estrellas;
        if (Number.isInteger(e) && e >= 1 && e <= 3) niveles[id] = { estrellas: e };
      }
    }
    const vol = Number(datos.volumen);
    const p = datos.perfil || {};
    const conP = conPerfil(base, p);

    return {
      ...base,
      perfil: conP.perfil,
      perfilListo: datos.perfilListo === true,
      niveles,
      todoDesbloqueado: datos.todoDesbloqueado === true,
      volumen: Number.isFinite(vol) ? limitar(vol, 0, 1) : base.volumen,
    };
  }

  const api = {
    inicial, calcularEstrellas, estaDesbloqueado, registrar, totalEstrellas,
    conPerfil, tienePerfil, reiniciar, normalizar, VERSION,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { raiz.LEER = raiz.LEER || {}; raiz.LEER.progreso = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
