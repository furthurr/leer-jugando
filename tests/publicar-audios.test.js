'use strict';
const { before, test } = require('node:test');
const assert = require('node:assert/strict');
const { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { dirname, join } = require('node:path');

let prepararStagingAudio;
let publicarStagingAudio;
before(async () => {
  ({ prepararStagingAudio, publicarStagingAudio } = await import('../tools/publicar-audios.mjs'));
});

function entorno(t) {
  const raiz = mkdtempSync(join(tmpdir(), 'leer-publicar-audio-'));
  t.after(() => rmSync(raiz, { recursive: true, force: true }));
  return {
    audioDir: join(raiz, 'audio'),
    stagingDir: join(raiz, 'tools', 'tmp', 'stage', 'audio'),
    backupDir: join(raiz, 'tools', 'tmp', 'backup', 'audio'),
  };
}

function escribir(ruta, contenido) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, contenido);
}

test('prepara staging como copia del árbol de audio vigente', (t) => {
  const rutas = entorno(t);
  escribir(join(rutas.audioDir, 'instr', 'hola.mp3'), 'voz actual');
  escribir(join(rutas.audioDir, 'efectos', 'clic.mp3'), 'efecto intacto');

  prepararStagingAudio(rutas);

  assert.equal(readFileSync(join(rutas.stagingDir, 'instr', 'hola.mp3'), 'utf8'), 'voz actual');
  assert.equal(readFileSync(join(rutas.stagingDir, 'efectos', 'clic.mp3'), 'utf8'), 'efecto intacto');
  assert.equal(readFileSync(join(rutas.audioDir, 'instr', 'hola.mp3'), 'utf8'), 'voz actual');
});

test('no elimina un staging preexistente ni lo sobreescribe', (t) => {
  const rutas = entorno(t);
  escribir(join(rutas.audioDir, 'instr', 'hola.mp3'), 'voz actual');
  escribir(join(rutas.stagingDir, 'instr', 'hola.mp3'), 'staging previo');

  assert.throws(() => prepararStagingAudio(rutas), /staging.*existe/i);
  assert.equal(readFileSync(join(rutas.stagingDir, 'instr', 'hola.mp3'), 'utf8'), 'staging previo');
  assert.equal(readFileSync(join(rutas.audioDir, 'instr', 'hola.mp3'), 'utf8'), 'voz actual');
});

test('publica el staging y conserva el árbol previo en respaldo', (t) => {
  const rutas = entorno(t);
  escribir(join(rutas.audioDir, 'instr', 'hola.mp3'), 'voz anterior');
  escribir(join(rutas.audioDir, 'efectos', 'clic.mp3'), 'efecto intacto');
  cpSync(rutas.audioDir, rutas.stagingDir, { recursive: true });
  writeFileSync(join(rutas.stagingDir, 'instr', 'hola.mp3'), 'voz nueva');

  publicarStagingAudio(rutas);

  assert.equal(readFileSync(join(rutas.audioDir, 'instr', 'hola.mp3'), 'utf8'), 'voz nueva');
  assert.equal(readFileSync(join(rutas.audioDir, 'efectos', 'clic.mp3'), 'utf8'), 'efecto intacto');
  assert.equal(readFileSync(join(rutas.backupDir, 'instr', 'hola.mp3'), 'utf8'), 'voz anterior');
  assert.equal(existsSync(rutas.stagingDir), false);
});

test('restaura el árbol anterior si falla el renombrado del staging', (t) => {
  const rutas = entorno(t);
  escribir(join(rutas.audioDir, 'instr', 'hola.mp3'), 'voz anterior');
  cpSync(rutas.audioDir, rutas.stagingDir, { recursive: true });
  writeFileSync(join(rutas.stagingDir, 'instr', 'hola.mp3'), 'voz nueva');
  let falloInyectado = false;
  const renameImpl = (origen, destino) => {
    if (origen === rutas.stagingDir && destino === rutas.audioDir && !falloInyectado) {
      falloInyectado = true;
      throw new Error('disco lleno simulado');
    }
    renameSync(origen, destino);
  };

  assert.throws(() => publicarStagingAudio({ ...rutas, renameImpl }), /restaurado|disco lleno/);
  assert.equal(readFileSync(join(rutas.audioDir, 'instr', 'hola.mp3'), 'utf8'), 'voz anterior');
  assert.equal(existsSync(rutas.backupDir), false);
  assert.equal(existsSync(rutas.stagingDir), true);
});

test('no reemplaza un respaldo que ya existe', (t) => {
  const rutas = entorno(t);
  escribir(join(rutas.audioDir, 'instr', 'hola.mp3'), 'voz vigente');
  escribir(join(rutas.stagingDir, 'instr', 'hola.mp3'), 'voz candidata');
  escribir(join(rutas.backupDir, 'instr', 'hola.mp3'), 'respaldo anterior');

  assert.throws(() => publicarStagingAudio(rutas), /respaldo.*existe/i);
  assert.equal(readFileSync(join(rutas.audioDir, 'instr', 'hola.mp3'), 'utf8'), 'voz vigente');
  assert.equal(readFileSync(join(rutas.backupDir, 'instr', 'hola.mp3'), 'utf8'), 'respaldo anterior');
});
