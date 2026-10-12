'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const sesion = require('../js/dominio/sesion.js');
const letras = require('../js/dominio/letras.js');
const contenido = require('../js/datos/contenido.js');

/** rng determinista (LCG) para tests reproducibles. */
function rngSemilla(s) {
  let x = s;
  return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
}
const nivel = (id) => contenido.niveles.find((n) => n.id === id);
const crear = (id, semilla = 1) => sesion.crear(nivel(id), contenido, rngSemilla(semilla));

test('cada nivel genera de 5 a 8 ejercicios (Req 8.5)', () => {
  for (const n of contenido.niveles) {
    const s = sesion.crear(n, contenido, rngSemilla(7));
    assert.ok(s.total() >= 5 && s.total() <= 8, `${n.id}: ${s.total()}`);
  }
});

test('las opciones incluyen el objetivo y son de 2 a 4 (Req 4.1, 4.5)', () => {
  for (const n of contenido.niveles) {
    for (const e of sesion.crear(n, contenido, rngSemilla(3)).ejercicios) {
      if (!e.opciones || e.tipo === 'arma-palabra') continue;
      assert.ok(e.opciones.length >= 2 && e.opciones.length <= 4, `${n.id} ${e.tipo}`);
      assert.ok(e.opciones.includes(e.objetivo), `${n.id} ${e.tipo}`);
      assert.equal(new Set(e.opciones).size, e.opciones.length, `${n.id} opciones repetidas`);
    }
  }
});

test('ningún ejercicio muestra letras no presentadas (Req 3.3)', () => {
  for (const n of contenido.niveles) {
    const conocidas = letras.disponiblesHasta(contenido, n.id);
    for (const e of sesion.crear(n, contenido, rngSemilla(5)).ejercicios) {
      const textos = [...(e.items || []), ...(e.tipo.startsWith('lee-elige') || e.tipo.startsWith('escucha') || e.tipo === 'une-letras' ? e.opciones : []),
        ...(e.tipo === 'arma-palabra' ? [e.palabra] : []), ...(e.texto ? [e.texto] : [])];
      for (const t of textos) {
        const faltan = letras.letrasDe(t).filter((l) => !conocidas.has(l));
        assert.deepEqual(faltan, [], `${n.id} ${e.tipo}: "${t}"`);
      }
    }
  }
});

test('vocales: empieza con carretilla de sus vocales y luego escucha-elige', () => {
  const s = crear('v1');
  assert.equal(s.ejercicios[0].tipo, 'carretilla');
  assert.deepEqual(s.ejercicios[0].items, ['a', 'e', 'i']);
  assert.equal(s.ejercicios[0].categoria, 'letras');
  assert.ok(s.ejercicios.slice(1).every((e) => e.tipo === 'escucha-elige' && e.modelo.categoria === 'letras'));
});

test('consonante: carretilla, une-letras y escucha-elige de sus sílabas (Req 4.2, 4.3)', () => {
  const s = crear('m');
  const tipos = s.ejercicios.map((e) => e.tipo);
  assert.deepEqual(tipos.slice(0, 1), ['carretilla']);
  assert.deepEqual(s.ejercicios[0].items, ['ma', 'me', 'mi', 'mo', 'mu']);
  const une = s.ejercicios.filter((e) => e.tipo === 'une-letras');
  assert.ok(une.length >= 1);
  for (const e of une) {
    assert.equal(e.consonante, 'm');
    assert.equal(e.silaba, 'm' + e.objetivo);
    assert.deepEqual(e.modelo, { categoria: 'silabas', texto: e.silaba });
  }
  assert.ok(tipos.includes('escucha-elige'));
});

test('palabras: arma-palabra con sílabas desordenadas y lee-elige con dibujos distintos (Req 4.4, 4.5)', () => {
  const s = crear('pal1', 11);
  const arma = s.ejercicios.filter((e) => e.tipo === 'arma-palabra');
  assert.ok(arma.length >= 1);
  for (const e of arma) {
    assert.deepEqual(e.objetivo, contenido.palabras[e.palabra].silabas);
    assert.deepEqual([...e.opciones].sort(), [...e.objetivo].sort());
    assert.equal(e.imagen, contenido.palabras[e.palabra].imagen);
  }
  const lee = s.ejercicios.filter((e) => e.tipo === 'lee-elige-palabra');
  assert.ok(lee.length >= 1);
  for (const e of lee) {
    const imgs = e.opciones.map((o) => e.imagenes[o]);
    assert.equal(new Set(imgs).size, imgs.length);
    assert.equal(e.texto, e.objetivo);
  }
});

