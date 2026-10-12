'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const letras = require('../js/dominio/letras.js');
const contenido = require('../js/datos/contenido.js');

test('letrasDe: separa dígrafo ch, conserva ñ y quita tildes', () => {
  assert.deepEqual(letras.letrasDe('¡Chapó, Ñu!'), ['ch', 'a', 'p', 'o', 'ñ', 'u']);
});

test('silabasDe: carretilla de una consonante', () => {
  assert.deepEqual(letras.silabasDe('m', contenido), ['ma', 'me', 'mi', 'mo', 'mu']);
  assert.deepEqual(letras.silabasDe('c', contenido), ['ca', 'co', 'cu']);
  assert.deepEqual(letras.silabasDe('ch', contenido), ['cha', 'che', 'chi', 'cho', 'chu']);
});

test('problemas: detecta una palabra con letras aún no presentadas', () => {
  const falso = {
    ...contenido,
    palabras: { ...contenido.palabras, rana: { silabas: ['ra', 'na'], imagen: '🐸' } },
    niveles: [
      { id: 'v', tipo: 'vocales', introduce: ['a', 'e', 'i', 'o', 'u'], items: ['a'] },
      { id: 'm', tipo: 'consonante', introduce: ['m'] },
      { id: 'x', tipo: 'palabras', introduce: [], palabras: ['rana'] },
    ],
  };
  const p = letras.problemas(falso);
  assert.ok(p.length > 0);
  assert.ok(p.every((x) => x.startsWith('nivel x:')), p.join('\n'));
  assert.ok(p.some((x) => /"rana".*r, n/.test(x)), p.join('\n'));
});

test('contenido real: ningún nivel usa letras no presentadas (Req 3.3)', () => {
  assert.deepEqual(letras.problemas(contenido), []);
});

test('contenido real: sin sonidos adicionales fuera del camino (ll, rr, ce/ci, ge/gi, trabadas)', () => {
  const prohibido = /ll|rr|c[eéií]|g[eéií]|gu[eéií]|[bcdfgpt][lr]/;
  for (const { nivel, texto } of letras.textosVisibles(contenido)) {
    for (const palabra of texto.toLowerCase().split(/[^a-záéíóúüñ]+/).filter(Boolean)) {
      const sinCh = palabra.replace(/ch/g, '·');
      assert.doesNotMatch(sinCh, prohibido, `nivel ${nivel}: "${palabra}"`);
    }
  }
});

test('contenido real: las sílabas de cada palabra forman la palabra', () => {
  for (const [p, d] of Object.entries(contenido.palabras)) {
    assert.equal(d.silabas.join(''), p);
  }
});

test('lectura inicial: palabras, sílabas, frases y cuentos sin tildes', () => {
  for (const [palabra, datos] of Object.entries(contenido.palabras)) {
    assert.doesNotMatch(palabra, /[áéíóúÁÉÍÓÚ]/u);
    datos.silabas.forEach((silaba) => assert.doesNotMatch(silaba, /[áéíóúÁÉÍÓÚ]/u));
  }
  for (const nivel of contenido.niveles) {
    for (const texto of letras.textosDeNivel(nivel, contenido)) {
      assert.doesNotMatch(texto, /[áéíóúÁÉÍÓÚ]/u, `nivel ${nivel.id}: ${texto}`);
    }
  }
});

test('contenido real: cada palabra tiene un dibujo distinto', () => {
  const imgs = Object.values(contenido.palabras).map((d) => d.imagen);
  assert.equal(new Set(imgs).size, imgs.length);
});

test('contenido real: ids únicos y consonantes en el orden pedido (Req 3.2)', () => {
  const ids = contenido.niveles.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
  const cons = contenido.niveles.filter((n) => n.tipo === 'consonante').map((n) => n.id);
  assert.deepEqual(cons, [...'mpsltdnfbvcqgrjñhyzxkw']);
  contenido.gruposLetras.forEach((grupo, i) => {
    assert.deepEqual(contenido.niveles.filter((n) => n.tipo === 'consonante' && n.etapa === i + 2).map((n) => n.id), grupo);
  });
});

test('contenido real: etapas no retroceden desde vocales hasta cuentos (Req 3.1)', () => {
  const etapas = contenido.niveles.map((n) => n.etapa);
  assert.equal(etapas[0], 1);
  assert.equal(etapas[etapas.length - 1], 6);
  assert.ok(etapas.every((etapa, i) => i === 0 || etapa >= etapas[i - 1]));
  assert.ok(contenido.niveles.filter((n) => n.tipo === 'cuento').length >= 3);
});

test('contenido real: cada cuento tiene pregunta con respuesta entre sus opciones (Req 4.7)', () => {
  for (const n of contenido.niveles.filter((x) => x.tipo === 'cuento')) {
    assert.ok(n.pregunta.opciones.includes(n.pregunta.correcta), n.id);
    assert.ok(n.pregunta.opciones.length >= 2 && n.pregunta.opciones.length <= 4, n.id);
  }
});
