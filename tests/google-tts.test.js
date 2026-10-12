'use strict';
const { before, test } = require('node:test');
const assert = require('node:assert/strict');
const { VOCES_GOOGLE } = require('../tools/plan-generacion-google.js');

let crearClienteGoogle;
let validarAdcGoogle;
before(async () => {
  ({ crearClienteGoogle, validarAdcGoogle } = await import('../tools/google-tts.mjs'));
});

const wav = Buffer.from('RIFF0000WAVEdata');
const entrada = {
  locale: 'es-US',
  voiceId: 'es-US-Neural2-A',
  texto: 'eme, de mamá.',
  rate: '65%',
};

test('genera SSML es-US con voz permitida y recibe bytes WAV LINEAR16', async () => {
  let solicitud;
  const cliente = crearClienteGoogle({
    sdkClient: {
      synthesizeSpeech: async (request) => {
        solicitud = request;
        return [{ audioContent: wav }];
      },
    },
  });

  assert.deepEqual(await cliente.sintetizar(entrada), wav);
  assert.deepEqual(solicitud, {
    input: { ssml: '<speak><prosody rate="65%">eme, de mamá.</prosody></speak>' },
    voice: { languageCode: 'es-US', name: 'es-US-Neural2-A' },
    audioConfig: { audioEncoding: 'LINEAR16' },
  });
});

test('acepta respuestas Uint8Array válidas de Google TTS', async () => {
  const cliente = crearClienteGoogle({
    sdkClient: { synthesizeSpeech: async () => [{ audioContent: new Uint8Array(wav) }] },
  });
  const resultado = await cliente.sintetizar(entrada);
  assert.ok(Buffer.isBuffer(resultado));
  assert.deepEqual(resultado, wav);
});

test('rechaza voz, locale y respuesta de audio no permitidos o inválidos', async () => {
  let llamadas = 0;
  const cliente = crearClienteGoogle({
    sdkClient: { synthesizeSpeech: async () => { llamadas++; return [{ audioContent: Buffer.alloc(0) }]; } },
  });
  await assert.rejects(cliente.sintetizar({ ...entrada, voiceId: 'es-MX-DaliaNeural' }), /voz Google no válida/i);
  await assert.rejects(cliente.sintetizar({ ...entrada, locale: 'es-MX' }), /locale.*es-US/i);
  await assert.rejects(cliente.sintetizar(entrada), /audio WAV/);
  assert.equal(llamadas, 1);
});

test('rechaza rate SSML inválido antes de llamar al SDK', async () => {
  let llamadas = 0;
  const cliente = crearClienteGoogle({
    sdkClient: { synthesizeSpeech: async () => { llamadas++; return [{ audioContent: wav }]; } },
  });
  await assert.rejects(cliente.sintetizar({ ...entrada, rate: '500%' }), /Velocidad SSML no válida/);
  assert.equal(llamadas, 0);
});

test('rechaza bytes de audio que no son RIFF/WAVE', async () => {
  const cliente = crearClienteGoogle({
    sdkClient: { synthesizeSpeech: async () => [{ audioContent: Buffer.from('not a wave response') }] },
  });
  await assert.rejects(cliente.sintetizar(entrada), /no son un WAV LINEAR16/);
});

test('incluye el fonema IPA en el SSML cuando se indica (sílabas sueltas)', async () => {
  let solicitud;
  const cliente = crearClienteGoogle({
    sdkClient: { synthesizeSpeech: async (request) => { solicitud = request; return [{ audioContent: wav }]; } },
  });
  await cliente.sintetizar({ ...entrada, texto: 'to.', rate: '65%', fonema: 'to' });
  assert.match(solicitud.input.ssml, /<phoneme alphabet="ipa" ph="to">to\.<\/phoneme>/);
});

test('normaliza errores del SDK sin exponer mensajes potencialmente sensibles', async () => {
  const cliente = crearClienteGoogle({
    sdkClient: {
      synthesizeSpeech: async () => {
        const error = new Error('detalle privado TOKEN_FICTICIO');
        error.code = 8;
        throw error;
      },
    },
  });
  await assert.rejects(cliente.sintetizar(entrada), (error) => {
    assert.match(error.message, /Google Cloud TTS.*8/);
    assert.doesNotMatch(error.message, /TOKEN_FICTICIO|detalle privado/);
    return true;
  });
});

test('la allowlist solo incluye los candidatos es-US Neural2', () => {
  assert.deepEqual(VOCES_GOOGLE, ['es-US-Neural2-A', 'es-US-Neural2-B', 'es-US-Neural2-C']);
});

test('valida ADC sin devolver ni imprimir el access token', async () => {
  let tokenSolicitado = false;
  const auth = {
    getClient: async () => ({
      getAccessToken: async () => { tokenSolicitado = true; return { token: 'TOKEN_DE_PRUEBA' }; },
    }),
    getProjectId: async () => 'proyecto-de-prueba',
  };

  const resultado = await validarAdcGoogle({ auth });
  assert.deepEqual(resultado, { projectId: 'proyecto-de-prueba' });
  assert.equal(tokenSolicitado, true);
  assert.equal(JSON.stringify(resultado).includes('TOKEN_DE_PRUEBA'), false);
});

test('rechaza ADC inválido con un error sanitizado', async () => {
  const auth = {
    getClient: async () => ({ getAccessToken: async () => { throw new Error('TOKEN_PRIVADO'); } }),
    getProjectId: async () => 'proyecto-de-prueba',
  };
  await assert.rejects(validarAdcGoogle({ auth }), (error) => {
    assert.match(error.message, /ADC Google/i);
    assert.doesNotMatch(error.message, /TOKEN_PRIVADO/);
    return true;
  });
});
