/* Análisis de letras: qué letras usa un texto y qué letras conoce el niño en cada nivel. */
(function (raiz) {
  'use strict';

  const BASE = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u' };

  /** Letras de un texto en orden; "ch" cuenta como una letra, la tilde no cambia la letra. */
  function letrasDe(texto) {
    const t = String(texto).toLowerCase().replace(/[áéíóúü]/g, (c) => BASE[c]);
    const res = [];
    for (let i = 0; i < t.length; i++) {
      if (t[i] === 'c' && t[i + 1] === 'h') { res.push('ch'); i++; continue; }
      if (/[a-zñ]/.test(t[i])) res.push(t[i]);
    }
    return res;
  }

  function silabasDe(consonante, contenido) {
    const vocales = contenido.vocalesDe[consonante] || contenido.VOCALES;
    const base = consonante === 'q' ? 'qu' : consonante;
    return vocales.map((v) => base + v);
  }

  /** Textos que el niño ve escritos en cada nivel. */
  function textosDeNivel(nivel, contenido) {
    switch (nivel.tipo) {
      case 'vocales': return nivel.items.slice();
      case 'consonante': return silabasDe(nivel.id, contenido);
      case 'palabras': return nivel.palabras.flatMap((p) => [p, ...contenido.palabras[p].silabas]);
      case 'frases': return nivel.frases.map((f) => f.texto);
      case 'cuento': return nivel.paginas.map((p) => p.texto);
      default: return [];
    }
  }

  /** Palabras, frases y páginas visibles (sin sílabas sueltas). */
  function textosVisibles(contenido) {
    const res = [];
    for (const n of contenido.niveles) {
      if (n.tipo === 'palabras') n.palabras.forEach((p) => res.push({ nivel: n.id, texto: p }));
      if (n.tipo === 'frases') n.frases.forEach((f) => res.push({ nivel: n.id, texto: f.texto }));
      if (n.tipo === 'cuento') n.paginas.forEach((p) => res.push({ nivel: n.id, texto: p.texto }));
    }
    return res;
  }

  /** Letras presentadas hasta el nivel indicado (incluido). */
  function disponiblesHasta(contenido, idNivel) {
    const set = new Set();
    for (const n of contenido.niveles) {
      n.introduce.forEach((l) => set.add(l));
      if (n.id === idNivel) break;
    }
    return set;
  }

  /** Lista de problemas "nivel X: \"texto\" usa letras no presentadas: r, n". Vacía si todo es correcto. */
  function problemas(contenido) {
    const res = [];
    const conocidas = new Set();
    for (const n of contenido.niveles) {
      n.introduce.forEach((l) => conocidas.add(l));
      for (const texto of textosDeNivel(n, contenido)) {
        const faltan = [...new Set(letrasDe(texto).filter((l) => !conocidas.has(l)))];
        if (faltan.length) res.push(`nivel ${n.id}: "${texto}" usa letras no presentadas: ${faltan.join(', ')}`);
      }
    }
    return res;
  }

  const api = { letrasDe, silabasDe, textosDeNivel, textosVisibles, disponiblesHasta, problemas };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { raiz.LEER = raiz.LEER || {}; raiz.LEER.letras = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
