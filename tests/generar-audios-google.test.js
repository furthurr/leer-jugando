'use strict';
const { before, test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { dirname, join } = require('node:path');
const { listaAudios } = require('../tools/lista-audios.js');
const contenido = require('../js/datos/contenido.js');

let analizarArgumentos;
let generarPilotoConCliente;
let generarLoteCompletoConCliente;
let ejecutarGeneracion;
before(async () => {
  ({ analizarArgumentos, generarPilotoConCliente, generarLoteCompletoConCliente, ejecutarGeneracion } =
    await import('../tools/generar-audios.mjs'));
});

const speech = listaAudios(contenido);

test('requiere confirmación de costo antes del piloto y limita modos de CLI', () => {
  assert.throws(() => analizarArgumentos(['--piloto']), /--confirmar-costo/);
  assert.deepEqual(analizarArgumentos(['--piloto', '--confirmar-costo']), { modo: 'piloto' });
  assert.deepEqual(analizarArgumentos(['--efectos']), { modo: 'efectos' });
  assert.throws(() => analizarArgumentos(['--piloto', '--lote']), /Uso:/i);
});

test('el lote requiere ID Neural2 permitido, aprobación del piloto y confirmación de costo', () => {
  assert.throws(() => analizarArgumentos(['--lote', '--voz', 'es-US-Neural2-A']), /--acepto-piloto/);
  assert.throws(() => analizarArgumentos([
    '--lote', '--voz', 'es-MX-DaliaNeural', '--acepto-piloto', '--confirmar-lote',
  ]), /voz.*no válida/i);
  assert.deepEqual(analizarArgumentos([
    '--lote', '--voz', 'es-US-Neural2-B', '--acepto-piloto', '--confirmar-lote',
  ]), { modo: 'lote', voiceId: 'es-US-Neural2-B' });
});

test('la CLI exige confirmar antes de comprobar ADC o crear cliente', async () => {
  let preflightCalls = 0;
  let clientCalls = 0;
  await assert.rejects(ejecutarGeneracion(['--piloto'], {
    validarAdc: async () => { preflightCalls++; },
    crearCliente: () => { clientCalls++; return {}; },
  }), /--confirmar-costo/);
  assert.equal(preflightCalls, 0);
  assert.equal(clientCalls, 0);
});

test('un fallo de ADC detiene el flujo antes de crear cliente o sintetizar', async () => {
  let clientCalls = 0;
  await assert.rejects(ejecutarGeneracion(['--piloto', '--confirmar-costo'], {
    validarAdc: async () => { throw new Error('ADC Google no disponible'); },
    crearCliente: () => { clientCalls++; return {}; },
  }), /ADC Google no disponible/);
  assert.equal(clientCalls, 0);
});

function directorioTemporal(t, prefijo) {
  const dir = mkdtempSync(join(tmpdir(), prefijo));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function escribir(ruta, bytes) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, bytes);
}

test('genera 12 muestras en staging y nunca cambia los audios activos', async (t) => {
  const root = directorioTemporal(t, 'leer-google-pilot-');
  const audioActivos = join(root, 'audio');
  const muestraActiva = join(audioActivos, 'instr', 'hola.mp3');
  const salida = join(root, 'tools', 'tmp', 'google-pilot', 'prueba');
  escribir(muestraActiva, 'audio vigente');
  const solicitudes = [];
  const wav = Buffer.from('RIFF0000WAVEdata');
  const convertir = async (wavPath, mp3Path) => {
    assert.deepEqual(readFileSync(wavPath), wav);
    escribir(mp3Path, Buffer.from('MP3 simulado'));
  };

  await generarPilotoConCliente({
    cliente: { sintetizar: async (item) => { solicitudes.push(item); return wav; } },
    lista: speech,
    directorioSalida: salida,
    convertir,
  });

  assert.equal(solicitudes.length, 12);
  assert.equal(readdirSync(salida).length, 4);
  assert.ok(solicitudes.every((solicitud) => solicitud.locale === 'es-US'));
  assert.equal(readFileSync(muestraActiva, 'utf8'), 'audio vigente');
});

