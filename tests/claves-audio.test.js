'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const claves = require('../js/dominio/claves-audio.js');

test('slug: minúsculas y espacios a guiones', () => {
  assert.equal(claves.slug('Mi mamá me ama'), 'mi-mama_-me-ama');
});

test('slug: ñ se convierte en nn', () => {
  assert.equal(claves.slug('muñeca'), 'munneca');
});

test('slug: la tilde se conserva como marca para no confundir papá con papa', () => {
  assert.notEqual(claves.slug('papá'), claves.slug('papa'));
  assert.equal(claves.slug('papá'), 'papa_');
});

test('slug: quita signos de puntuación', () => {
  assert.equal(claves.slug('¡Casi! ¿Otra vez?'), 'casi-otra-vez');
});

test('slug: es determinista y solo usa caracteres seguros', () => {
  const s = claves.slug('  El Oso  Ñoño, ¡come!  ');
  assert.equal(s, claves.slug('  El Oso  Ñoño, ¡come!  '));
  assert.match(s, /^[a-z0-9_-]+$/);
});

test('ruta: arma la ruta por categoría', () => {
  assert.equal(claves.ruta('silabas', 'ma'), 'audio/silabas/ma.mp3');
  assert.equal(claves.ruta('palabras', 'mamá'), 'audio/palabras/mama_.mp3');
});

test('ruta: rechaza categorías desconocidas', () => {
  assert.throws(() => claves.ruta('otra', 'ma'), /categoría/);
});
