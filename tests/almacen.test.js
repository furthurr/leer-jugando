'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearAlmacen, CLAVE } = require('../js/infra/almacen.js');
const progreso = require('../js/dominio/progreso.js');

function storageFalso(inicial = {}) {
  const datos = { ...inicial };
  return {
    datos,
    getItem: (k) => (k in datos ? datos[k] : null),
    setItem: (k, v) => { datos[k] = String(v); },
    removeItem: (k) => { delete datos[k]; },
  };
}
const silencioso = { warn() {} };

test('cargar sin datos devuelve el estado inicial (Req 6.3)', () => {
  const r = crearAlmacen(storageFalso(), silencioso).cargar();
  assert.equal(r.ok, true);
  assert.deepEqual(r.datos, progreso.inicial());
});

test('guardar y cargar conserva el progreso (Req 6.1, 6.2, 9.3)', () => {
  const st = storageFalso();
  const a = crearAlmacen(st, silencioso);
  let e = progreso.registrar(progreso.inicial(), 'v1', 3);
  e = progreso.conPerfil(e, { nombre: 'Tomás', sexo: 'm' });
  assert.equal(a.guardar(e).ok, true);
  assert.ok(st.datos[CLAVE]);
  assert.deepEqual(crearAlmacen(st, silencioso).cargar().datos, e);
});

test('JSON dañado devuelve estado inicial y avisa por consola (Req 6.3)', () => {
  const avisos = [];
  const r = crearAlmacen(storageFalso({ [CLAVE]: '{roto' }), { warn: (m) => avisos.push(m) }).cargar();
  assert.equal(r.ok, false);
  assert.deepEqual(r.datos, progreso.inicial());
  assert.equal(avisos.length, 1);
});

test('versión desconocida vuelve al estado inicial', () => {
  const r = crearAlmacen(storageFalso({ [CLAVE]: JSON.stringify({ version: 99, niveles: { v1: { estrellas: 3 } } }) }), silencioso).cargar();
  assert.deepEqual(r.datos, progreso.inicial());
});

test('storage que lanza (cuota llena o bloqueado) no rompe el juego', () => {
  const roto = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('cuota'); }, removeItem() {} };
  const a = crearAlmacen(roto, silencioso);
  assert.deepEqual(a.cargar().datos, progreso.inicial());
  assert.equal(a.guardar(progreso.inicial()).ok, false);
});

test('storage ausente funciona en memoria', () => {
  const a = crearAlmacen(null, silencioso);
  assert.equal(a.guardar(progreso.inicial()).ok, false);
  assert.deepEqual(a.cargar().datos, progreso.inicial());
});
