# Requisitos — Juego para aprender a leer

Modo SDD: standard
Fase: Requirements
Estado: aprobado
Gate 1: aprobado

Juego HTML offline para un niño de 6 años que empieza a leer en español
latinoamericano. Avanza con método silábico: vocales → carretillas (unir letras)
→ palabras → frases → cuentos cortos. Todas las instrucciones son habladas.

## Historia 1: Jugar sin conexión
Como familia quiero abrir el juego sin internet para usarlo en cualquier lugar.

### Criterios (EARS)
- Req 1.1: EL SISTEMA DEBERÁ funcionar completo (pantallas, imágenes y audios) sin conexión a internet, abriendo un archivo HTML local.
- Req 1.2: EL SISTEMA DEBERÁ funcionar en las versiones actuales de Chrome, Safari y Edge, en computador y en tablet.
- Req 1.3: EL SISTEMA NO DEBERÁ enviar datos a ningún servidor ni cargar recursos externos.

## Historia 2: Instrucciones habladas
Como niño que aún no lee quiero escuchar qué hacer para jugar solo.

### Criterios (EARS)
- Req 2.1: CUANDO se muestra una actividad EL SISTEMA DEBERÁ reproducir su instrucción en audio.
- Req 2.2: EL SISTEMA DEBERÁ mostrar en cada actividad un botón visible (icono de altavoz) para repetir la instrucción.
- Req 2.3: CUANDO el niño toca una letra, sílaba, palabra o frase EL SISTEMA DEBERÁ reproducir su sonido.
- Req 2.4: EL SISTEMA DEBERÁ usar una sola voz, en español latinoamericano, para todos los audios pregrabados (excepción: el nombre del niño, ver Req 9.8).
- Req 2.5: SI el navegador bloquea el audio hasta la primera interacción ENTONCES EL SISTEMA DEBERÁ mostrar una pantalla inicial con un botón grande «Jugar» que habilite el sonido.
- Req 2.6: SI falta un archivo de audio ENTONCES EL SISTEMA DEBERÁ seguir funcionando sin bloquearse ni mostrar errores al niño.
- Req 2.7: MIENTRAS se reproduce un audio EL SISTEMA DEBERÁ detenerlo si empieza otro, para no mezclar sonidos.

## Historia 3: Progresión de niveles
Como niño quiero avanzar de lo fácil a lo difícil para aprender paso a paso.

### Criterios (EARS)
- Req 3.1: EL SISTEMA DEBERÁ ofrecer, en este orden, las etapas: (1) Vocales, (2) Carretillas con consonantes, (3) Palabras de dos sílabas, (4) Palabras de tres sílabas, (5) Frases cortas, (6) Cuentos cortos.
- Req 3.2: EL SISTEMA DEBERÁ presentar las consonantes en orden progresivo: m, p, s, l, t, n, d, c (ca-co-cu), b, r (suave), f, g (ga-go-gu), j, v, ñ, ch, y, z.
- Req 3.3: EL SISTEMA DEBERÁ usar en cada nivel solo letras y sílabas ya presentadas en ese nivel o en niveles anteriores.
- Req 3.4: CUANDO el niño completa un nivel EL SISTEMA DEBERÁ desbloquear el siguiente.
- Req 3.5: EL SISTEMA DEBERÁ mostrar los niveles bloqueados como no disponibles (candado) y, al tocarlos, explicarlo en audio.
- Req 3.6: EL SISTEMA DEBERÁ permitir repetir cualquier nivel ya desbloqueado.

## Historia 4: Actividades interactivas
Como niño quiero juegos variados para aprender jugando.

