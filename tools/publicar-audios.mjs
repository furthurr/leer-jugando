import { cpSync, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

function validarRutas(audioDir, stagingDir, backupDir) {
  const audio = resolve(audioDir);
  const rutas = [audio, resolve(stagingDir), ...(backupDir ? [resolve(backupDir)] : [])];
  for (let i = 0; i < rutas.length; i++) {
    for (let j = i + 1; j < rutas.length; j++) {
      const rel = relative(rutas[i], rutas[j]);
      const invertido = relative(rutas[j], rutas[i]);
      if (rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel)) ||
          (!invertido.startsWith(`..${sep}`) && invertido !== '..' && !isAbsolute(invertido))) {
        throw new Error('Las rutas de audio, staging y respaldo no pueden coincidir ni anidarse.');
      }
    }
  }
  return { audio, staging: rutas[1], backup: rutas[2] };
}

/** Clona el árbol actual a una ruta aislada sin modificar la fuente. */
export function prepararStagingAudio({ audioDir, stagingDir }) {
  const { audio, staging } = validarRutas(audioDir, stagingDir);
  if (!existsSync(audio) || !statSync(audio).isDirectory()) {
    throw new Error('No existe el directorio de audio que se quiere preservar.');
  }

  if (existsSync(staging)) throw new Error('El staging ya existe; no se sobrescribirá.');
  mkdirSync(dirname(staging), { recursive: true });
  try {
    cpSync(audio, staging, { recursive: true, errorOnExist: true, force: false });
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw new Error('No se pudo preparar el staging de audio.', { cause: error });
  }
}

/** Sustituye el árbol de forma recuperable y conserva el original en respaldo. */
export function publicarStagingAudio({ audioDir, stagingDir, backupDir, renameImpl = renameSync }) {
  const rutas = validarRutas(audioDir, stagingDir, backupDir);
  if (!existsSync(rutas.audio) || !statSync(rutas.audio).isDirectory()) {
    throw new Error('No existe el directorio de audio vigente.');
  }
  if (!existsSync(rutas.staging) || !statSync(rutas.staging).isDirectory()) {
    throw new Error('No existe el staging completo para publicar.');
  }
  if (existsSync(rutas.backup)) throw new Error('El directorio de respaldo ya existe; no se reemplazará.');

  mkdirSync(dirname(rutas.backup), { recursive: true });
  renameImpl(rutas.audio, rutas.backup);
  try {
    renameImpl(rutas.staging, rutas.audio);
  } catch (error) {
    try {
      renameImpl(rutas.backup, rutas.audio);
    } catch (errorRestauracion) {
      throw new AggregateError(
        [error, errorRestauracion],
        'No se pudo publicar ni restaurar el árbol de audio; el respaldo permanece disponible.',
      );
    }
    throw new Error(`No se pudo publicar el staging; se restauró el árbol anterior: ${error.message}`, { cause: error });
  }
  return rutas.backup;
}
