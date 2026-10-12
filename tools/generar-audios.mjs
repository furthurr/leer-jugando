#!/usr/bin/env node
/* Genera un piloto Google TTS aislado o publica un lote ya aprobado. */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearClienteGoogle, validarAdcGoogle } from './google-tts.mjs';
import { prepararStagingAudio, publicarStagingAudio } from './publicar-audios.mjs';

const require = createRequire(import.meta.url);
const { listaAudios } = require('./lista-audios.js');
const contenido = require('../js/datos/contenido.js');
const { VOCES_GOOGLE, crearMuestrasPiloto, crearLoteVoz } = require('./plan-generacion-google.js');

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO = join(RAIZ, 'audio');
const TMP = join(RAIZ, 'tools/tmp');
const RUTA_VERIFICADOR = join(RAIZ, 'tools/verificar-audios.mjs');
const LIMITE_PAQUETE_BYTES = 20_000_000;

const TONOS = {
  acierto: [[660, 0.1], [880, 0.22]],
  casi: [[440, 0.14], [392, 0.22]],
  estrella: [[1319, 0.08], [1568, 0.08], [2093, 0.25]],
  fanfarria: [[523, 0.14], [659, 0.14], [784, 0.14], [1047, 0.5]],
  clic: [[900, 0.04]],
};

function errorDeUso(mensaje) {
  const error = new Error(mensaje);
  error.exitCode = 2;
  return error;
}

function ayuda() {
  return [
    'Uso:',
    '  npm run audios -- --piloto --confirmar-costo',
    '  npm run audios -- --lote --voz <es-US-Neural2-A|es-US-Neural2-B|es-US-Neural2-C> --acepto-piloto --confirmar-lote',
    '  npm run audios -- --efectos',
  ].join('\n');
}

export function analizarArgumentos(args) {
  const modos = ['--piloto', '--lote', '--efectos'].filter((modo) => args.includes(modo));
  if (modos.length !== 1) throw errorDeUso(ayuda());
  const modo = modos[0];

  if (modo === '--piloto') {
    const noPermitidos = args.filter((arg) => !['--piloto', '--confirmar-costo'].includes(arg));
    if (noPermitidos.length) throw errorDeUso(`Argumentos no válidos para piloto.\n${ayuda()}`);
    if (!args.includes('--confirmar-costo')) {
      throw errorDeUso('Revisa facturación/cuota y confirma con --confirmar-costo antes de llamar a Google.');
    }
    return { modo: 'piloto' };
  }

  if (modo === '--efectos') {
    if (args.length !== 1) throw errorDeUso(`--efectos no acepta otros argumentos.\n${ayuda()}`);
    return { modo: 'efectos' };
  }

  const indiceVoz = args.indexOf('--voz');
  const voiceId = indiceVoz === -1 ? '' : args[indiceVoz + 1];
  if (indiceVoz === -1 || !voiceId || voiceId.startsWith('--')) {
    throw errorDeUso(`El lote requiere --voz <${VOCES_GOOGLE.join('|')}>.\n${ayuda()}`);
  }
  if (!VOCES_GOOGLE.includes(voiceId)) throw errorDeUso(`Voz Google no válida: ${voiceId}.`);

  const opcionesPermitidas = new Set(['--lote', '--voz', voiceId, '--acepto-piloto', '--confirmar-lote']);
  const noPermitidos = args.filter((arg) => !opcionesPermitidas.has(arg));
  if (noPermitidos.length) throw errorDeUso(`Argumentos no válidos para lote.\n${ayuda()}`);

  const faltantes = [];
  if (!args.includes('--acepto-piloto')) faltantes.push('--acepto-piloto');
  if (!args.includes('--confirmar-lote')) faltantes.push('--confirmar-lote');
  if (faltantes.length) {
    throw errorDeUso(`Confirma piloto y cuota/costo para el lote: ${faltantes.join(', ')}.\n${ayuda()}`);
  }
  return { modo: 'lote', voiceId };
}

function ejecutar(comando, argumentos) {
  return new Promise((resolvePromise, rejectPromise) => {
    const proceso = spawn(comando, argumentos, { stdio: ['ignore', 'ignore', 'pipe'] });
    let errores = '';
    proceso.stderr.setEncoding('utf8');
    proceso.stderr.on('data', (fragmento) => { errores += fragmento; });
    proceso.on('error', rejectPromise);
    proceso.on('close', (codigo) => {
      if (codigo === 0) resolvePromise();
      else rejectPromise(new Error(`${comando} terminó con código ${codigo}${errores.trim() ? `: ${errores.trim()}` : ''}`));
    });
  });
}

