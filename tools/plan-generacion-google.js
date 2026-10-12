'use strict';

const VOCES_GOOGLE = Object.freeze([
  'es-US-Neural2-A',
  'es-US-Neural2-B',
  'es-US-Neural2-C',
]);
const LOCALE = 'es-US';
const MUESTRAS = Object.freeze([
  { tipo: 'letra', ruta: 'audio/letras/m.mp3' },
  { tipo: 'silaba', ruta: 'audio/silabas/ma.mp3' },
  { tipo: 'palabra', ruta: 'audio/palabras/mapa.mp3' },
  { tipo: 'instruccion', ruta: 'audio/instr/escucha-elige.mp3' },
]);
const RATES = Object.freeze(['65%', '70%', '80%']);

function validarVoz(voiceId) {
  if (!VOCES_GOOGLE.includes(voiceId)) throw new Error(`La voz Google no válida: ${voiceId || '(vacía)'}.`);
  return voiceId;
}

function rateParaRuta(ruta) {
  if (ruta.includes('/letras/') || ruta.includes('/silabas/')) return '65%';
  if (ruta.includes('/palabras/')) return '70%';
  return '80%';
}

function textoParaVoz(item) {
  const suelto = item.ruta.includes('/letras/') ||
    item.ruta.includes('/silabas/') || item.ruta.includes('/palabras/');
  const texto = item.texto.trim();
  return suelto && !/[.!?…]$/.test(texto) ? `${texto}.` : texto;
}

function indexarVoces(lista) {
  return new Map(lista.filter((item) => !item.efecto).map((item) => [item.ruta, item]));
}

function crearMuestrasPiloto(lista) {
  const porRuta = indexarVoces(lista);
  return VOCES_GOOGLE.flatMap((voiceId) => MUESTRAS.map(({ tipo, ruta }) => {
    const item = porRuta.get(ruta);
    if (!item || typeof item.texto !== 'string' || !item.texto.trim()) {
      throw new Error(`Falta el texto de muestra ${ruta}.`);
    }
    return {
      tipo,
      ruta,
      voiceId,
      locale: LOCALE,
      textoFuente: item.texto,
      texto: textoParaVoz(item),
      rate: rateParaRuta(ruta),
      fonema: fonemaDe(item.texto),
    };
  }));
}

const IPA_CONSONANTE = Object.freeze({
  m: 'm', p: 'p', s: 's', l: 'l', t: 't', n: 'n', d: 'd', b: 'b', f: 'f',
  c: 'k', g: 'g', j: 'x', v: 'b', z: 's', y: 'j', r: 'ɾ', 'ñ': 'ɲ', ch: 'tʃ',
  qu: 'k', h: '', x: 'ks', k: 'k', w: 'w',
});

/**
 * La voz es-US lee sílabas sueltas como "to" como el inglés /tu/. Para letras,
 * sílabas y palabras sueltas forzamos la pronunciación española con IPA.
 * Devuelve null cuando el texto es una frase o no es una sílaba simple.
 */
function fonemaDe(texto) {
  const t = String(texto).trim().replace(/[.]$/, '');
  if (t.toLowerCase() === 'abdiel') return 'abˈdjel';
  if (/^[aeiou]$/.test(t)) return t;
  const m = t.match(/^(ch|qu|[a-zñ])([aeiou])$/);
  if (!m) return null;
  const consonante = IPA_CONSONANTE[m[1]];
  return consonante !== undefined ? consonante + m[2] : null;
}

function conFonema(item, voz) {
  return { ...voz, fonema: fonemaDe(item.texto) };
}

function crearLoteVoz(lista, voiceId) {
  validarVoz(voiceId);
  return lista.filter((item) => !item.efecto).map((item) => conFonema(item, {
    ruta: item.ruta,
    voiceId,
    locale: LOCALE,
    textoFuente: item.texto,
    texto: textoParaVoz(item),
    rate: rateParaRuta(item.ruta),
  }));
}

function escaparXml(texto) {
  return texto.replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[caracter]);
}

function crearSsml(texto, rate, fonema) {
  if (typeof texto !== 'string' || !texto.trim()) throw new Error('El texto TTS no puede estar vacío.');
  if (!RATES.includes(rate)) throw new Error(`Velocidad SSML no válida: ${rate}.`);
  const cuerpo = fonema
    ? `<phoneme alphabet="ipa" ph="${escaparXml(fonema)}">${escaparXml(texto)}</phoneme>`
    : escaparXml(texto);
  return `<speak><prosody rate="${rate}">${cuerpo}</prosody></speak>`;
}

module.exports = {
  VOCES_GOOGLE,
  LOCALE,
  RATES,
  crearMuestrasPiloto,
  crearLoteVoz,
  crearSsml,
  fonemaDe,
  validarVoz,
  textoParaVoz,
};