test('Q: practica que/qui y une qu con e/i, nunca qa ni qe', () => {
  const s = crear('q');
  assert.deepEqual(s.ejercicios[0].items, ['que', 'qui']);
  assert.equal(s.ejercicios[0].letra, 'q');
  for (const e of s.ejercicios.filter((e) => e.tipo === 'une-letras')) {
    assert.equal(e.consonante, 'qu');
    assert.equal(e.silaba, 'qu' + e.objetivo);
    assert.deepEqual(e.opciones.slice().sort(), ['e', 'i']);
  }
});

test('cuento: páginas en orden y pregunta al final (Req 4.6, 4.7)', () => {
  const s = crear('c1');
  const n = nivel('c1');
  const paginas = s.ejercicios.filter((e) => e.tipo === 'cuento');
  assert.deepEqual(paginas.map((p) => p.texto), n.paginas.map((p) => p.texto));
  const ultimo = s.ejercicios[s.ejercicios.length - 1];
  assert.equal(ultimo.tipo, 'pregunta');
  assert.equal(ultimo.objetivo, n.pregunta.correcta);
  assert.equal(ultimo.instruccion, 'pregunta-c1');
});

test('responder: correcto avanza; dos fallos seguidos activan la pista (Req 5.2, 5.3)', () => {
  const s = crear('v1');
  s.completar(); // carretilla
  const e = s.actual();
  const mal = e.opciones.find((o) => o !== e.objetivo);
  assert.deepEqual(s.responder(mal), { correcto: false, pista: false, parcial: false, fin: false });
  assert.deepEqual(s.responder(mal), { correcto: false, pista: true, parcial: false, fin: false });
  assert.equal(s.actual(), e);
  const r = s.responder(e.objetivo);
  assert.equal(r.correcto, true);
  assert.notEqual(s.actual(), e);
});

test('arma-palabra: acepta las sílabas una a una en orden', () => {
  const s = crear('pal1');
  while (s.actual().tipo !== 'arma-palabra') s.responder(s.actual().objetivo);
  const e = s.actual();
  assert.equal(s.responder(e.objetivo[0]).parcial, true);
  assert.equal(s.paso(), 1);
  assert.equal(s.responder('zz').correcto, false);
  let r;
  for (let i = 1; i < e.objetivo.length; i++) r = s.responder(e.objetivo[i]);
  assert.equal(r.correcto, true);
  assert.equal(r.parcial, false);
  assert.notEqual(s.actual(), e);
});

test('resultado: estrellas según aciertos al primer intento en ejercicios puntuables (Req 5.4)', () => {
  const perfecta = crear('m');
  let r;
  while (!r || !r.fin) {
    const e = perfecta.actual();
    if (!e.puntua) { r = perfecta.completar(); continue; }
    if (Array.isArray(e.objetivo)) e.objetivo.forEach((x) => { r = perfecta.responder(x); });
    else r = perfecta.responder(e.objetivo);
  }
  assert.equal(perfecta.resultado().estrellas, 3);
  assert.equal(perfecta.resultado().aciertosPrimerIntento, perfecta.resultado().puntuables);

  const conFallos = crear('m');
  r = null;
  while (!r || !r.fin) {
    const e = conFallos.actual();
    if (!e.puntua) { r = conFallos.completar(); continue; }
    conFallos.responder('__mal__');
    if (Array.isArray(e.objetivo)) e.objetivo.forEach((x) => { r = conFallos.responder(x); });
    else r = conFallos.responder(e.objetivo);
  }
  assert.equal(conFallos.resultado().aciertosPrimerIntento, 0);
  assert.equal(conFallos.resultado().estrellas, 1);
});

test('crear es determinista con el mismo rng', () => {
  assert.deepEqual(crear('pal2', 9).ejercicios, crear('pal2', 9).ejercicios);
});
