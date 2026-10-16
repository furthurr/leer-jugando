'use strict';
/*
 * Smoke test de integración: carga TODOS los scripts del navegador en un DOM mínimo
 * simulado y recorre pantallas y un nivel completo. No reemplaza la prueba manual
 * de arrastre/audio real (excepción UI documentada en design.md), pero detecta
 * errores de carga, cableado e inserción en el DOM.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const RAIZ = path.resolve(__dirname, '..');

function construirDom() {
  function Elem(tag) {
    this.tagName = String(tag).toUpperCase(); this.nodeType = 1; this.children = []; this.style = {}; this.dataset = {};
    this.classList = new Set();
    this._attrs = {}; this._text = '';
    this._handlers = {};
  }
  Elem.prototype.appendChild = function (n) { this.children.push(n); n.parentNode = this; return n; };
  Elem.prototype.append = function (...ns) { ns.forEach((n) => this.appendChild(typeof n === 'object' ? n : txt(n))); };
  Elem.prototype.setAttribute = function (k, v) { this._attrs[k] = String(v); };
  Elem.prototype.getAttribute = function (k) { return k in this._attrs ? this._attrs[k] : null; };
  Elem.prototype.removeAttribute = function (k) { delete this._attrs[k]; };
  Elem.prototype.addEventListener = function (t, fn) { (this._handlers[t] = this._handlers[t] || []).push(fn); };
  Elem.prototype.removeEventListener = function (t, fn) { if (this._handlers[t]) this._handlers[t] = this._handlers[t].filter((f) => f !== fn); };
  Elem.prototype.dispatch = function (t, ev) { (this._handlers[t] || []).forEach((f) => f(ev || { currentTarget: this, preventDefault() {} })); };
  Elem.prototype.click = function () { this.dispatch('click', { currentTarget: this, preventDefault() {} }); };
  Elem.prototype.setPointerCapture = function () {};
  Elem.prototype.getBoundingClientRect = function () { return { width: 100, height: 100, left: 0, top: 0 }; };
  Object.defineProperty(Elem.prototype, 'className', { set(v) { this.classList = new Set(String(v).split(/\s+/).filter(Boolean)); }, get() { return [...this.classList].join(' '); } });
  Object.defineProperty(Elem.prototype, 'textContent', { set(v) { this._text = String(v); this.children = []; }, get() { return this._text || this.children.map((c) => c.textContent).join(''); } });
  Object.defineProperty(Elem.prototype, 'offsetWidth', { get() { return 1; } });
  Object.defineProperty(Elem.prototype, 'value', { set(v) { this._value = v; }, get() { return this._value || ''; } });
  // classList compat
  const origSet = Set.prototype;
  Elem.prototype.classList = null;
  const txt = (t) => ({ nodeType: 3, textContent: String(t), appendChild() {}, append() {} });

  function crear(tag) {
    const e = new Elem(tag);
    e.classList = { _s: new Set(), add(...c) { c.forEach((x) => this._s.add(x)); }, remove(...c) { c.forEach((x) => this._s.delete(x)); }, toggle(c, f) { if (f) this._s.add(c); else this._s.delete(c); }, contains(c) { return this._s.has(c); } };
    Object.defineProperty(e, 'className', { configurable: true, set(v) {}, get() { return [...e.classList._s].join(' '); } });
    return e;
  }

  const appNode = crear('main'); appNode.id = 'app';
  const document = {
    _app: appNode,
    createElement: crear,
    createElementNS: (namespace, tag) => crear(tag),
    createTextNode: (t) => ({ nodeType: 3, textContent: String(t) }),
    getElementById: (id) => (id === 'app' ? appNode : null),
    addEventListener() {}, readyState: 'complete',
    elementFromPoint: () => null,
    body: crear('body'),
  };
  return { document, appNode, Node: Object, crear };
}

function Audio() { return { play: () => Promise.resolve(), pause() {}, onended: null, onerror: null }; }

function cargarJuego(estadoInicial, sintesis) {
  const dom = construirDom();
  const memoria = {};
  const pedidos = [];
  if (estadoInicial) memoria['leer.v1'] = JSON.stringify(estadoInicial);
  const localStorage = { getItem: (k) => (k in memoria ? memoria[k] : null), setItem: (k, v) => { memoria[k] = String(v); }, removeItem: (k) => { delete memoria[k]; } };
  function Audio() {
    const a = { play: () => { queueMicrotask(() => { if (a.onended) a.onended(); }); return Promise.resolve(); }, pause() {}, onended: null, onerror: null, currentTime: 0, volume: 1, _src: '' };
    Object.defineProperty(a, 'src', { set(v) { a._src = v; pedidos.push(v); }, get() { return a._src; } });
    return a;
  }
  const sandbox = {
    document: dom.document, Audio, localStorage, speechSynthesis: sintesis,
    SpeechSynthesisUtterance: function () {}, console: { warn() {}, error() {}, log() {} },
    setTimeout: (fn) => { fn(); return 0; }, clearTimeout() {}, Math: Object.assign(Object.create(Math), { random: () => 0.5 }), queueMicrotask,
  };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);

  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  assert.ok(scripts.length > 15, 'index.html debe cargar todos los scripts');
  for (const rel of scripts) {
    const code = fs.readFileSync(path.join(RAIZ, rel), 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }
  return { sandbox, appNode: dom.appNode, memoria, pedidos };
}

function botones(nodo, acc = []) {
  if (nodo.tagName === 'BUTTON' || nodo.tagName === 'button') acc.push(nodo);
  (nodo.children || []).forEach((c) => c.tagName && botones(c, acc));
  return acc;
}
function buscarPorTexto(nodo, frag) { return botones(nodo).find((b) => (b.textContent || '').includes(frag)); }

test('todos los scripts cargan y arranca en la pantalla de inicio', () => {
  const { appNode } = cargarJuego();
  assert.ok(buscarPorTexto(appNode, 'Jugar'), 'debe mostrarse el botón Jugar');
});

test('flujo inicio → perfil (saltar) → saludo → mapa sin errores', async () => {
  const { appNode } = cargarJuego();
  const microtareas = () => new Promise((r) => setImmediate(r));
  buscarPorTexto(appNode, 'Jugar').click();           // inicio (async: desbloquea audio)
  await microtareas();
  const saltar = buscarPorTexto(appNode, 'Saltar');
  assert.ok(saltar, 'tras Jugar sin perfil, aparece la pantalla de perfil');
  saltar.click();                                     // perfil → saludo
  const vamos = buscarPorTexto(appNode, 'Vamos');
  assert.ok(vamos, 'aparece el saludo');
  vamos.click();                                      // saludo → mapa
  assert.ok(appNode.textContent.includes('Mi aventura de lectura'), 'aparece el mapa');
  for (const titulo of ['Etapa 1 · M P S L T D N F B V', 'Etapa 2 · C Q G R', 'Etapa 3 · J Ñ H Y', 'Etapa 4 · Z X K W']) {
    assert.ok(appNode.textContent.includes(titulo), titulo);
    assert.equal(appNode.textContent.split(titulo).length - 1, 1, 'un encabezado por etapa');
  }
});

test('el mapa muestra el progreso real y mantiene el acceso a niveles y candados', () => {
  const { sandbox } = cargarJuego();
  const progreso = sandbox.LEER.progreso;
  const estado = progreso.registrar(progreso.inicial(), 'v1', 2);
  const jugados = [];
  const audios = [];
  const app = {
    estado, contenido: sandbox.LEER.contenido, progreso,
    clavesAudio: sandbox.LEER.clavesAudio,
    jugarNivel: (id) => jugados.push(id), reproducir: (ruta) => audios.push(ruta), irAAdultos() {},
  };
  const mapa = sandbox.LEER.pantallas.mapa(app);
  const niveles = botones(mapa).filter((b) => b.getAttribute('data-nivel'));
  assert.equal(niveles.length, app.contenido.niveles.length);
  assert.equal(niveles.filter((b) => b.getAttribute('aria-current') === 'step').length, 1);
  assert.equal(niveles[1].getAttribute('aria-current'), 'step');
  assert.match(niveles[0].getAttribute('aria-label'), /2 estrellas/);
  assert.match(niveles[2].getAttribute('aria-label'), /cerrado/);
  assert.ok(mapa.textContent.includes('1 de ' + niveles.length + ' actividades completadas'));
  niveles[0].click();
  niveles[1].click();
  niveles[2].click();
  assert.deepEqual(jugados, ['v1', 'v2']);
  assert.ok(audios.some((ruta) => ruta.includes('bloqueado')));
  assert.equal(Object.keys(estado.niveles).length, 1, 'dibujar o tocar el mapa no cambia el progreso');

  const libre = sandbox.LEER.pantallas.mapa({ ...app, estado: { ...estado, todoDesbloqueado: true } });
  assert.ok(botones(libre).filter((b) => b.getAttribute('data-nivel')).every((b) => !b.getAttribute('aria-label').includes('cerrado')));
  const terminado = sandbox.LEER.pantallas.mapa({ ...app, estado: { ...estado, niveles: Object.fromEntries(app.contenido.niveles.map((n) => [n.id, { estrellas: 3 }])) } });
  assert.ok(terminado.textContent.includes('¡Completaste tu aventura!'));
  assert.ok(!botones(terminado).some((b) => b.getAttribute('aria-current')));
});

test('la presentación de H reproduce su explicación antes de practicar sílabas', async () => {
  const estado = { version: 1, perfilListo: true, niveles: {}, todoDesbloqueado: true, volumen: 0.9 };
  const { appNode, pedidos } = cargarJuego(estado);
  const flush = () => new Promise((r) => setImmediate(() => setImmediate(() => setImmediate(r))));
  buscarPorTexto(appNode, 'Jugar').click();
  await flush();
  buscarPorTexto(appNode, 'Vamos').click();
  botones(appNode).find((b) => b.children[0] && b.children[0].textContent === 'h').click();
  await flush();
  assert.ok(pedidos.includes('audio/letras/h.mp3'));
  assert.ok(botones(appNode).some((b) => b.textContent === 'ha'));
});

test('Abdiel usa el MP3 de Google en el saludo sin recurrir a la voz del dispositivo', async () => {
  for (const nombre of ['ABDIEL', 'Abdiel', 'abdiel']) {
    let llamadas = 0;
    const sintesis = { getVoices: () => [{ lang: 'es-MX' }], cancel() {}, speak() { llamadas++; } };
    const estado = { version: 1, perfil: { nombre, sexo: 'm' }, perfilListo: true, niveles: {}, volumen: 0.9 };
    const { appNode, pedidos } = cargarJuego(estado, sintesis);
    buscarPorTexto(appNode, 'Jugar').click();
    await new Promise((r) => setImmediate(() => setImmediate(() => setImmediate(r))));
    const hola = pedidos.indexOf('audio/instr/hola.mp3');
    const abdiel = pedidos.indexOf('audio/palabras/abdiel.mp3');
    const bienvenida = pedidos.indexOf('audio/instr/bienvenida-m.mp3');
    assert.ok(hola >= 0 && abdiel > hola && bienvenida > abdiel, nombre);
    assert.equal(llamadas, 0, 'no usa síntesis del dispositivo');
  }
});

test('Abdiel también usa el MP3 de Google al terminar un nivel', async () => {
  const estado = { version: 1, perfil: { nombre: 'ABDIEL', sexo: 'm' }, perfilListo: true, niveles: {}, volumen: 0.9 };
  let llamadas = 0;
  const sintesis = { getVoices: () => [{ lang: 'es-MX' }], cancel() {}, speak() { llamadas++; } };
  const { appNode, pedidos } = cargarJuego(estado, sintesis);
  const flush = () => new Promise((r) => setImmediate(() => setImmediate(() => setImmediate(r))));
  buscarPorTexto(appNode, 'Jugar').click();
  await flush();
  buscarPorTexto(appNode, 'Vamos').click();
  botones(appNode).find((b) => b.children[0] && b.children[0].textContent === 'a e i').click();
  ['a', 'e', 'i'].forEach((letra) => botones(appNode).find((b) => b.textContent === letra).click());
  buscarPorTexto(appNode, '👉').click();
  await flush();
  const contenido = require('../js/datos/contenido.js');
  const ref = require('../js/dominio/sesion.js').crear(contenido.niveles[0], contenido, () => 0.5);
  for (const ejercicio of ref.ejercicios.slice(1)) {
    botones(appNode).find((b) => b.textContent === ejercicio.objetivo).click();
    await flush();
  }
  assert.ok(appNode.textContent.includes('¡Muy bien, ABDIEL!'));
  assert.equal(pedidos.filter((ruta) => ruta === 'audio/palabras/abdiel.mp3').length, 2);
  assert.equal(llamadas, 0);
  const fanfarria = pedidos.lastIndexOf('audio/efectos/fanfarria.mp3');
  assert.ok(pedidos.lastIndexOf('audio/palabras/abdiel.mp3') > fanfarria);
});

test('el inicio avanza aunque el navegador rechace play() (caso file://)', async () => {
  // En file:// Chrome rechaza audio.play(); el desbloqueo no debe bloquear el inicio.
  const { crearReproductor } = require('../js/infra/reproductor.js');
  let srcUsado = null;
  const audioFalso = {
    set src(v) { srcUsado = v; }, get src() { return srcUsado; },
    play: () => Promise.reject(new Error('unique security origin')),
    pause() {}, volume: 1, currentTime: 0,
  };
  const rep = crearReproductor(() => audioFalso, { warn() {} });
  await rep.desbloquear(); // no debe lanzar ni quedarse colgado
  assert.ok(srcUsado && srcUsado.startsWith('data:audio'), 'desbloquea con un data URI, no con un recurso file://');
});

test('el inicio no espera a que un WebView móvil resuelva play()', () => {
  const { sandbox, appNode } = cargarJuego();
  appNode.textContent = '';
  let continuo = false;
  const pantalla = sandbox.LEER.pantallas.inicio({
    reproductor: { desbloquear: () => new Promise(() => {}) },
    continuarDesdeInicio() { continuo = true; },
  });
  appNode.append(pantalla);
  buscarPorTexto(appNode, 'Jugar').click();
  assert.equal(continuo, true, 'la navegación continúa sin esperar la promesa de audio');
});

test('tras la carretilla, "siguiente" avanza al ejercicio siguiente (no lo repite)', async () => {
  const { appNode } = cargarJuego();
  const microtareas = () => new Promise((r) => setImmediate(r));
  buscarPorTexto(appNode, 'Jugar').click();
  await microtareas();
  buscarPorTexto(appNode, 'Saltar').click();
  buscarPorTexto(appNode, 'Vamos').click();
  // Nivel 1 (v1, vocales) empieza con la carretilla a e i.
  const nivel1 = botones(appNode).find((b) => (b.textContent || '').includes('a e i'));
  assert.ok(nivel1, 'debe existir el botón del nivel de vocales');
  nivel1.click();
  assert.ok(appNode.textContent.includes('🚂'), 'la carretilla muestra la locomotora');
  // Escuchar todas las fichas habilita el botón siguiente.
  ['a', 'e', 'i'].forEach((letra) => {
    const ficha = botones(appNode).find((b) => (b.textContent || '').trim() === letra);
    assert.ok(ficha, `ficha ${letra}`);
    ficha.click();
  });
  const siguiente = botones(appNode).find((b) => (b.textContent || '').includes('👉'));
  assert.ok(siguiente, 'aparece el botón siguiente al oír toda la carretilla');
  siguiente.click();
  assert.ok(!appNode.textContent.includes('🚂'), 'tras siguiente ya no debe repetirse la carretilla');
});

test('la carretilla no apila botones "siguiente" al retocar una ficha', async () => {
  const { appNode } = cargarJuego();
  const microtareas = () => new Promise((r) => setImmediate(r));
  buscarPorTexto(appNode, 'Jugar').click();
  await microtareas();
  buscarPorTexto(appNode, 'Saltar').click();
  buscarPorTexto(appNode, 'Vamos').click();
  botones(appNode).find((b) => (b.textContent || '').includes('a e i')).click();
  const fichas = () => ['a', 'e', 'i'].map((l) => botones(appNode).find((b) => (b.textContent || '').trim() === l));
  fichas().forEach((f) => f.click());
  const cuentaSiguiente = () => botones(appNode).filter((b) => (b.textContent || '').includes('👉')).length;
  assert.equal(cuentaSiguiente(), 1, 'un solo botón siguiente tras completar');
  fichas()[0].click();
  fichas()[1].click();
  assert.equal(cuentaSiguiente(), 1, 'retocar fichas no debe añadir más botones siguiente');
});

test('la pista resalta la correcta y vuelve a reproducir el modelo (Req 5.3)', async () => {
  const sesionMod = require('../js/dominio/sesion.js');
  const contenido = require('../js/datos/contenido.js');
  const ref = sesionMod.crear(contenido.niveles.find((n) => n.id === 'v1'), contenido, () => 0.5);
  const objetivo = ref.ejercicios[1].objetivo; // primer ejercicio de escucha tras la carretilla

  const { appNode, pedidos } = cargarJuego();
  const flush = () => new Promise((r) => setImmediate(() => setImmediate(() => setImmediate(r))));
  buscarPorTexto(appNode, 'Jugar').click();
  await flush();
  buscarPorTexto(appNode, 'Saltar').click();
  buscarPorTexto(appNode, 'Vamos').click();
  botones(appNode).find((b) => (b.textContent || '').includes('a e i')).click();
  ['a', 'e', 'i'].forEach((l) => botones(appNode).find((b) => (b.textContent || '').trim() === l).click());
  buscarPorTexto(appNode, '👉').click();
  await flush();

  const opciones = () => botones(appNode).filter((b) => ['a', 'e', 'i'].includes((b.textContent || '').trim()));
  const incorrecta = opciones().find((b) => (b.textContent || '').trim() !== objetivo);
  incorrecta.click();
  incorrecta.click();
  await flush();

  const marcada = opciones().find((b) => b.classList.contains('pista'));
  assert.ok(marcada, 'debe resaltarse la opción correcta como pista');
  assert.equal((marcada.textContent || '').trim(), objetivo);
  const i = pedidos.indexOf('audio/instr/pista.mp3');
  assert.ok(i !== -1, 'la pista debe sonar');
  assert.ok(pedidos.slice(i).includes(`audio/letras/${objetivo}.mp3`), 'tras la pista debe repetirse el modelo');
});

test('arma-palabra coloca la sílaba correcta y no selecciona la incorrecta', async () => {
  const sesionMod = require('../js/dominio/sesion.js');
  const contenido = require('../js/datos/contenido.js');
  const ref = sesionMod.crear(contenido.niveles.find((n) => n.id === 'pal1'), contenido, () => 0.5);
  const buena = ref.ejercicios[0].objetivo[0];
  const mala = ref.ejercicios[0].opciones.find((o) => o !== buena);

  const estado = { version: 1, perfil: { nombre: null, sexo: null }, perfilListo: true, niveles: { v1: { estrellas: 3 }, v2: { estrellas: 3 }, v3: { estrellas: 3 }, m: { estrellas: 3 }, p: { estrellas: 3 }, s: { estrellas: 3 } }, todoDesbloqueado: false, volumen: 0.9 };
  const { appNode, pedidos } = cargarJuego(estado);
  const flush = () => new Promise((r) => setImmediate(() => setImmediate(() => setImmediate(r))));
  buscarPorTexto(appNode, 'Jugar').click();
  await flush();
  buscarPorTexto(appNode, 'Vamos').click();
  botones(appNode).find((b) => (b.textContent || '').includes('🗺️')).click();

  const llenos = () => { const acc = []; const w = (n) => { if (n.classList && n.classList.contains('lleno')) acc.push(n); (n.children || []).forEach(w); }; w(appNode); return acc; };
  const ficha = (t) => botones(appNode).find((b) => (b.textContent || '').trim() === t);

  const casiAntes = pedidos.filter((p) => p.includes('casi')).length;
  ficha(mala).click();
  await flush();
  assert.equal(llenos().length, 0, 'la sílaba incorrecta no debe colocarse');
  assert.ok(pedidos.filter((p) => p.includes('casi')).length > casiAntes, 'debe sonar el error');

  ficha(buena).click();
  await flush();
  assert.equal(llenos().length, 1, 'la sílaba correcta debe colocarse');
  assert.equal((llenos()[0].textContent || '').trim(), buena);
});

test('un nivel de vocales se puede recorrer entero hasta la celebración', () => {
  const sesionMod = require('../js/dominio/sesion.js');
  const contenido = require('../js/datos/contenido.js');
  const nivel = contenido.niveles.find((n) => n.id === 'v1');
  const s = sesionMod.crear(nivel, contenido, () => 0.5);
  let r = s.completar(); // carretilla
  let guard = 0;
  while (!r.fin && guard++ < 50) {
    const e = s.actual();
    r = e.puntua ? s.responder(Array.isArray(e.objetivo) ? e.objetivo[s.paso()] : e.objetivo) : s.completar();
  }
  assert.ok(r.fin);
  assert.ok(s.resultado().estrellas >= 1 && s.resultado().estrellas <= 3);
});
