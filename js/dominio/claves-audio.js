/* Convierte textos en rutas de audio estables. Compartido por el juego y las herramientas. */
(function (raiz) {
  'use strict';

  const CATEGORIAS = ['letras', 'silabas', 'palabras', 'frases', 'instr', 'efectos'];
  const TILDES = { 'á': 'a_', 'é': 'e_', 'í': 'i_', 'ó': 'o_', 'ú': 'u_', 'ü': 'u', 'ñ': 'nn' };

  /** Texto → nombre de archivo seguro. La tilde se marca con "_" para distinguir papá de papa. */
  function slug(texto) {
    return String(texto)
      .toLowerCase()
      .replace(/[áéíóúüñ]/g, (c) => TILDES[c])
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_\s-]/g, '')
      .trim()
      .replace(/[\s-]+/g, '-');
  }

  function ruta(categoria, texto) {
    if (!CATEGORIAS.includes(categoria)) throw new Error('categoría de audio desconocida: ' + categoria);
    return 'audio/' + categoria + '/' + slug(texto) + '.mp3';
  }

  /** Palabras de un texto, en minúsculas y sin signos (para el audio de cada palabra). */
  function palabrasDeTexto(texto) {
    return String(texto).toLowerCase().split(/[^a-záéíóúüñ]+/).filter(Boolean);
  }

  /** Ruta de una instrucción; si tiene variantes de género usa la de `variante` (m|f|n). */
  function rutaInstr(clave, instrucciones, variante) {
    const t = instrucciones[clave];
    return ruta('instr', t && typeof t === 'object' ? clave + '-' + variante : clave);
  }

  const api = { slug, ruta, palabrasDeTexto, rutaInstr, CATEGORIAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { raiz.LEER = raiz.LEER || {}; raiz.LEER.clavesAudio = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
