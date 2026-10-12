# Requisitos — Generación de audio con Google Cloud TTS es-US

Modo SDD: standard  
Tipo de trabajo: feature (cambio de proveedor de generación de audio)  
Intención: implementación solicitada, sujeta a los gates SDD  
Estrategia de pruebas: TDD focalizado para el generador; revisión auditiva manual para locale/voz  
Fase: Requirements  
Estado: aprobado  
Gate 1: aprobado

## Historia de usuario

Como adulto que prepara el juego, quiero generar los audios hablados con Google
Cloud TTS usando una voz española de la variante `es-US`, para que el niño oiga
una voz inteligible y consistente, y el juego siga funcionando sin conexión.

## Criterios de aceptación (EARS)

- **Req 1.1:** CUANDO el adulto ejecuta la generación aprobada EL SISTEMA DEBERÁ
  sintetizar los audios hablados con Google Cloud Text-to-Speech usando un
  identificador de voz documentado para el locale `es-US`, conservando los textos
  fuente y una identidad de voz fija para el lote.
- **Req 1.2:** ANTES de la generación masiva EL SISTEMA DEBERÁ producir en una
  ubicación temporal separada una muestra representativa de letra, sílaba,
  palabra e instrucción o frase, sin modificar los MP3 actuales.
- **Req 1.3:** CUANDO el usuario evalúa la muestra EL SISTEMA DEBERÁ permitirle
  comprobar pronunciación, inteligibilidad, fidelidad al texto y aceptación del
  acento como español latinoamericano para el público objetivo.
- **Req 1.4:** SI la muestra no es aceptable para español latinoamericano o el
  usuario la rechaza ENTONCES EL SISTEMA DEBERÁ detener la generación masiva y
  conservar sin cambios los audios actuales.
- **Req 1.5:** CUANDO el usuario aprueba una muestra EL SISTEMA DEBERÁ poder
  generar todos los audios hablados esperados manteniendo las rutas que consume
  el reproductor.
- **Req 1.6:** CUANDO se genera el nuevo lote EL SISTEMA DEBERÁ preservar los
  efectos sintetizados y publicar las voces solo después de validar el lote
  completo, conservando una copia recuperable de los audios anteriores.
- **Req 1.7:** SI falta autenticación, falla Google Cloud TTS, se excede la cuota
  o falla una conversión ENTONCES EL SISTEMA DEBERÁ detenerse sin dejar un lote
  parcial como conjunto activo y sin registrar credenciales.
- **Req 1.8:** ANTES de cada ejecución que use el servicio EL SISTEMA DEBERÁ
  requerir que el adulto confirme que revisó la cuota disponible y cualquier
  posible costo de Google Cloud TTS.
- **Req 1.9:** EL SISTEMA DEBERÁ usar las credenciales de Google solo durante la
  generación local; no deberá incluirlas en código, audios, HTML, JavaScript ni
  en el control de versiones.
- **Req 1.10:** MIENTRAS se usa el juego EL SISTEMA DEBERÁ reproducir únicamente
  archivos locales y funcionar sin internet ni credenciales de Google.
- **Req 1.11:** CUANDO termina una generación aprobada EL SISTEMA DEBERÁ permitir
  verificar que estén presentes todos los audios esperados, que los efectos no
  hayan cambiado y que el paquete permanezca por debajo del límite de 20 MB.

## Supuestos

- El locale candidato elegido por el usuario es `es-US` (español de Estados
  Unidos); no se asumirá que es idéntico a es-MX ni que el acento satisface por
  sí solo el requisito de español latinoamericano. La revisión humana es
  obligatoria y decide si se continúa.
- Los audios se generan en tiempo de preparación y se distribuyen como archivos
  junto al juego; no se harán llamadas a Google durante el juego.
- Se mantiene el contenido educativo, las rutas de audio y el uso de una sola
  identidad de voz en todos los audios hablados. Los efectos quedan fuera de la
  síntesis TTS.
- Las credenciales de Google Cloud son distintas de la antigua clave MiMo y se
  configurarán localmente solo después de aprobar Requirements, Design y Tasks.
- El usuario autoriza evaluar `es-US`, pero no se considera aprobada ninguna voz
  ni el lote completo hasta que escuche la muestra.

## Fuera de alcance

- Cualquier llamada TTS desde el navegador o durante el juego.
- Generar o reemplazar el lote completo antes de la revisión del piloto.
- Mantener MiMo como proveedor alternativo o usar su clave para Google Cloud.
- Cambiar contenido pedagógico, rutas del reproductor o efectos de sonido.

## Riesgos y contexto

- Google documenta voces `es-US`; el locale es “Spanish (United States)”, no una
  afirmación de neutralidad latinoamericana. La calidad para el público objetivo
  solo se puede establecer escuchando las muestras.
- El inventario actual contiene 279 pistas habladas y 5 efectos. La integración
  debe usar autenticación Google Cloud no presente en la credencial MiMo.
- No existe `.data/README.md` con convenciones de integración de APIs; se
  recomienda revisión de `@data-api` durante Design. No se creará documentación
  de dominio en `.data/` dentro de este alcance.

## Fuentes consultadas

- [Google Cloud TTS — voces y locales](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types)
- [Google Cloud TTS — precios y cuotas](https://cloud.google.com/text-to-speech/pricing)
- [Xiaomi MiMo-V2.5-TTS — contraste del enfoque sustituido](https://mimo.xiaomi.com/mimo-v2-5-tts)
