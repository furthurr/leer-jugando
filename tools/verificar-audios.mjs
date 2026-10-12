#!/usr/bin/env node
/* Informa de audios faltantes (error) y sobrantes (aviso). */
import { createRequire } from 'node:module';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { listaAudios } = require('./lista-audios.js');
const contenido = require('../js/datos/contenido.js');

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const indiceRaiz = process.argv.indexOf('--raiz');
if (indiceRaiz !== -1 && (!process.argv[indiceRaiz + 1] || process.argv[indiceRaiz + 1].startsWith('--'))) {
  console.error('Uso: node tools/verificar-audios.mjs [--raiz <directorio-audio>]');
  process.exit(2);
}
const DIR_AUDIO = indiceRaiz === -1
  ? join(RAIZ, 'audio')
  : resolve(process.cwd(), process.argv[indiceRaiz + 1]);
const prefijoAudio = 'audio/';
const esperadas = new Set(listaAudios(contenido).map((a) => a.ruta.slice(prefijoAudio.length)));

const faltan = [...esperadas].filter((r) => !existsSync(join(DIR_AUDIO, r)));

function recorrer(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? recorrer(p) : [relative(DIR_AUDIO, p).split('\\').join('/')];
  });
}
const sobran = recorrer(DIR_AUDIO)
  .filter((r) => r.endsWith('.mp3') && !esperadas.has(r))
  .map((r) => prefijoAudio + r);

console.log(`Esperados: ${esperadas.size} · Faltan: ${faltan.length} · Sobran: ${sobran.length}`);
faltan.forEach((r) => console.log('  falta  ', prefijoAudio + r));
sobran.forEach((r) => console.log('  sobra  ', r));
process.exit(faltan.length ? 1 : 0);
