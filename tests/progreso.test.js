'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const progreso = require('../js/dominio/progreso.js');

const ORDEN = ['v1', 'v2', 'm'];

test('inicial: sin niveles, sin perfil y volumen por defecto', () => {
  const e = progreso.inicial();
  assert.deepEqual(e.niveles, {});
  assert.deepEqual(e.perfil, { nombre: null, sexo: null });
  assert.equal(e.todoDesbloqueado, false);
  assert.equal(e.version, 1);
});

test('desbloqueo: solo el primero al empezar', () => {
  const e = progreso.inicial();
  assert.equal(progreso.estaDesbloqueado(ORDEN, 'v1', e), true);
  assert.equal(progreso.estaDesbloqueado(ORDEN, 'v2', e), false);
});

test('desbloqueo: completar un nivel abre el siguiente', () => {
  const e = progreso.registrar(progreso.inicial(), 'v1', 2);
  assert.equal(progreso.estaDesbloqueado(ORDEN, 'v2', e), true);
  assert.equal(progreso.estaDesbloqueado(ORDEN, 'm', e), false);
});

test('desbloqueo: todoDesbloqueado abre todos', () => {
  const e = { ...progreso.inicial(), todoDesbloqueado: true };
  assert.equal(progreso.estaDesbloqueado(ORDEN, 'm', e), true);
});

test('desbloqueo: el progreso antiguo no permite saltar niveles del nuevo camino', () => {
  const e = progreso.registrar(progreso.inicial(), 'v2', 3);
  assert.equal(progreso.estaDesbloqueado(ORDEN, 'm', e), false);
  const completo = progreso.registrar(e, 'v1', 1);
  assert.equal(progreso.estaDesbloqueado(ORDEN, 'm', completo), true);
});

test('desbloqueo: id desconocido no está desbloqueado', () => {
  assert.equal(progreso.estaDesbloqueado(ORDEN, 'zz', progreso.inicial()), false);
});

test('estrellas: 3 con ≥90 %, 2 con ≥60 %, 1 en otro caso', () => {
  assert.equal(progreso.calcularEstrellas(9, 10), 3);
  assert.equal(progreso.calcularEstrellas(6, 10), 2);
  assert.equal(progreso.calcularEstrellas(5, 10), 1);
  assert.equal(progreso.calcularEstrellas(0, 0), 1);
});

test('registrar: guarda el máximo al repetir y no muta el original', () => {
  const e1 = progreso.registrar(progreso.inicial(), 'v1', 3);
  const e2 = progreso.registrar(e1, 'v1', 1);
  assert.equal(e2.niveles.v1.estrellas, 3);
  assert.equal(e1.niveles.v1.estrellas, 3);
  const e0 = progreso.inicial();
  progreso.registrar(e0, 'v1', 2);
  assert.deepEqual(e0.niveles, {});
});

test('registrar: limita estrellas a 1..3', () => {
  assert.equal(progreso.registrar(progreso.inicial(), 'v1', 9).niveles.v1.estrellas, 3);
  assert.equal(progreso.registrar(progreso.inicial(), 'v1', 0).niveles.v1.estrellas, 1);
});

test('totalEstrellas suma todos los niveles', () => {
  let e = progreso.registrar(progreso.inicial(), 'v1', 3);
  e = progreso.registrar(e, 'v2', 2);
  assert.equal(progreso.totalEstrellas(e), 5);
});

test('normalizar: datos dañados producen un estado válido', () => {
  const e = progreso.normalizar({ version: 1, niveles: { v1: { estrellas: 'x' }, v2: { estrellas: 2 } }, volumen: 7, perfil: { nombre: '<script>', sexo: 'q' } });
  assert.deepEqual(e.niveles, { v2: { estrellas: 2 } });
  assert.equal(e.volumen, 1);
  assert.deepEqual(e.perfil, { nombre: null, sexo: null });
});

test('normalizar: basura total vuelve al estado inicial', () => {
  assert.deepEqual(progreso.normalizar('hola'), progreso.inicial());
  assert.deepEqual(progreso.normalizar(null), progreso.inicial());
});

test('conPerfil y sinPerfil actualizan el perfil de forma inmutable', () => {
  const e0 = progreso.inicial();
  const e1 = progreso.conPerfil(e0, { nombre: 'Tomás', sexo: 'm' });
  assert.deepEqual(e1.perfil, { nombre: 'Tomás', sexo: 'm' });
  assert.deepEqual(e0.perfil, { nombre: null, sexo: null });
  assert.equal(progreso.tienePerfil(e0), false);
  assert.equal(progreso.tienePerfil(e1), true);
});

test('tienePerfil: un perfil omitido explícitamente cuenta como guardado', () => {
  const e = progreso.conPerfil(progreso.inicial(), { nombre: null, sexo: null });
  assert.equal(progreso.tienePerfil(e), true);
});

test('reiniciar: borra niveles pero conserva perfil y volumen', () => {
  let e = progreso.conPerfil(progreso.inicial(), { nombre: 'Ana', sexo: 'f' });
  e = progreso.registrar(e, 'v1', 3);
  const r = progreso.reiniciar(e);
  assert.deepEqual(r.niveles, {});
  assert.equal(r.perfil.nombre, 'Ana');
});