async function convertirWavAMp3(wavPath, mp3Path) {
  mkdirSync(dirname(mp3Path), { recursive: true });
  await ejecutar('ffmpeg', ['-y', '-loglevel', 'error', '-i', wavPath, '-ac', '1', '-b:a', '96k', mp3Path]);
  if (!existsSync(mp3Path) || statSync(mp3Path).size === 0) {
    throw new Error(`ffmpeg no produjo un MP3 válido: ${mp3Path}`);
  }
}

function identificadorEjecucion() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export async function generarPilotoConCliente({ cliente, lista, directorioSalida, convertir = convertirWavAMp3, log = () => {} }) {
  if (!cliente || typeof cliente.sintetizar !== 'function') throw new Error('Cliente Google TTS no configurado.');
  if (!Array.isArray(lista) || !directorioSalida) throw new Error('Faltan lista de audio o staging para el piloto.');
  if (existsSync(directorioSalida)) throw new Error('El directorio del piloto ya existe; no se sobrescribirá.');

  const muestras = crearMuestrasPiloto(lista);
  mkdirSync(directorioSalida, { recursive: true });
  writeFileSync(join(directorioSalida, 'README.txt'), [
    'Piloto Google Cloud TTS es-US — revisión auditiva',
    '',
    'Cada voz contiene letra.mp3, silaba.mp3, palabra.mp3 e instruccion.mp3.',
    'Los WAV contienen la salida original LINEAR16; los MP3 son conversiones de escucha.',
    'Voces candidatas: es-US-Neural2-A, es-US-Neural2-B, es-US-Neural2-C.',
    'Evalúa si el acento es aceptable para el público latinoamericano antes de aprobar.',
  ].join('\n'), 'utf8');

  for (const [indice, muestra] of muestras.entries()) {
    const carpetaVoz = join(directorioSalida, muestra.voiceId);
    const wavPath = join(carpetaVoz, `${muestra.tipo}.wav`);
    const mp3Path = join(carpetaVoz, `${muestra.tipo}.mp3`);
    mkdirSync(carpetaVoz, { recursive: true });
    const wav = await cliente.sintetizar(muestra);
    writeFileSync(wavPath, wav);
    await convertir(wavPath, mp3Path);
    log(`[${indice + 1}/${muestras.length}] ${muestra.voiceId}/${muestra.tipo}`);
  }
  return { cantidad: muestras.length, directorio: directorioSalida };
}

function rutaRelativaAudio(ruta) {
  return ruta.startsWith('audio/') ? ruta.slice('audio/'.length) : ruta;
}

async function sintetizarLote(cliente, lote, directorioStaging, directorioWav, convertir, log) {
  mkdirSync(directorioWav, { recursive: true });
  for (const [indice, item] of lote.entries()) {
    const wavPath = join(directorioWav, `${String(indice).padStart(3, '0')}.wav`);
    const mp3Path = join(directorioStaging, rutaRelativaAudio(item.ruta));
    const wav = await cliente.sintetizar(item);
    writeFileSync(wavPath, wav);
    try {
      await convertir(wavPath, mp3Path);
    } finally {
      rmSync(wavPath, { force: true });
    }
    log(`[${indice + 1}/${lote.length}] ${item.ruta}`);
  }
}

function verificarRaizAudio(directorioAudio, log = () => {}) {
  const resultado = spawnSync(process.execPath, [RUTA_VERIFICADOR, '--raiz', directorioAudio], { encoding: 'utf8' });
  if (resultado.stdout) log(resultado.stdout.trimEnd());
  if (resultado.stderr) log(resultado.stderr.trimEnd());
  if (resultado.status !== 0) throw new Error(`La verificación de staging falló (código ${resultado.status}).`);
}

function sumarBytes(directorio) {
  if (!existsSync(directorio)) return 0;
  const info = statSync(directorio);
  if (!info.isDirectory()) return info.size;
  return readdirSync(directorio).reduce((total, nombre) => total + sumarBytes(join(directorio, nombre)), 0);
}

function tamañoPaquete(audioCandidato, raizProyecto) {
  return sumarBytes(join(raizProyecto, 'index.html')) + sumarBytes(join(raizProyecto, 'css')) +
    sumarBytes(join(raizProyecto, 'js')) + sumarBytes(audioCandidato);
}

function comprobarEfectosSinCambios(lista, directorioStaging, audioActual) {
  for (const efecto of lista.filter((item) => item.efecto)) {
    const ruta = rutaRelativaAudio(efecto.ruta);
    if (!readFileSync(join(audioActual, ruta)).equals(readFileSync(join(directorioStaging, ruta)))) {
      throw new Error(`El efecto ${efecto.ruta} cambió dentro del staging.`);
    }
  }
}

