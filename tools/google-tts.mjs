import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { crearSsml, validarVoz } = require('./plan-generacion-google.js');
const SCOPE_CLOUD_PLATFORM = 'https://www.googleapis.com/auth/cloud-platform';

/** Verifica ADC/proyecto sin devolver ni registrar el access token. */
export async function validarAdcGoogle({ auth = null, projectId = process.env.GOOGLE_CLOUD_PROJECT } = {}) {
  try {
    let googleAuth = auth;
    if (!googleAuth) {
      const { GoogleAuth } = require('google-auth-library');
      googleAuth = new GoogleAuth({ scopes: [SCOPE_CLOUD_PLATFORM] });
    }

    const authClient = await googleAuth.getClient();
    const tokenInfo = await authClient.getAccessToken();
    const token = typeof tokenInfo === 'string' ? tokenInfo : tokenInfo?.token;
    if (!token) throw new Error('ADC no devolvió un access token.');

    const idProyecto = projectId || await googleAuth.getProjectId();
    if (!idProyecto) throw new Error('No se encontró el proyecto de Google Cloud.');
    return { projectId: idProyecto };
  } catch {
    throw new Error('No se pudo validar ADC Google; revisa el acceso local, proyecto, cuotas y API habilitada.');
  }
}

function crearSdkClient(projectId) {
  let TextToSpeechClient;
  try {
    ({ TextToSpeechClient } = require('@google-cloud/text-to-speech'));
  } catch (error) {
    throw new Error('Falta @google-cloud/text-to-speech; instala las dependencias de herramientas.', { cause: error });
  }
  return new TextToSpeechClient(projectId ? { projectId, quotaProjectId: projectId } : undefined);
}

function normalizarErrorGoogle(error) {
  const code = Number(error?.code);
  const detalle = Number.isInteger(code) && code !== 0 ? ` (código ${code})` : '';
  return new Error(`Google Cloud TTS falló${detalle}.`);
}

/** Adaptador SDK de Google Cloud TTS; el cliente es inyectable para tests sin red/ADC. */
export function crearClienteGoogle({ sdkClient = null, projectId } = {}) {
  const cliente = sdkClient || crearSdkClient(projectId);

  return {
    async sintetizar({ locale, voiceId, texto, rate, fonema }) {
      if (locale !== 'es-US') throw new Error('Google TTS requiere el locale es-US.');
      validarVoz(voiceId);
      if (typeof texto !== 'string' || !texto.trim()) throw new Error('El texto TTS no puede estar vacío.');

      const request = {
        input: { ssml: crearSsml(texto, rate, fonema) },
        voice: { languageCode: locale, name: voiceId },
        audioConfig: { audioEncoding: 'LINEAR16' },
      };

      let response;
      try {
        [response] = await cliente.synthesizeSpeech(request);
      } catch (error) {
        throw normalizarErrorGoogle(error);
      }

      const content = response?.audioContent;
      if (!(Buffer.isBuffer(content) || content instanceof Uint8Array) || content.length < 12) {
        throw new Error('Google TTS no devolvió audio WAV válido.');
      }
      const wav = Buffer.from(content);
      if (wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') {
        throw new Error('Google TTS devolvió datos que no son un WAV LINEAR16.');
      }
      return wav;
    },
  };
}