function crearProyectoAudio(t) {
  const root = directorioTemporal(t, 'leer-google-batch-');
  const audioDir = join(root, 'audio');
  const tmpDir = join(root, 'tools', 'tmp');
  mkdirSync(join(root, 'css'), { recursive: true });
  mkdirSync(join(root, 'js'), { recursive: true });
  writeFileSync(join(root, 'index.html'), '<html></html>');
  writeFileSync(join(root, 'css', 'estilos.css'), 'body{}');
  writeFileSync(join(root, 'js', 'app.js'), '');
  for (const item of speech.filter((audio) => audio.efecto)) {
    escribir(join(root, item.ruta), `efecto:${item.efecto}`);
  }
  escribir(join(audioDir, 'instr', 'hola.mp3'), 'audio anterior');
  return { root, audioDir, tmpDir };
}

test('sintetiza todas las pistas en staging, preserva efectos y publica con backup', async (t) => {
  const { root, audioDir, tmpDir } = crearProyectoAudio(t);
  const backupDir = join(tmpDir, 'google-backup', 'audio-test');
  const voiceId = 'es-US-Neural2-A';
  const solicitudes = [];
  const convertir = async (wavPath, mp3Path) => {
    assert.match(readFileSync(wavPath).toString('ascii', 0, 4), /RIFF/);
    escribir(mp3Path, Buffer.from('MP3 simulado'));
  };

  const resultado = await generarLoteCompletoConCliente({
    cliente: { sintetizar: async (item) => { solicitudes.push(item); return Buffer.from('RIFF0000WAVEdata'); } },
    lista: speech,
    voiceId,
    audioDir,
    tmpDir,
    idEjecucion: 'lote-test',
    backupDir,
    raizProyecto: root,
    convertir,
    log: () => {},
  });

  assert.equal(solicitudes.length, speech.filter((item) => !item.efecto).length);
  assert.ok(solicitudes.every((item) => item.voiceId === voiceId && item.locale === 'es-US'));
  assert.ok(speech.filter((item) => !item.efecto).every((item) =>
    readFileSync(join(root, item.ruta)).toString() === 'MP3 simulado'));
  assert.equal(readFileSync(join(audioDir, 'efectos', 'clic.mp3'), 'utf8'), 'efecto:clic');
  assert.equal(readFileSync(join(backupDir, 'instr', 'hola.mp3'), 'utf8'), 'audio anterior');
  assert.equal(resultado.cantidad, speech.filter((item) => !item.efecto).length);
  assert.ok(resultado.bytes < 20_000_000);
});

test('un error en la API del lote deja los audios activos intactos y no publica backup', async (t) => {
  const { root, audioDir, tmpDir } = crearProyectoAudio(t);
  const backupDir = join(tmpDir, 'google-backup', 'audio-fallo');
  let llamadas = 0;
  const convertir = async (_wavPath, mp3Path) => escribir(mp3Path, Buffer.from('MP3 simulado'));

  await assert.rejects(generarLoteCompletoConCliente({
    cliente: {
      sintetizar: async () => {
        llamadas++;
        if (llamadas === 3) throw new Error('error API simulado');
        return Buffer.from('RIFF0000WAVEdata');
      },
    },
    lista: speech,
    voiceId: 'es-US-Neural2-A',
    audioDir,
    tmpDir,
    idEjecucion: 'lote-fallido',
    backupDir,
    raizProyecto: root,
    convertir,
    log: () => {},
  }), /error API simulado/);

  assert.equal(llamadas, 3);
  assert.equal(readFileSync(join(audioDir, 'instr', 'hola.mp3'), 'utf8'), 'audio anterior');
  assert.equal(readFileSync(join(audioDir, 'efectos', 'clic.mp3'), 'utf8'), 'efecto:clic');
  assert.equal(existsSync(backupDir), false);
});
