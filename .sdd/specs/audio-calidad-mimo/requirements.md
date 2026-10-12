# Requisitos — Mejora de calidad de audio con MiMo TTS

Modo SDD: standard  
Tipo de trabajo: feature (mejora de calidad del generador de audio)  
Intención: implementación solicitada, sujeta a los gates SDD  
Estrategia de pruebas: TDD focalizado para la herramienta y validación auditiva manual del piloto  
Fase: Requirements  
Estado: sustituida por `.sdd/specs/audio-calidad-google-esus/requirements.md`  
Gate 1: aprobado

## Contexto

El generador actual usa Piper con `es_MX-claude-high` y convierte la voz a MP3
mono de 64 kbps. El juego incluye los MP3 para funcionar sin conexión y se abre
desde `file://`. El usuario solicita sustituir la voz pregrabada por MiMo TTS
porque todos los audios se oyen mal.

La documentación pública de Xiaomi consultada presenta MiMo-V2.5-TTS y sus
controles de estilo, pero el material oficial encontrado solo enumera voces
predefinidas en chino e inglés y no confirma soporte de español latinoamericano.
Por ello, la calidad y pronunciación en español son una condición previa a
regenerar el lote completo; no se asumirá que una demostración en otro idioma
garantiza un resultado adecuado.

## Historia de usuario

Como adulto que prepara el juego, quiero generar con MiMo una voz clara, natural
y consistente en español latinoamericano, para que el niño pueda entender y
seguir las instrucciones y los ejemplos de lectura.

## Criterios de aceptación (EARS)

- **Req 1.1:** CUANDO el adulto ejecuta la generación de audios hablados EL
  SISTEMA DEBERÁ sintetizar los textos pregrabados del juego mediante MiMo TTS,
  conservando el texto fuente y una única identidad de voz para el conjunto.
- **Req 1.2:** CUANDO se evalúa una muestra en español EL SISTEMA DEBERÁ producir
  pronunciación inteligible y apropiada para español latinoamericano, sin omitir
  ni sustituir palabras, letras, sílabas o signos con valor de entonación.
- **Req 1.3:** ANTES de regenerar el lote completo EL SISTEMA DEBERÁ generar en
  una ubicación de prueba separada muestras representativas de una letra, una
  sílaba, una palabra y una instrucción o frase, sin reemplazar audios existentes.
- **Req 1.4:** SI las muestras no satisfacen Req 1.2 o el soporte de español no
  puede confirmarse ENTONCES EL SISTEMA DEBERÁ detener la regeneración completa,
  informar la limitación y conservar intactos los audios actuales.
- **Req 1.5:** CUANDO el adulto aprueba las muestras EL SISTEMA DEBERÁ poder
  regenerar todos los audios de voz esperados por el contenido del juego y
  conservar las rutas que consume el reproductor.
- **Req 1.6:** CUANDO se regenera la voz EL SISTEMA DEBERÁ dejar sin cambios los
  efectos de sonido sintetizados que no son voz.
- **Req 1.7:** SI falla una petición, falta la credencial o se alcanza un límite
  del servicio ENTONCES EL SISTEMA DEBERÁ informar el error sin dejar el conjunto
  de audios en un estado parcial que sustituya al conjunto vigente.
- **Req 1.8:** EL SISTEMA DEBERÁ mantener la reproducción desde archivos locales
  sin conexión a internet y no deberá realizar llamadas a MiMo durante el uso
  del juego.
- **Req 1.9:** EL SISTEMA DEBERÁ leer las credenciales del proveedor desde la
  configuración local de generación y no deberá incluirlas en el HTML, JavaScript,
  audios distribuidos ni el control de versiones.
- **Req 1.10:** CUANDO termina una generación aprobada EL SISTEMA DEBERÁ permitir
  verificar que no falte ningún audio esperado y que el paquete del juego
  permanezca por debajo del límite de tamaño establecido de 20 MB.

## Supuestos

- Se reemplazan solo voces pregrabadas; los nombres personalizados siguen
  usando la voz del dispositivo porque no se conocen al generar los archivos.
- La exigencia existente de español latinoamericano y funcionamiento offline
  sigue vigente; la solicitud de usar MiMo no autoriza degradar esos requisitos.
- La síntesis de MiMo se ejecutaría durante la preparación de archivos, no desde
  el navegador del niño. El lote final quedaría incluido localmente en el juego.
- La prueba auditiva de la muestra requiere revisión humana antes de dar paso a
  la generación masiva.
- No se clona la voz de una persona y no se cambia el texto educativo ni la
  funcionalidad de los efectos.

## Fuera de alcance

- Llamar a MiMo en tiempo de ejecución o requerir internet para jugar.
- Cambiar la voz dinámica del nombre del niño.
- Regenerar efectos de sonido, cambiar contenido pedagógico o rediseñar el
  reproductor del juego.

## Dependencias y riesgo detectado

- No hay un `.data/README.md` con las convenciones de integración de servicios;
  se recomienda revisión del especialista `@data-api` antes de cerrar el diseño.
- La integración oficial consultada usa una credencial local `MIMO_API_KEY` y una
  API remota; se debe confirmar disponibilidad y condiciones de uso/costo antes
  de enviar el lote completo.
- Riesgo principal: las fuentes públicas de Xiaomi consultadas no confirman
  español latinoamericano para MiMo-V2.5-TTS ni para las voces predefinidas.

## Fuentes consultadas

- [Xiaomi MiMo-V2.5-TTS Series](https://mimo.xiaomi.com/mimo-v2-5-tts) — modelos,
  control de estilo y acceso a la documentación de API.
- [Skill oficial XiaomiMiMo para MiMo-V2.5-TTS](https://github.com/XiaomiMiMo/MiMo-Skills/blob/main/skills/mimo-v2-5-tts/SKILL.md)
  — idiomas/voces enumerados, selección de modelo y uso de la API.
- [Guía de síntesis de voz MiMo-V2.5](https://platform.xiaomimimo.com/docs/usage-guide/speech-synthesis-v2.5)
  — documentación de API enlazada desde la página oficial.