export async function generarLoteCompletoConCliente({
  cliente,
  lista,
  voiceId,
  audioDir = AUDIO,
  tmpDir = TMP,
  idEjecucion = identificadorEjecucion(),
  backupDir = join(tmpDir, 'google-backup', `audio-${idEjecucion}`),
  raizProyecto = RAIZ,
  convertir = convertirWavAMp3,
  log = () => {},
} = {}) {
  if (!cliente || typeof cliente.sintetizar !== 'function') throw new Error('Cliente Google TTS no configurado.');
  if (!Array.isArray(lista)) throw new Error('Falta la lista de audios para generar.');
  const lote = crearLoteVoz(lista, voiceId);
  const directorioBuild = join(tmpDir, 'google-build', idEjecucion);
  const directorioStaging = join(directorioBuild, 'audio');
  const directorioWav = join(directorioBuild, 'wav');
  prepararStagingAudio({ audioDir, stagingDir: directorioStaging });
  await sintetizarLote(cliente, lote, directorioStaging, directorioWav, convertir, log);
  verificarRaizAudio(directorioStaging, log);
  comprobarEfectosSinCambios(lista, directorioStaging, audioDir);

  const bytes = tamañoPaquete(directorioStaging, raizProyecto);
  log(`Tamaño del paquete del juego: ${(bytes / 1_000_000).toFixed(2)} MB.`);
  if (bytes >= LIMITE_PAQUETE_BYTES) {
    throw new Error('El lote alcanza o supera 20,000,000 bytes; audio/ no se modificó.');
  }
  const respaldo = publicarStagingAudio({ audioDir, stagingDir: directorioStaging, backupDir });
  return { cantidad: lote.length, respaldo, bytes };
}

function generarEfecto(nombre, destino) {
  const tonos = TONOS[nombre];
  const entradas = tonos.flatMap(([frecuencia, duracion]) => ['-f', 'lavfi', '-i', `sine=frequency=${frecuencia}:duration=${duracion}`]);
  const total = tonos.reduce((suma, [, duracion]) => suma + duracion, 0);
  const filtro = `${tonos.map((_, indice) => `[${indice}]`).join('')}concat=n=${tonos.length}:v=0:a=1,` +
    `afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, total - 0.15).toFixed(2)}:d=0.15,volume=0.35`;
  return ejecutar('ffmpeg', ['-y', '-loglevel', 'error', ...entradas, '-filter_complex', filtro, '-ac', '1', '-b:a', '64k', destino]);
}

async function generarEfectosFaltantes() {
  for (const nombre of Object.keys(TONOS)) {
    const destino = join(AUDIO, 'efectos', `${nombre}.mp3`);
    if (existsSync(destino)) continue;
    mkdirSync(dirname(destino), { recursive: true });
    await generarEfecto(nombre, destino);
    console.log(`Efecto generado: audio/efectos/${nombre}.mp3`);
  }
}

export async function ejecutarGeneracion(args = [], deps = {}) {
  const opciones = analizarArgumentos(args);
  if (opciones.modo === 'efectos') return generarEfectosFaltantes();

  const preflight = deps.validarAdc || validarAdcGoogle;
  const { projectId } = await preflight();
  const crearCliente = deps.crearCliente || crearClienteGoogle;
  const cliente = deps.cliente || crearCliente({ projectId });
  const lista = deps.lista || listaAudios(contenido);
  const tmpDir = deps.tmpDir || TMP;

  if (opciones.modo === 'piloto') {
    const directorioSalida = deps.directorioSalida || join(tmpDir, 'google-pilot', identificadorEjecucion());
    (deps.log || console.log)(`Google Cloud TTS proyecto ${projectId}; 12 solicitudes piloto; salida ${relative(RAIZ, directorioSalida)}.`);
    return generarPilotoConCliente({
      cliente,
      lista,
      directorioSalida,
      convertir: deps.convertir || convertirWavAMp3,
      log: deps.log || console.log,
    });
  }

  (deps.log || console.log)(`Google Cloud TTS proyecto ${projectId}; 279 solicitudes de lote con ${opciones.voiceId}.`);
  return generarLoteCompletoConCliente({
    cliente,
    lista,
    voiceId: opciones.voiceId,
    audioDir: deps.audioDir || AUDIO,
    tmpDir,
    idEjecucion: deps.idEjecucion,
    backupDir: deps.backupDir,
    raizProyecto: deps.raizProyecto || RAIZ,
    convertir: deps.convertir || convertirWavAMp3,
    log: deps.log || console.log,
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  ejecutarGeneracion(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = error.exitCode || 1;
  });
}