### Criterios (EARS)
- Req 4.1: CUANDO la actividad es «escucha y elige» EL SISTEMA DEBERÁ reproducir un sonido y ofrecer de 2 a 4 opciones para tocar la correcta.
- Req 4.2: CUANDO la actividad es «une letras» EL SISTEMA DEBERÁ permitir arrastrar (o tocar en orden) una consonante hasta una vocal para formar la sílaba, y reproducir la sílaba formada.
- Req 4.3: CUANDO la actividad es «carretilla» EL SISTEMA DEBERÁ mostrar la serie de una consonante (p. ej. ma-me-mi-mo-mu) y reproducir cada sílaba al tocarla.
- Req 4.4: CUANDO la actividad es «arma la palabra» EL SISTEMA DEBERÁ mostrar una imagen y sílabas desordenadas para colocarlas en orden.
- Req 4.5: CUANDO la actividad es «lee y elige» EL SISTEMA DEBERÁ mostrar una palabra o frase escrita y de 2 a 3 imágenes para elegir la que corresponde.
- Req 4.6: CUANDO la actividad es «cuento» EL SISTEMA DEBERÁ mostrar el texto por páginas con imagen, resaltar cada palabra mientras se lee en voz alta y permitir tocar una palabra para oírla.
- Req 4.7: CUANDO termina un cuento EL SISTEMA DEBERÁ hacer al menos una pregunta de comprensión con respuestas en imagen.

## Historia 5: Respuesta amable y motivación
Como niño quiero sentir que lo hago bien para querer seguir jugando.

### Criterios (EARS)
- Req 5.1: CUANDO la respuesta es correcta EL SISTEMA DEBERÁ dar una felicitación en audio y una animación breve.
- Req 5.2: CUANDO la respuesta es incorrecta EL SISTEMA DEBERÁ dar un aviso suave en audio («¡Casi! Inténtalo otra vez») sin sonidos negativos ni penalizaciones.
- Req 5.3: SI el niño falla dos veces seguidas la misma pregunta ENTONCES EL SISTEMA DEBERÁ resaltar visualmente la opción correcta y volver a reproducir el sonido modelo.
- Req 5.4: CUANDO el niño completa un nivel EL SISTEMA DEBERÁ otorgar de 1 a 3 estrellas según los aciertos al primer intento y mostrar una celebración.
- Req 5.5: EL SISTEMA DEBERÁ mostrar el total de estrellas ganadas en el mapa de niveles.

## Historia 6: Progreso guardado
Como familia quiero que el niño siga donde lo dejó.

### Criterios (EARS)
- Req 6.1: CUANDO se completa un nivel EL SISTEMA DEBERÁ guardar el progreso (niveles desbloqueados y estrellas) en el navegador local.
- Req 6.2: CUANDO se abre el juego EL SISTEMA DEBERÁ restaurar el progreso guardado.
- Req 6.3: SI el progreso guardado no existe o está dañado ENTONCES EL SISTEMA DEBERÁ empezar desde el primer nivel sin mostrar errores.

## Historia 7: Zona de adultos
Como adulto quiero ajustar el juego sin que el niño lo cambie por accidente.

### Criterios (EARS)
- Req 7.1: EL SISTEMA DEBERÁ ofrecer una zona de adultos protegida por una comprobación sencilla (p. ej. mantener pulsado un botón 3 segundos).
- Req 7.2: CUANDO un adulto está en la zona de adultos EL SISTEMA DEBERÁ permitir reiniciar el progreso, previa confirmación.
- Req 7.3: CUANDO un adulto está en la zona de adultos EL SISTEMA DEBERÁ permitir desbloquear todos los niveles.
- Req 7.4: CUANDO un adulto está en la zona de adultos EL SISTEMA DEBERÁ permitir ajustar el volumen o silenciar la música de fondo, si la hay.
- Req 7.5: CUANDO un adulto está en la zona de adultos EL SISTEMA DEBERÁ permitir cambiar o borrar el nombre y el sexo del niño.

## Historia 8: Fácil de usar para un niño de 6 años
Como niño quiero botones grandes y claros para no frustrarme.

