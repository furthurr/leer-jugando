#!/usr/bin/env node
/* Smoke test en Chrome real (headless) vía file://: detecta errores de carga/consola. Uso puntual, no CI. */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const indexUrl = 'file://' + resolve('index.html');
const perfil = mkdtempSync(join(tmpdir(), 'leer-'));

// Script que corre dentro de la página al cargar: recoge errores y comprueba que arrancó.
const prueba = `
  const errores = [];
  window.addEventListener('error', e => errores.push(String(e.message)));
  window.addEventListener('unhandledrejection', e => errores.push('promesa: ' + e.reason));
  setTimeout(() => {
    const hayJugar = document.body.textContent.includes('Jugar');
    const scripts = window.LEER && Object.keys(window.LEER.pantallas||{}).length;
    console.log('RESULTADO:' + JSON.stringify({ errores, hayJugar, pantallas: scripts }));
  }, 500);
`;
const htmlPrueba = join(perfil, 'probe.js');
writeFileSync(htmlPrueba, prueba);

const r = spawnSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--user-data-dir=' + perfil, '--virtual-time-budget=2000',
  '--dump-dom', indexUrl,
], { encoding: 'utf8', timeout: 30000 });

const dom = r.stdout || '';
const arrancoInicio = dom.includes('Jugar') && dom.includes('Leer jugando');
const sinNoscript = !dom.includes('necesita JavaScript');
console.log('DOM contiene "Jugar":', dom.includes('Jugar'));
console.log('DOM contiene título:', dom.includes('Leer jugando'));
console.log('JS se ejecutó (no quedó el <noscript>):', sinNoscript);
if (r.stderr && /error/i.test(r.stderr)) console.log('stderr:', r.stderr.split('\n').filter((l) => /error/i.test(l)).slice(0, 5).join('\n'));

process.exit(arrancoInicio && sinNoscript ? 0 : 1);
