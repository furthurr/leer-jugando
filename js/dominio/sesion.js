/* Sesión de juego de un nivel: genera ejercicios y lleva intentos, pistas y aciertos. */
(function (raiz) {
  'use strict';

  const enNode = typeof module !== 'undefined' && module.exports;
  const letras = enNode ? require('./letras.js') : raiz.LEER.letras;
  const progreso = enNode ? require('./progreso.js') : raiz.LEER.progreso;

  function barajar(lista, rng) {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Objetivo + (n-1) distractores distintos, barajados. */
  function opcionesCon(objetivo, pool, n, rng) {
    const otros = barajar(pool.filter((x) => x !== objetivo), rng).slice(0, n - 1);
    return barajar([objetivo, ...otros], rng);
  }

  function escuchaElige(objetivo, pool, categoria, rng) {
    return {
      tipo: 'escucha-elige', instruccion: 'escucha-elige', puntua: true, categoria,
      objetivo, opciones: opcionesCon(objetivo, pool, 3, rng), modelo: { categoria, texto: objetivo },
    };
  }

  function deVocales(nivel, contenido, rng) {
    const conocidas = letras.disponiblesHasta(contenido, nivel.id);
    const pool = contenido.VOCALES.filter((v) => conocidas.has(v));
    const ej = [{ tipo: 'carretilla', instruccion: 'carretilla', puntua: false, categoria: 'letras', items: nivel.items.slice() }];
    const objetivos = barajar(nivel.items, rng);
    for (let i = 0; i < 5; i++) ej.push(escuchaElige(objetivos[i % objetivos.length], pool, 'letras', rng));
    return ej;
  }

  function deConsonante(nivel, contenido, rng) {
    const c = nivel.id;
    const silabas = letras.silabasDe(c, contenido);
    const vocales = contenido.vocalesDe[c] || contenido.VOCALES;
    const base = c === 'q' ? 'qu' : c;
    const ej = [{ tipo: 'carretilla', instruccion: 'carretilla', puntua: false, categoria: 'silabas', items: silabas, letra: c }];
    for (const v of barajar(vocales, rng).slice(0, 2)) {
      ej.push({
        tipo: 'une-letras', instruccion: 'une-letras', puntua: true, consonante: base,
        objetivo: v, silaba: base + v, opciones: opcionesCon(v, vocales, 3, rng),
        modelo: { categoria: 'silabas', texto: base + v },
      });
    }
    for (const s of barajar(silabas, rng).slice(0, 3)) ej.push(escuchaElige(s, silabas, 'silabas', rng));
    return ej;
  }

  function dePalabras(nivel, contenido, rng) {
    const idx = contenido.niveles.indexOf(nivel);
    const pool = contenido.niveles.slice(0, idx + 1).filter((n) => n.tipo === 'palabras').flatMap((n) => n.palabras);
    const orden = barajar(nivel.palabras, rng);
    const ej = [];
    for (const p of orden.slice(0, 3)) {
      const d = contenido.palabras[p];
      ej.push({
        tipo: 'arma-palabra', instruccion: 'arma-palabra', puntua: true, palabra: p, imagen: d.imagen,
        objetivo: d.silabas.slice(), opciones: barajar(d.silabas, rng), modelo: { categoria: 'palabras', texto: p },
      });
    }
    for (const p of orden.slice(3, 6).concat(orden).slice(0, 3)) {
      const opciones = opcionesCon(p, pool, 3, rng);
      const imagenes = Object.fromEntries(opciones.map((o) => [o, contenido.palabras[o].imagen]));
      ej.push({
        tipo: 'lee-elige-palabra', instruccion: 'lee-elige-palabra', puntua: true,
        objetivo: p, texto: p, opciones, imagenes, modelo: { categoria: 'palabras', texto: p },
      });
    }
    return ej;
  }

  function deFrases(nivel, contenido, rng) {
    const textos = nivel.frases.map((f) => f.texto);
    const imagenes = Object.fromEntries(nivel.frases.map((f) => [f.texto, f.imagen]));
    const orden = barajar(textos, rng).slice(0, 8);
    // Reforzar las frases sencillas cuando el nivel tiene pocas opciones.
    const objetivos = Array.from({ length: Math.max(5, orden.length) }, (_, i) => orden[i % orden.length]);
    return objetivos.map((t) => {
      const opciones = opcionesCon(t, textos, 3, rng);
      return {
        tipo: 'lee-elige-frase', instruccion: 'lee-elige-frase', puntua: true, objetivo: t, texto: t,
        opciones, imagenes: Object.fromEntries(opciones.map((o) => [o, imagenes[o]])),
        modelo: { categoria: 'frases', texto: t },
      };
    });
  }

  function deCuento(nivel, contenido, rng) {
    const total = nivel.paginas.length;
    const ej = nivel.paginas.map((p, i) => ({
      tipo: 'cuento', instruccion: i === 0 ? 'cuento' : null, puntua: false,
      texto: p.texto, imagen: p.imagen, pagina: i, total, titulo: nivel.nombre,
    }));
    const q = nivel.pregunta;
    ej.push({
      tipo: 'pregunta', instruccion: 'pregunta-' + nivel.id, puntua: true, objetivo: q.correcta,
      opciones: barajar(q.opciones, rng), imagenes: Object.fromEntries(q.opciones.map((o) => [o, o])),
    });
    return ej;
  }

  const GENERADORES = { vocales: deVocales, consonante: deConsonante, palabras: dePalabras, frases: deFrases, cuento: deCuento };

  function crear(nivel, contenido, rng = Math.random) {
    const gen = GENERADORES[nivel.tipo];
    if (!gen) throw new Error('tipo de nivel desconocido: ' + nivel.tipo);
    const ejercicios = gen(nivel, contenido, rng);

    let indice = 0;
    let paso = 0;
    let fallosSeguidos = 0;
    let falloEnActual = false;
    let aciertosPrimerIntento = 0;

    const actual = () => ejercicios[indice] || null;
    const esperado = () => {
      const e = actual();
      return e && Array.isArray(e.objetivo) ? e.objetivo[paso] : e && e.objetivo;
    };

    function avanzar() {
      indice++; paso = 0; fallosSeguidos = 0; falloEnActual = false;
      return { correcto: true, pista: false, parcial: false, fin: indice >= ejercicios.length };
    }

    function completar() { return avanzar(); }

    function responder(respuesta) {
      const e = actual();
      if (!e) return { correcto: false, pista: false, parcial: false, fin: true };
      if (!e.puntua) return avanzar();
      if (respuesta !== esperado()) {
        fallosSeguidos++; falloEnActual = true;
        return { correcto: false, pista: fallosSeguidos >= 2, parcial: false, fin: false };
      }
      fallosSeguidos = 0;
      if (Array.isArray(e.objetivo) && paso + 1 < e.objetivo.length) {
        paso++;
        return { correcto: true, pista: false, parcial: true, fin: false };
      }
      if (!falloEnActual) aciertosPrimerIntento++;
      return avanzar();
    }

    function resultado() {
      const puntuables = ejercicios.filter((e) => e.puntua).length;
      return { aciertosPrimerIntento, puntuables, estrellas: progreso.calcularEstrellas(aciertosPrimerIntento, puntuables) };
    }

    return {
      nivelId: nivel.id, ejercicios,
      actual, esperado, responder, completar, resultado,
      total: () => ejercicios.length, indice: () => indice, paso: () => paso,
    };
  }

  const api = { crear, barajar };
  if (enNode) module.exports = api;
  else { raiz.LEER = raiz.LEER || {}; raiz.LEER.sesion = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