### Criterios (EARS)
- Req 8.1: EL SISTEMA DEBERÁ usar zonas táctiles de al menos 64×64 px y letra de imprenta minúscula grande (mínimo 48 px en letras y sílabas).
- Req 8.2: EL SISTEMA DEBERÁ funcionar con toque y con ratón, sin necesitar teclado.
- Req 8.3: EL SISTEMA DEBERÁ mostrar un botón «casa» para volver al mapa de niveles desde cualquier actividad.
- Req 8.4: EL SISTEMA DEBERÁ mantener un contraste de texto de al menos 4.5:1 y no transmitir información solo con el color.
- Req 8.5: EL SISTEMA DEBERÁ agrupar las actividades en sesiones cortas (de 5 a 8 ejercicios por nivel).

## Historia 9: Perfil de inicio (nombre y sexo)
Como niño quiero que el juego me llame por mi nombre y me hable como niño o niña para sentirlo mío.

### Criterios (EARS)
- Req 9.1: CUANDO se abre el juego y no hay un perfil guardado EL SISTEMA DEBERÁ mostrar una pantalla de inicio que pida el nombre y el sexo, con una instrucción en audio que pida ayuda a un adulto.
- Req 9.2: EL SISTEMA DEBERÁ pedir el sexo con dos botones grandes con imagen, «niño» y «niña», que reproducen su palabra al tocarlos.
- Req 9.3: CUANDO se confirma el perfil EL SISTEMA DEBERÁ guardar el nombre y el sexo solo en el almacenamiento local del navegador.
- Req 9.4: EL SISTEMA DEBERÁ aceptar nombres de 1 a 20 caracteres (letras, incluidas tildes y ñ, y espacios) y rechazar el resto sin romper la pantalla.
- Req 9.5: EL SISTEMA DEBERÁ permitir omitir el nombre, el sexo o ambos; lo omitido se sustituye por saludos genéricos y frases neutras («¡Muy bien!», «¡Lo lograste!»).
- Req 9.6: CUANDO hay un sexo guardado EL SISTEMA DEBERÁ usar las frases pregrabadas con la concordancia de género correspondiente («¡Bienvenido!» / «¡Bienvenida!», «¡Qué listo!» / «¡Qué lista!»).
- Req 9.7: CUANDO hay un nombre guardado EL SISTEMA DEBERÁ mostrarlo escrito en el saludo inicial y en las celebraciones de fin de nivel.
- Req 9.8: CUANDO hay un nombre guardado y el dispositivo dispone de una voz en español EL SISTEMA DEBERÁ decir el nombre en voz alta en el saludo inicial y en las celebraciones.
- Req 9.9: SI el dispositivo no dispone de una voz en español ENTONCES EL SISTEMA DEBERÁ reproducir el saludo pregrabado sin el nombre y mantenerlo solo escrito.
- Req 9.10: EL SISTEMA DEBERÁ mostrar el nombre como texto, sin interpretarlo como código.
- Req 9.11: CUANDO se abre el juego y hay un perfil guardado EL SISTEMA DEBERÁ omitir la pantalla de inicio y saludar con el perfil guardado.

## Supuestos
- Método silábico en español latinoamericano; letras minúsculas de imprenta. Las mayúsculas aparecen en frases y cuentos.
- Uso familiar y privado; no se publica en tiendas ni en la web.
- No hay reconocimiento de voz (el niño no tiene que hablar al micrófono); queda fuera de alcance.
- El nombre lo escribe un adulto (el niño aún no teclea). No puede ir en los audios pregrabados porque se desconoce al generarlos; para decirlo se usa la voz del dispositivo, que puede sonar distinta a la voz principal. Es la única excepción aceptada a Req 2.4.
- El sexo solo se usa para la concordancia gramatical de las frases habladas y escritas; no cambia niveles, colores ni contenido. Las frases con género se pregraban en tres variantes: masculina, femenina y neutra.
- Las imágenes serán ilustraciones simples incluidas en el proyecto (emoji o SVG), sin descarga en tiempo de ejecución.
- Los audios se generan una sola vez antes de usar el juego y viajan junto al HTML. La herramienta concreta (Piper, voz latinoamericana) se define en Design.
- La «r» fuerte, las sílabas trabadas (bra, pla…) y las inversas (al, es…) quedan fuera de esta primera versión.
