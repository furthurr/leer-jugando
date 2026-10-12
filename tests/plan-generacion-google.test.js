'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { listaAudios } = require('../tools/lista-audios.js');
const contenido = require('../js/datos/contenido.js');
const {
  VOCES_GOOGLE,
  crearMuestrasPiloto,
  crearLoteVoz,
  crearSsml,
  fonemaDe,
} = require('../tools/plan-generacion-google.js');

const lista = listaAudios(contenido);

test('el piloto compara las tres voces Neural2 es-US con cuatro textos representativos', () => {
  const muestras = crearMuestrasPiloto(lista);
  assert.deepEqual(VOCES_GOOGLE, ['es-US-Neural2-A', 'es-US-Neural2-B', 'es-US-Neural2-C']);
  assert.equal(muestras.length, 12);
  assert.deepEqual([...new Set(muestras.map((muestra) => muestra.voiceId))], VOCES_GOOGLE);
  assert.deepEqual([...new Set(muestras.map((muestra) => muestra.tipo))], [
    'letra', 'silaba', 'palabra', 'instruccion',
  ]);
  assert.ok(muestras.every((muestra) => muestra.locale === 'es-US'));
  assert.ok(muestras.every((muestra) => !muestra.efecto && muestra.textoFuente));
});

test('el piloto conserva los textos fuente y añade puntuación solo a unidades sueltas', () => {
  const muestras = crearMuestrasPiloto(lista);
  const encontrar = (tipo) => muestras.find((muestra) => muestra.tipo === tipo);
  assert.equal(encontrar('letra').textoFuente, 'eme, de mamá');
  assert.equal(encontrar('letra').texto, 'eme, de mamá.');
  assert.equal(encontrar('silaba').texto, 'ma.');
  assert.equal(encontrar('palabra').texto, 'mapa.');
  assert.equal(encontrar('instruccion').textoFuente, 'Escucha y toca la que oyes.');
  assert.equal(encontrar('instruccion').texto, 'Escucha y toca la que oyes.');
});

test('el lote contiene todas las pistas habladas con una voz fija y rate por tipo', () => {
  const lote = crearLoteVoz(lista, 'es-US-Neural2-A');
  assert.equal(lote.length, lista.filter((item) => !item.efecto).length);
  assert.ok(lote.every((item) => item.voiceId === 'es-US-Neural2-A' && item.locale === 'es-US'));
  assert.ok(lote.every((item) => !item.efecto && typeof item.texto === 'string'));
  assert.ok(!lote.some((item) => item.ruta.startsWith('audio/efectos/')));
  assert.equal(lote.find((item) => item.ruta === 'audio/letras/m.mp3').rate, '65%');
  assert.equal(lote.find((item) => item.ruta === 'audio/silabas/ma.mp3').rate, '65%');
  assert.equal(lote.find((item) => item.ruta === 'audio/palabras/mapa.mp3').rate, '70%');
  assert.equal(lote.find((item) => item.ruta === 'audio/instr/escucha-elige.mp3').rate, '80%');
});

test('SSML escapa caracteres reservados y aplica la velocidad al texto completo', () => {
  assert.equal(
    crearSsml('mamá & Lola <3', '65%'),
    '<speak><prosody rate="65%">mamá &amp; Lola &lt;3</prosody></speak>',
  );
});

test('el lote rechaza IDs que no son es-US-Neural2 permitidas', () => {
  assert.throws(() => crearLoteVoz(lista, 'es-MX-DaliaNeural'), /voz Google no válida/i);
});

test('las sílabas sueltas se fuerzan a pronunciación española con IPA', () => {
  assert.equal(fonemaDe('to.'), 'to');
  assert.equal(fonemaDe('tu.'), 'tu');
  assert.equal(fonemaDe('cha.'), 'tʃa');
  assert.equal(fonemaDe('ña.'), 'ɲa');
  assert.equal(fonemaDe('yo.'), 'jo');
  assert.equal(fonemaDe('a.'), 'a');
  assert.equal(fonemaDe('que.'), 'ke');
  assert.equal(fonemaDe('qui.'), 'ki');
  assert.equal(fonemaDe('ha.'), 'a');
  assert.equal(fonemaDe('hi.'), 'i');
  assert.equal(fonemaDe('xi.'), 'ksi');
  assert.equal(fonemaDe('ki.'), 'ki');
  assert.equal(fonemaDe('wi.'), 'wi');
  assert.equal(fonemaDe('Abdiel.'), 'abˈdjel');
  assert.equal(fonemaDe('mamá.'), null);
  assert.equal(fonemaDe('el sapo salta'), null);

  const lote = crearLoteVoz(lista, 'es-US-Neural2-C');
  assert.equal(lote.find((item) => item.ruta === 'audio/silabas/to.mp3').fonema, 'to');
  assert.equal(lote.find((item) => item.ruta === 'audio/silabas/tu.mp3').fonema, 'tu');
  assert.equal(lote.find((item) => item.ruta === 'audio/palabras/abdiel.mp3').fonema, 'abˈdjel');
  assert.equal(lote.find((item) => item.ruta === 'audio/frases/el-sapo-salta.mp3').fonema, null);
});

test('SSML con fonema envuelve la sílaba y mantiene la velocidad', () => {
  assert.equal(
    crearSsml('to.', '65%', 'to'),
    '<speak><prosody rate="65%"><phoneme alphabet="ipa" ph="to">to.</phoneme></prosody></speak>',
  );
});
