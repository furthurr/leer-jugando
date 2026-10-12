# Leer jugando

Juego para que un niño de 6 años aprenda a leer en español latinoamericano, con
método silábico: vocales → carretillas (unir letras) → palabras → frases → cuentos.
Todas las instrucciones son habladas, así que el niño puede jugar sin saber leer aún.

## Jugar por internet

Abre **https://furthurr.github.io/leer-jugando/** en Chrome, Safari o Edge desde
una computadora, tablet o celular y toca **▶ Jugar** para habilitar el sonido.
No hace falta instalar nada ni crear una cuenta.

También funciona **sin conexión** con una copia descargada del proyecto: se abre
con doble clic en `index.html`, sin instalar nada y sin servidor. La versión web
necesita conexión para cargar la página y sus audios.

## Cómo jugar

1. Abre `index.html` en Chrome, Safari o Edge (doble clic basta).
2. Toca **▶ Jugar** (ese primer toque habilita el sonido en el navegador).
3. La primera vez, un adulto escribe el nombre y se elige niño o niña. Se puede saltar.
4. El niño avanza por el mapa de niveles ganando estrellas.

El progreso y el perfil se guardan solo en ese navegador y dispositivo; no se
envían a un servidor ni se sincronizan entre dispositivos.

Si el perfil se llama **Abdiel** (también reconoce ABDIEL o abdiel), el saludo y
la celebración reproducen `audio/palabras/abdiel.mp3`, generado con la API de
Google Cloud Text-to-Speech, voz `es-US-Neural2-A`. Su pronunciación se fijó como
`abˈdjel`. La reproducción usa el archivo local y funciona sin conexión.

### Para el adulto

En el mapa, **mantén pulsado el engranaje ⚙️ durante 3 segundos** para abrir la zona
de adultos: ajustar el volumen, cambiar o borrar el perfil, desbloquear todos los
niveles o reiniciar el progreso.

### Camino de aprendizaje

La preparación repasa las cinco vocales. Después, las letras se presentan en
cuatro etapas, respetando el orden de estudio:

1. **M → P → S → L → T → D → N → F → B → V**.
2. **C → Q → G → R**.
3. **J → Ñ → H → Y**.
4. **Z → X → K → W**.

Cada letra comienza con su presentación hablada, sigue con sus sílabas y juegos
de unir y reconocer. Entre letras hay repasos de palabras y frases que usan
solo letras ya presentadas. Q se practica como **que/qui**; H se presenta como
muda y permite practicar **ch** una vez conocidas C y H. Los cuentos cierran
el recorrido. Completar todos los pasos anteriores abre el siguiente; los
progresos guardados conservan sus estrellas.

## Estructura

```
index.html            Punto de entrada
css/estilos.css        Estilos (botones grandes, buen contraste)
js/dominio/            Lógica pura (progreso, perfil, sílabas, sesión)
js/infra/              Almacenamiento, audio y voz del dispositivo
js/ui/                 Pantallas y actividades
js/datos/contenido.js  Niveles, palabras, frases y cuentos
audio/                 MP3 generados (voz y efectos)
tools/                 Herramientas para generar y verificar audios
tests/                 Pruebas (node --test, sin dependencias)
```

## Desarrollo

Requiere Node 20 o superior.

```bash
npm test          # lógica + smoke test de interfaz (DOM simulado)
npm run verificar # comprueba que no falte ningún audio
```

Si tienes `GOOGLE_CLOUD_PROJECT` configurado para generar audios, ejecuta las
pruebas con `env -u GOOGLE_CLOUD_PROJECT npm test` en macOS/Linux para aislarlas
de esa configuración local.

## Publicación y versiones

El repositorio está en https://github.com/furthurr/leer-jugando.
El workflow `.github/workflows/pages.yml` ejecuta las pruebas y verifica los
audios antes de publicar cada actualización de `main` en GitHub Pages.
El sitio publicado contiene únicamente `index.html`, `css/`, `js/`, `assets/`
y `audio/`.

La versión se define en `package.json` siguiendo SemVer y cada release usa un
tag anotado `vX.Y.Z`. Las novedades se registran en [CHANGELOG.md](CHANGELOG.md).
La primera versión publicada es **v0.1.0**.

## Regenerar los audios

Los MP3 ya vienen incluidos. Solo hace falta regenerarlos si cambias textos o
niveles en `js/datos/contenido.js`. Los 43 clips añadidos para el nuevo camino
se sintetizaron localmente con Piper y la voz mexicana
`tools/voces/es_MX-claude-high.onnx`; pueden tener un timbre distinto al de los
audios anteriores.

La generación de voz usa [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech)
con voces documentadas para `es-US`. La API solo se usa al preparar archivos; el
juego distribuido sigue reproduciendo MP3 locales y funciona sin conexión. Como
`es-US` no garantiza un acento latinoamericano adecuado para el público del juego,
es obligatorio escuchar y aprobar el piloto antes de generar el lote completo.
Los cinco efectos de sonido se siguen sintetizando localmente con ffmpeg.

Requisitos de generación: Node 20+, `pnpm`, `gcloud` CLI y ffmpeg. Habilita Cloud
Text-to-Speech en el proyecto, revisa facturación/cuotas, selecciona el proyecto
y configura ADC local; no se guardan credenciales dentro del repositorio:

```bash
pnpm install
gcloud config set project PROJECT_ID
gcloud auth application-default login
gcloud auth application-default set-quota-project PROJECT_ID
export GOOGLE_CLOUD_PROJECT=PROJECT_ID

# Piloto: 12 clips (3 voces es-US-Neural2 × 4 textos), no modifica audio/
npm run audios -- --piloto --confirmar-costo

# Escucha tools/tmp/google-pilot/<ejecución>/<voice-id>/
# Tras aprobar una voz, generación completa (318 pistas habladas)
npm run audios -- --lote --voz es-US-Neural2-A --acepto-piloto --confirmar-lote

# Solo crea efectos que falten; no reemplaza los existentes.
npm run audios -- --efectos
npm run verificar
```

`--confirmar-costo` es obligatorio para el piloto; `--acepto-piloto` y
`--confirmar-lote` son obligatorios para el lote. La generación se realiza en
staging, conserva los efectos y publica solo tras validar las rutas y el límite
de 20 MB; el árbol anterior se guarda en `tools/tmp/google-backup/` para
recuperación manual. Las credenciales ADC se mantienen fuera del repositorio.

## Notas

- El juego no pide permisos ni micrófono y no recopila datos.
- Abdiel usa su MP3 generado con Google, sin síntesis del dispositivo. Otros
  nombres usan la voz en español del dispositivo; si no está disponible, solo
  se muestran escritos. Los nombres pregrabados se registran en
  `nombresGrabados` de `js/datos/contenido.js`.
- Fuera de esta versión: la «rr», las sílabas trabadas (bra, pla…) y las inversas (al, es…).
