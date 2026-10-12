'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { listaAudios, palabrasDeTexto } = require('../tools/lista-audios.js');
const contenido = require('../js/datos/contenido.js');

const lista = listaAudios(contenido);
const rutas = new Set(lista.map((a) => a.ruta));

test('palabrasDeTexto: quita signos y pasa a minúsculas', () => {
  assert.deepEqual(palabrasDeTexto('¡Muy bien, Lola!'), ['muy', 'bien', 'lola']);
});

test('sin rutas duplicadas', () => {
  assert.equal(rutas.size, lista.length);
});

test('incluye letras con su nombre hablado', () => {
  const m = lista.find((a) => a.ruta === 'audio/letras/m.mp3');
  assert.equal(m.texto, 'eme, de mamá');
  assert.ok(rutas.has('audio/letras/nn.mp3'));
  assert.ok(rutas.has('audio/letras/a.mp3'));
});

test('incluye todas las sílabas de carretillas y de palabras', () => {
  for (const s of ['ma', 'mu', 'che', 'ña', 'zu', 'yo', 'que', 'qui', 'ha', 'xi', 'ki', 'wi']) assert.ok(rutas.has(`audio/silabas/${s.replace('ñ', 'nn')}.mp3`), s);
  assert.ok(!rutas.has('audio/silabas/ma_.mp3'), 'la lectura inicial no usa má');
});

test('incluye palabras sueltas, de frases y de cuentos (Req 2.3, 4.6)', () => {
  for (const p of ['mapa', 'munneca', 'salta', 'pepe', 'lola', 'suenno']) {
    assert.ok(rutas.has(`audio/palabras/${p}.mp3`), p);
  }
});

test('incluye el nombre pregrabado Abdiel para verificarlo y regenerarlo con Google', () => {
  assert.equal(lista.find((a) => a.ruta === 'audio/palabras/abdiel.mp3').texto, 'Abdiel');
});

test('incluye frases y páginas de cuentos completas', () => {
  assert.ok(rutas.has('audio/frases/el-sapo-salta.mp3'));
  assert.ok(rutas.has('audio/frases/pepe-es-un-sapo.mp3'));
});

test('instrucciones con género en variantes m, f y n (Req 9.6)', () => {
  for (const v of ['m', 'f', 'n']) {
    assert.ok(rutas.has(`audio/instr/bienvenida-${v}.mp3`), v);
    assert.ok(rutas.has(`audio/instr/nivel-completo-${v}.mp3`), v);
  }
  assert.ok(rutas.has('audio/instr/casi.mp3'));
  assert.ok(rutas.has('audio/instr/pregunta-c1.mp3'));
});

test('efectos sin texto y marcados como efecto', () => {
  const ef = lista.filter((a) => a.ruta.startsWith('audio/efectos/'));
  assert.ok(ef.length >= 3);
  assert.ok(ef.every((a) => a.efecto && !a.texto));
});

test('todo audio hablado tiene texto', () => {
  assert.ok(lista.filter((a) => !a.efecto).every((a) => typeof a.texto === 'string' && a.texto.length > 0));
});
