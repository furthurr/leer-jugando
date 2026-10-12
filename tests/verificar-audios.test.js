'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { dirname, join } = require('node:path');
const { listaAudios } = require('../tools/lista-audios.js');
const contenido = require('../js/datos/contenido.js');

const script = join(__dirname, '../tools/verificar-audios.mjs');
const esperados = listaAudios(contenido).map((audio) => audio.ruta.slice('audio/'.length));

function crearRaiz(t, conAudios) {
  const raiz = mkdtempSync(join(tmpdir(), 'leer-verificar-'));
  t.after(() => rmSync(raiz, { recursive: true, force: true }));
  if (conAudios) {
    for (const ruta of esperados) {
      const destino = join(raiz, ruta);
      mkdirSync(dirname(destino), { recursive: true });
      writeFileSync(destino, 'audio de prueba');
    }
  }
  return raiz;
}

function ejecutar(raiz) {
  return spawnSync(process.execPath, [script, '--raiz', raiz], { encoding: 'utf8' });
}

test('verifica faltantes bajo una raíz de staging sin consultar audio/', (t) => {
  const resultado = ejecutar(crearRaiz(t, false));
  assert.equal(resultado.status, 1);
  assert.match(resultado.stdout, new RegExp(`Faltan: ${esperados.length}`));
});

test('acepta una raíz de staging completa', (t) => {
  const resultado = ejecutar(crearRaiz(t, true));
  assert.equal(resultado.status, 0, resultado.stdout + resultado.stderr);
  assert.match(resultado.stdout, /Faltan: 0/);
  assert.match(resultado.stdout, /Sobran: 0/);
});

test('informa sobrantes de la raíz seleccionada', (t) => {
  const raiz = crearRaiz(t, true);
  writeFileSync(join(raiz, 'sobrante.mp3'), 'extra');
  const resultado = ejecutar(raiz);
  assert.equal(resultado.status, 0);
  assert.match(resultado.stdout, /audio\/sobrante\.mp3/);
});
