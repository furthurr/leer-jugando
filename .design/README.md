# Diseño visual

## Contexto para IA

Juego web con HTML, JavaScript y CSS. Los colores, tamaños y estilos compartidos viven en `css/estilos.css`.

## Iconografía

Todos los botones que antes mostraban un altavoz utilizan el mismo dibujo SVG de una persona de perfil hablando, con tres ondas sonoras azules. Asset: `assets/persona-hablando.svg`. Fuentes: `js/ui/actividades/lee-elige.js:30`, `js/ui/actividades/escucha-elige.js:19`, `js/ui/actividades/une-letras.js:72`, `js/ui/actividades/cuento.js:29` y `js/ui/pantallas/actividad.js:19`. Tamaños definidos en `css/estilos.css:103-106`: 96 × 96 px en botones circulares, 44 × 44 px en la barra y 40 × 40 px junto al texto «Escuchar». La imagen es decorativa; cada botón conserva su nombre accesible.

## Estado de sincronización

Actualización focalizada: 2026-10-11. Tecnología: web (CSS y JavaScript). Workspace sin repositorio Git. Incluye el mapa de aventura aprobado.

## Mapa de aprendizaje

La pantalla «Mi aventura de lectura» utiliza una lista ordenada de actividades con botones circulares unidos por un sendero SVG continuo. La ruta se calcula a partir de todos los niveles reales, con una parada cada 190 px. Los títulos de `contenido.etapas` agrupan el camino en preparación de vocales, cuatro etapas de letras y una meta de cuentos (`js/ui/pantallas/mapa.js:25-52`). El SVG estira únicamente su eje horizontal para mantener las conexiones al cambiar el ancho de pantalla.

- Fondo crema a verde suave (`#FFF8E7` → `#EDF6E4`), sendero de arena (`#F2DFB9`) con borde `#D9C6A0` y huellas claras. Fuente: `css/estilos.css:138-150`.
- Completados: degradado verde y estrellas reales debajo del botón. Disponible actual: azul con halo celeste. Bloqueados: gris y candado. Botones de 112 px, reducidos a 96 px en móviles. Fuentes: `css/estilos.css:154-168`, `css/estilos.css:176-192` y `js/ui/pantallas/mapa.js:53-69`.
- El personaje decorativo `assets/aventura-personaje.svg` acompaña la siguiente actividad; los árboles y flores de `assets/aventura-paisaje.svg` se repiten cada tres paradas. Fuente: `js/ui/pantallas/mapa.js:70-71`.
- Se conservan los botones nativos, el foco de teclado, el audio del candado y la pulsación de tres segundos para adultos. La parada actual usa `aria-current="step"`; los nombres accesibles incluyen número de nivel, actividad, disponibilidad y estrellas (`js/ui/pantallas/mapa.js:58-65`).
- Cabecera y resumen muestran el progreso real; al terminar todas las actividades aparece el mensaje de aventura completada (`js/ui/pantallas/mapa.js:78-87`).

Referencia visual aprobada: `assets/propuesta-camino-niveles.svg` y su vista PNG. Verificación del mapa en Chrome a 320, 390, 840 y 1280 px: botones y etiquetas dentro del ancho, imágenes locales cargadas, selección de actividad, audio de bloqueo, acceso de adultos y foco de teclado. Prueba de integración: `tests/integracion-ui.test.js`, «el mapa muestra el progreso real y mantiene el acceso a niveles y candados».

La presentación hablada de la letra precede a sus sílabas en
`js/ui/actividades/carretilla.js:27-30`.
