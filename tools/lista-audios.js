'use strict';
/* Contenido → lista de audios a generar: [{ ruta, texto } | { ruta, efecto }]. */
const claves = require('../js/dominio/claves-audio.js');
const letras = require('../js/dominio/letras.js');

const { ruta, palabrasDeTexto } = claves;

/** Efectos sintetizados con ffmpeg (sin licencias de terceros). */
const EFECTOS = ['acierto', 'casi', 'estrella', 'fanfarria', 'clic'];

function listaAudios(contenido) {
  const porRuta = new Map();
  const agregar = (item) => {
    const previo = porRuta.get(item.ruta);
    if (previo && previo.texto !== item.texto) {
      throw new Error(`colisión de audio en ${item.ruta}: "${previo.texto}" vs "${item.texto}"`);
    }
    porRuta.set(item.ruta, item);
  };

  for (const [letra, nombre] of Object.entries(contenido.nombresLetras)) {
    agregar({ ruta: ruta('letras', letra), texto: nombre });
  }

  const palabra = (p) => agregar({ ruta: ruta('palabras', p), texto: p });
  const silaba = (s) => agregar({ ruta: ruta('silabas', s), texto: s });
  const frase = (t) => agregar({ ruta: ruta('frases', t), texto: t });
  Object.values(contenido.nombresGrabados || {}).forEach(palabra);

  for (const [p, d] of Object.entries(contenido.palabras)) { palabra(p); d.silabas.forEach(silaba); }

  for (const n of contenido.niveles) {
    if (n.tipo === 'consonante') letras.silabasDe(n.id, contenido).forEach(silaba);
    if (n.tipo === 'frases') n.frases.forEach((f) => { frase(f.texto); palabrasDeTexto(f.texto).forEach(palabra); });
    if (n.tipo === 'cuento') {
      n.paginas.forEach((pg) => { frase(pg.texto); palabrasDeTexto(pg.texto).forEach(palabra); });
      agregar({ ruta: ruta('instr', 'pregunta-' + n.id), texto: n.pregunta.voz });
      agregar({ ruta: ruta('instr', 'titulo-' + n.id), texto: n.nombre });
    }
  }

  for (const [clave, t] of Object.entries(contenido.instrucciones)) {
    if (typeof t === 'string') agregar({ ruta: ruta('instr', clave), texto: t });
    else for (const v of ['m', 'f', 'n']) agregar({ ruta: ruta('instr', clave + '-' + v), texto: t[v] });
  }

  for (const e of EFECTOS) agregar({ ruta: ruta('efectos', e), efecto: e });

  return [...porRuta.values()];
}

module.exports = { listaAudios, palabrasDeTexto, EFECTOS };
