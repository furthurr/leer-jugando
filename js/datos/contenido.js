/*
 * Contenido pedagógico (método silábico, español latinoamericano).
 * Solo datos. Cada nivel usa únicamente letras presentadas hasta ese nivel
 * (lo comprueba tests/contenido.test.js).
 * La lectura inicial usa palabras sin tildes, conservando su escritura correcta.
 */
(function (raiz) {
  'use strict';

  const VOCALES = ['a', 'e', 'i', 'o', 'u'];
  const nombresGrabados = { abdiel: 'Abdiel' };

  /** Nombre hablado de cada letra (audio/letras/<letra>.mp3). */
  const nombresLetras = {
    a: 'a', e: 'e', i: 'i', o: 'o', u: 'u',
    m: 'eme, de mamá', p: 'pe, de papá', s: 'ese, de sopa', l: 'ele, de luna',
    t: 'te, de tomate', n: 'ene, de nido', d: 'de, de dado', c: 'ce, de casa',
    b: 'be, de bebé', r: 'ere, de pera', f: 'efe, de foca', g: 'ge, de gato',
    j: 'jota, de jugo', v: 've, de vaca', 'ñ': 'eñe, de niño', ch: 'che, de leche',
    y: 'ye, de yoyo', z: 'zeta, de zapato', q: 'cu, de queso; con u forma que y qui',
    h: 'hache, de hilo; la hache no suena', x: 'equis, de taxi',
    k: 'ka, de kiwi', w: 'doble ve, de wifi',
  };

  /** Vocales con las que se arma la carretilla de cada consonante. */
  const vocalesDe = {
    c: ['a', 'o', 'u'], q: ['e', 'i'], g: ['a', 'o', 'u'], z: ['a', 'o', 'u'], y: ['a', 'e', 'o', 'u'],
  };

  const etapas = {
    1: 'Preparación · Vocales',
    2: 'Etapa 1 · M P S L T D N F B V',
    3: 'Etapa 2 · C Q G R',
    4: 'Etapa 3 · J Ñ H Y',
    5: 'Etapa 4 · Z X K W',
    6: 'Meta · Cuentos',
  };

  const gruposLetras = ['mpsltdnfbv', 'cqgr', 'jñhy', 'zxkw'].map((grupo) => [...grupo]);

  const palabras = {
    mapa: { silabas: ['ma', 'pa'], imagen: '🗺️' },
    sopa: { silabas: ['so', 'pa'], imagen: '🍲' },
    oso: { silabas: ['o', 'so'], imagen: '🐻' },
    sapo: { silabas: ['sa', 'po'], imagen: '🐸' },
    pato: { silabas: ['pa', 'to'], imagen: '🦆' },
    lupa: { silabas: ['lu', 'pa'], imagen: '🔍' },
    papa: { silabas: ['pa', 'pa'], imagen: '🥔' },
    lata: { silabas: ['la', 'ta'], imagen: '🥫' },
    pila: { silabas: ['pi', 'la'], imagen: '🔋' },
    mate: { silabas: ['ma', 'te'], imagen: '🧉' },
    pelota: { silabas: ['pe', 'lo', 'ta'], imagen: '⚽' },
    paloma: { silabas: ['pa', 'lo', 'ma'], imagen: '🕊️' },
    tomate: { silabas: ['to', 'ma', 'te'], imagen: '🍅' },
    moneda: { silabas: ['mo', 'ne', 'da'], imagen: '🪙' },
    maleta: { silabas: ['ma', 'le', 'ta'], imagen: '🧳' },
    pepino: { silabas: ['pe', 'pi', 'no'], imagen: '🥒' },
    pera: { silabas: ['pe', 'ra'], imagen: '🍐' },
    loro: { silabas: ['lo', 'ro'], imagen: '🦜' },
    toro: { silabas: ['to', 'ro'], imagen: '🐂' },
    foca: { silabas: ['fo', 'ca'], imagen: '🦭' },
    corona: { silabas: ['co', 'ro', 'na'], imagen: '👑' },
    camisa: { silabas: ['ca', 'mi', 'sa'], imagen: '👕' },
    vaca: { silabas: ['va', 'ca'], imagen: '🐄' },
    uva: { silabas: ['u', 'va'], imagen: '🍇' },
    'piña': { silabas: ['pi', 'ña'], imagen: '🍍' },
    'muñeca': { silabas: ['mu', 'ñe', 'ca'], imagen: '🪆' },
    leche: { silabas: ['le', 'che'], imagen: '🥛' },
    yoyo: { silabas: ['yo', 'yo'], imagen: '🪀' },
    zapato: { silabas: ['za', 'pa', 'to'], imagen: '👞' },
    dado: { silabas: ['da', 'do'], imagen: '🎲' },
    nido: { silabas: ['ni', 'do'], imagen: '🪺' },
    foto: { silabas: ['fo', 'to'], imagen: '📷' },
    fila: { silabas: ['fi', 'la'], imagen: '🚶🚶' },
    bota: { silabas: ['bo', 'ta'], imagen: '🥾' },
    vela: { silabas: ['ve', 'la'], imagen: '🕯️' },
    queso: { silabas: ['que', 'so'], imagen: '🧀' },
    gato: { silabas: ['ga', 'to'], imagen: '🐱' },
    jugo: { silabas: ['ju', 'go'], imagen: '🧃' },
    hilo: { silabas: ['hi', 'lo'], imagen: '🧵' },
    hoja: { silabas: ['ho', 'ja'], imagen: '🍃' },
    taxi: { silabas: ['ta', 'xi'], imagen: '🚕' },
    kiwi: { silabas: ['ki', 'wi'], imagen: '🥝' },
    wifi: { silabas: ['wi', 'fi'], imagen: '📶' },
  };

  const vocales = (id, titulo, introduce, items) =>
    ({ id, etapa: 1, tipo: 'vocales', titulo, introduce, items: items || introduce });
  const consonante = (letra) =>
    ({ id: letra, etapa: 2 + gruposLetras.findIndex((grupo) => grupo.includes(letra)), tipo: 'consonante', titulo: letra,
      introduce: letra === 'h' ? ['h', 'ch'] : [letra] });
  const grupo = (id, etapa, lista) =>
    ({ id, etapa, tipo: 'palabras', titulo: palabras[lista[0]].imagen, introduce: [], palabras: lista });
  const frases = (id, etapa, lista) =>
    ({ id, etapa, tipo: 'frases', titulo: '💬', introduce: [], frases: lista });

  const niveles = [
    vocales('v1', 'a e i', ['a', 'e', 'i']),
    vocales('v2', 'o u', ['o', 'u']),
    vocales('v3', 'a e i o u', [], VOCALES),
    consonante('m'), consonante('p'), consonante('s'),
    grupo('pal1', 2, ['mapa', 'sopa', 'oso', 'sapo']),
    consonante('l'), consonante('t'),
    grupo('pal2', 2, ['pato', 'lupa', 'papa', 'lata', 'pila', 'mate']),
    frases('fr1', 2, [
      { texto: 'el sapo salta', imagen: '🐸' },
      { texto: 'el oso toma sopa', imagen: '🐻🍲' },
    ]),
    consonante('d'),
    grupo('rep-d', 2, ['dado', 'pelota', 'tomate']),
    consonante('n'),
    grupo('pal3', 2, ['nido', 'paloma', 'moneda', 'maleta', 'pepino']),
    consonante('f'),
    grupo('rep-f', 2, ['foto', 'fila', 'sopa']),
    consonante('b'), consonante('v'),
    grupo('rep-bv', 2, ['bota', 'uva', 'vela']),
    frases('rep-base', 2, [
      { texto: 'la luna sale', imagen: '🌙' },
      { texto: 'mi bota es bonita', imagen: '🥾' },
      { texto: 'la paloma ve una uva', imagen: '🕊️🍇' },
    ]),
    consonante('c'),
    grupo('rep-c', 3, ['vaca', 'foca', 'camisa']),
    consonante('q'),
    grupo('rep-q', 3, ['queso', 'vaca', 'uva']),
    consonante('g'), consonante('r'),
    grupo('pal4', 3, ['pera', 'loro', 'toro', 'gato', 'corona', 'camisa']),
    frases('fr2', 3, [
      { texto: 'mi casa es bonita', imagen: '🏠' },
      { texto: 'la luna sale', imagen: '🌙' },
      { texto: 'mi mono come banana', imagen: '🐒🍌' },
    ]),
    consonante('j'), consonante('ñ'), consonante('h'),
    grupo('rep-jnh', 4, ['jugo', 'piña', 'muñeca', 'hilo', 'hoja', 'leche']),
    consonante('y'),
    grupo('pal5', 4, ['vaca', 'uva', 'piña', 'muñeca', 'leche', 'yoyo']),
    frases('fr3', 4, [
      { texto: 'el loro come pera', imagen: '🦜🍐' },
      { texto: 'la foca nada', imagen: '🦭' },
      { texto: 'el gato duerme', imagen: '🐱💤' },
      { texto: 'la jirafa es alta', imagen: '🦒' },
    ]),
    frases('fr4', 4, [
      { texto: 'la vaca da leche', imagen: '🐄🥛' },
      { texto: 'el niño come piña', imagen: '👦🍍' },
      { texto: 'la niña tiene un yoyo', imagen: '👧🪀' },
      { texto: 'Ana y su muñeca', imagen: '👧🪆' },
    ]),
    consonante('z'),
    grupo('rep-z', 5, ['zapato', 'yoyo', 'hoja']),
    consonante('x'),
    grupo('rep-x', 5, ['taxi', 'zapato', 'gato']),
    consonante('k'), consonante('w'),
    grupo('rep-kw', 5, ['kiwi', 'wifi', 'taxi']),
    frases('rep-final', 5, [
      { texto: 'mi zapato es azul', imagen: '👞' },
      { texto: 'el taxi es rojo', imagen: '🚕' },
      { texto: 'Ana come kiwi', imagen: '👧🥝' },
    ]),
    {
      id: 'c1', etapa: 6, tipo: 'cuento', titulo: '🐸', nombre: 'El sapo Pepe', introduce: [],
      paginas: [
        { texto: 'Pepe es un sapo.', imagen: '🐸' },
        { texto: 'Pepe salta y salta.', imagen: '🐸💨' },
        { texto: 'Pepe ve un pez en el lago.', imagen: '🐸🐟' },
        { texto: 'El pez y Pepe nadan.', imagen: '🐟🐸🌊' },
      ],
      pregunta: { voz: '¿Qué vio Pepe en el lago?', opciones: ['🐟', '🐄', '🦆'], correcta: '🐟' },
    },
    {
      id: 'c2', etapa: 6, tipo: 'cuento', titulo: '🐄', nombre: 'La vaca Lola', introduce: [],
      paginas: [
        { texto: 'Lola es una vaca.', imagen: '🐄' },
        { texto: 'Lola come pasto.', imagen: '🐄🌱' },
        { texto: 'Lola da leche.', imagen: '🐄🥛' },
        { texto: '¡Muy bien, Lola!', imagen: '🐄⭐' },
      ],
      pregunta: { voz: '¿Qué nos da la vaca Lola?', opciones: ['🥛', '🍎', '🍞'], correcta: '🥛' },
    },
    {
      id: 'c3', etapa: 6, tipo: 'cuento', titulo: '🐱', nombre: 'El gato Toto', introduce: [],
      paginas: [
        { texto: 'Toto es un gato.', imagen: '🐱' },
        { texto: 'Toto tiene sueño.', imagen: '🐱🥱' },
        { texto: 'Toto se sube a la cama.', imagen: '🐱🛏️' },
        { texto: 'Toto duerme en la cama.', imagen: '😴🛏️' },
        { texto: '¡Buenas noches, Toto!', imagen: '🌙⭐' },
      ],
      pregunta: { voz: '¿Dónde duerme Toto?', opciones: ['🛏️', '🌳', '🚗'], correcta: '🛏️' },
    },
    {
      id: 'c4', etapa: 6, tipo: 'cuento', titulo: '🎉', nombre: 'La fiesta de Ana', introduce: [],
      paginas: [
        { texto: 'Ana tiene una fiesta.', imagen: '👧🎉' },
        { texto: 'Beto le da una caja.', imagen: '👦🎁' },
        { texto: '¡Es un oso de peluche!', imagen: '🧸' },
        { texto: 'Ana y su oso bailan.', imagen: '👧🧸💃' },
      ],
      pregunta: { voz: '¿Qué le regaló Beto a Ana?', opciones: ['🧸', '🐶', '⚽'], correcta: '🧸' },
    },
  ];

  /** Frases habladas por el juego (audio/instr/<clave>[-m|-f|-n].mp3). */
  const instrucciones = {
    'hola': '¡Hola!',
    'bienvenida': { m: '¡Bienvenido! Vamos a leer jugando.', f: '¡Bienvenida! Vamos a leer jugando.', n: '¡Te damos la bienvenida! Vamos a leer jugando.' },
    'perfil': 'Pide a un adulto que escriba tu nombre. Después, toca si eres niño o niña.',
    'mapa': 'Elige un nivel para jugar.',
    'bloqueado': 'Este nivel todavía está cerrado. Primero termina el anterior.',
    'carretilla': 'Toca cada una y escucha cómo suena.',
    'escucha-elige': 'Escucha y toca la que oyes.',
    'une-letras': 'Arrastra la letra hasta la vocal correcta para formar la sílaba que oyes.',
    'arma-palabra': 'Mira el dibujo. Toca las sílabas en orden para formar la palabra.',
    'lee-elige-palabra': 'Lee la palabra y toca el dibujo correcto.',
    'lee-elige-frase': 'Lee la frase y toca el dibujo correcto.',
    'cuento': 'Escucha el cuento. Toca una palabra para oírla otra vez. Toca la flecha para seguir.',
    'casi': '¡Casi! Inténtalo otra vez.',
    'pista': 'Mira, es esta. Escucha.',
    'correcto-1': '¡Muy bien!',
    'correcto-2': '¡Excelente!',
    'correcto-3': '¡Lo lograste!',
    'correcto-4': '¡Así se hace!',
    'correcto-5': '¡Estupendo!',
    'correcto-6': '¡Buen trabajo!',
    'correcto-7': { m: '¡Qué listo!', f: '¡Qué lista!', n: '¡Qué atento!' },
    'correcto-8': { m: '¡Eres un campeón!', f: '¡Eres una campeona!', n: '¡Eres una estrella!' },
    'correcto-9': { m: '¡Eres un genio!', f: '¡Eres una genia!', n: '¡Qué inteligente!' },
    'correcto-10': { m: '¡Bravo, campeón!', f: '¡Brava, campeona!', n: '¡Bravo!' },
    'correcto-11': '¡Qué bien!',
    'correcto-12': '¡Fantástico!',
    'correcto-13': { m: '¡Qué campeón!', f: '¡Qué campeona!', n: '¡Qué grande!' },
    'correcto-14': { m: '¡Eres un valiente!', f: '¡Eres una valiente!', n: '¡Qué valiente!' },
    'correcto-15': '¡Lo hiciste muy bien!',
    'nivel-completo': { m: '¡Terminaste el nivel! Eres un gran lector.', f: '¡Terminaste el nivel! Eres una gran lectora.', n: '¡Terminaste el nivel! ¡Qué bien lees!' },
    'adultos': 'Esta es la zona de adultos.',
  };

  const FELICITACIONES = Array.from({ length: 15 }, (_, i) => 'correcto-' + (i + 1));

  const api = { VOCALES, nombresGrabados, nombresLetras, vocalesDe, etapas, gruposLetras, palabras, niveles, instrucciones, FELICITACIONES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { raiz.LEER = raiz.LEER || {}; raiz.LEER.contenido = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
