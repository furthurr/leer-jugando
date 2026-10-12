'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const perfil = require('../js/dominio/perfil.js');

test('validarNombre: acepta tildes, ñ y espacios', () => {
  assert.deepEqual(perfil.validarNombre('José Ñandú'), { ok: true, valor: 'José Ñandú' });
});

test('validarNombre: recorta y compacta espacios', () => {
  assert.deepEqual(perfil.validarNombre('  Ana   Sofía '), { ok: true, valor: 'Ana Sofía' });
});

test('validarNombre: rechaza vacío', () => {
  assert.equal(perfil.validarNombre('   ').ok, false);
});

test('validarNombre: rechaza más de 20 caracteres', () => {
  assert.equal(perfil.validarNombre('a'.repeat(21)).ok, false);
  assert.equal(perfil.validarNombre('a'.repeat(20)).ok, true);
});

test('validarNombre: rechaza símbolos, números y código', () => {
  assert.equal(perfil.validarNombre('<b>x</b>').ok, false);
  assert.equal(perfil.validarNombre('Ana2').ok, false);
});

test('validarNombre: tolera valores que no son texto', () => {
  assert.equal(perfil.validarNombre(null).ok, false);
  assert.equal(perfil.validarNombre(42).ok, false);
});

test('variante: m, f o n según sexo', () => {
  assert.equal(perfil.variante('m'), 'm');
  assert.equal(perfil.variante('f'), 'f');
  assert.equal(perfil.variante(null), 'n');
  assert.equal(perfil.variante('x'), 'n');
});
