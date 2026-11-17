# Nova Blocks — Documentación Técnica NOVA GAME 2026

Nov 17, 2026 · @Edwin

## Resumen ejecutivo

Nova Blocks es un juego arcade de caída de bloques tipo Tetris, desarrollado como entrega del Hackatón NOVA GAME 2026 en la asignatura Organización y Administración I (UNIAJC). El juego corre íntegramente en un único archivo `index.html` sin dependencias externas; basta abrirlo en un navegador moderno para jugarlo.

El objetivo de la entrega fue demostrar capacidad de diseño, implementación y documentación de un producto interactivo funcional en el contexto académico del hackatón, siguiendo los estándares de ingeniería de software. La inteligencia artificial (Claude de Anthropic) fue empleada como herramienta de apoyo en la construcción del código, la lógica del juego y la redacción de esta documentación.

| Atributo | Detalle |
| --- | --- |
| Nombre del proyecto | Nova Blocks |
| Evento | NOVA GAME — Hackatón académico virtual 2026 |
| Institución | UNIAJC — Institución Universitaria Antonio José Camacho |
| Asignatura | Organización y Administración I |
| Autor | Edwin Andrés Carabalí Cabezas |
| Rol en el hackatón | Líder de Evaluación y Datos (Grupo 4) |
| Fecha de entrega | Noviembre 2026 |
| Plataforma objetivo | Navegador web (escritorio y móvil) |
| Dependencias externas | Ninguna |

## Descripción del producto

Nova Blocks es un juego arcade de bloques que cae, inspirado en los clásicos del género (Tetris, Guideline). El jugador encaja piezas de siete formas (tetrominós I, J, L, O, S, T, Z) en un tablero de 10 × 20 celdas para completar líneas horizontales. Completar diez líneas sube el nivel y acelera la caída.

### Objetivos del producto

- Implementar un juego completamente funcional en un único archivo HTML estático, sin librerías ni dependencias externas.
- Demostrar dominio de Canvas 2D, Web Audio API y la Pointer Events API del navegador.
- Ofrecer experiencia de juego fluida tanto en escritorio (teclado) como en móvil (táctil).
- Cumplir estándares básicos de accesibilidad web (ARIA, `prefers-reduced-motion`, navegación por teclado).

### Alcance

| Incluido | Excluido |
| --- | --- |
| Tablero 10×20, 7 tipos de pieza | Multijugador / red |
| Bolsa de 7 piezas, cola de siguientes | Guardado de partidas en servidor |
| Pieza fantasma y pieza guardada (hold) | Tablas de clasificación globales |
| Rotación con ajustes de pared (wall kicks) | Modos de juego alternativos (maratón, sprints) |
| Sistema de puntuación por nivel | Personalización de colores |
| Sonido sintetizado (Web Audio API) |  |
| Pausa, récord local (localStorage) |  |
| Controles táctiles y gestos |  |

## Uso de IA en el desarrollo

Claude (Anthropic) fue el asistente de IA utilizado a lo largo del proyecto. Su participación abarcó tres dimensiones: generación y refinamiento de código, revisión de lógica de juego, y redacción de documentación técnica.

### Áreas donde se aplicó la IA

| Área | Descripción del aporte de la IA |
| --- | --- |
| Arquitectura del archivo único | Validación de la estructura HTML/CSS/JS en un solo archivo y verificación de la estrategia de tokens CSS para theming |
| Lógica de piezas y rotación | Implementación del sistema de bolsa de 7 piezas (7-bag), la función de rotación matricial y los ajustes de pared (wall kicks) |
| Sistema de gravedad por niveles | Definición de la tabla `GRAVITY[]` y la progresión de velocidad entre niveles 1–15 |
| Retardo de bloqueo (lock delay) | Lógica de `lockTimer`, `lockResets` y el límite de 15 intentos de reinicio |
| Efectos visuales | Partículas en limpieza de líneas, popup de puntos flotantes, efecto de sacudida (shake) y bloque fantasma |
| Audio sintetizado | Diseño de los efectos de sonido con osciladores, curvas de ganancia y frecuencias para cada evento del juego |
| Accesibilidad | Inclusión de roles ARIA, `aria-live` para anuncios, soporte de `prefers-reduced-motion` y etiquetas accesibles en botones |
| Controles táctiles | Implementación de Pointer Events API para gestos de deslizamiento, toque para rotar y swipe hacia abajo para caída rápida |
| Documentación | Redacción del `README.md` y este documento técnico a partir de la revisión del código fuente |

### Proceso de colaboración con la IA

El flujo de trabajo fue iterativo: el desarrollador planteaba requerimientos concretos (p. ej. «implementa el sistema de ajustes de pared para la rotación») y Claude generaba el código con comentarios explicativos. Cada entrega fue revisada funcionalmente por el desarrollador antes de integrarse. Los algoritmos críticos (colisión, bloqueo, limpieza de líneas) fueron verificados manualmente para garantizar su corrección.

### Consideración ética

El uso de IA como herramienta de apoyo es declarado explícitamente. Todo el código resultante fue comprendido, revisado y validado por el autor; la IA actuó como acelerador del proceso, no como sustituto del criterio de ingeniería.

## Arquitectura técnica

El juego sigue una arquitectura de **archivo único autocontenido**: todo el HTML, CSS y JavaScript vive en `index.html`, sin dependencias de red ni herramientas de compilación.

### Capas del sistema

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Presentación (estructura) | HTML5 semántico | Layout, overlays, controles táctiles, accesibilidad |
| Presentación (estilo) | CSS3 (Custom Properties, Grid, Flexbox) | Tokens de color, diseño responsivo, animaciones |
| Renderizado del juego | Canvas 2D API | Tablero, piezas, fantasma, partículas, popups |
| Lógica del juego | JavaScript ES2020 (IIFE) | Motor de juego, estado, bucle de actualización |
| Audio | Web Audio API | Síntesis procedural de efectos de sonido |
| Entrada (escritorio) | Keyboard Events API | Movimiento, rotación, caída, pausa |
| Entrada (móvil) | Pointer Events API | Botones táctiles, gestos de deslizamiento |
| Persistencia | localStorage | Récord personal y preferencia de sonido |

### Decisiones de diseño clave

**Single-file HTML.** Facilita la distribución (un único archivo para abrir o compartir) y elimina la necesidad de un servidor. El costo es que todo el código está en un solo contexto; se mitiga usando un IIFE estricto (`(() => { 'use strict'; … })()`) para encapsular el estado.

**Canvas 2D sobre DOM.** El tablero y las piezas se dibujan en un `<canvas>` para evitar la sobrecarga del DOM con 200 celdas individuales. Los paneles de estadísticas (puntuación, nivel, líneas) sí son elementos del DOM, actualizados por `syncHUD()`.

**Separación update / draw.** El bucle principal ejecuta `update(dt)` y `draw()` en cada frame, siguiendo el patrón de juego estándar de separación entre lógica y renderizado. El parámetro `dt` (delta time en segundos) hace la física independiente de la tasa de frames.

**DevicePixelRatio.** La función `prepareCanvas()` escala el canvas al DPR del dispositivo (hasta 2×) para nitidez en pantallas de alta resolución, sin modificar el CSS.

**Estado del juego como máquina de estados.** La variable `state` toma cuatro valores: `idle`, `playing`, `paused` y `over`. Toda la lógica de entrada y actualización verifica este estado antes de ejecutarse.

## Lógica del juego

### Representación del tablero

El tablero se almacena como un arreglo de 20 filas × 10 columnas: `grid[row][col]` guarda `null` (celda vacía) o el tipo de pieza (`'I'`, `'T'`, etc.). Las piezas activas se representan con una matriz de bits y posición `{type, m[][], x, y}`.

### Bolsa de siete piezas (7-bag)

Se usan dos estructuras: `bag[]` (cola actual barajada) y `queue[]` (buffer de las próximas 4 piezas visibles). La función `refillBag()` genera una permutación aleatoria de los 7 tipos mediante el algoritmo de Fisher-Yates. Esto garantiza que el jugador no reciba más de 12 piezas del mismo tipo seguidas.

### Colisión

```
collides(piece, dx, dy, matrix?) → boolean
```

Recorre cada celda activa de la matriz de la pieza. Una celda colisiona si queda fuera de los límites del tablero o si la celda correspondiente en `grid` no es `null`. Las celdas con `y < 0` (zona de entrada) se ignoran.

### Rotación con wall kicks

La función `rotateMatrix(m, dir)` aplica transposición y reflexión para rotar ±90°. Tras rotar, se prueban 9 desplazamientos de ajuste (`KICKS[]`) en orden: `[0,0], [-1,0], [1,0], [0,-1], …`. El primer desplazamiento que no colisione se acepta. Esto permite encajar piezas junto a paredes y esquinas.

### Gravedad y retardo de bloqueo

La constante `GRAVITY[level-1]` define el intervalo en segundos entre bajadas automáticas (de 0.85 s en nivel 1 a 0.035 s en nivel 15). En cada frame se acumula `dropTimer += dt`; cuando supera el intervalo, la pieza baja una fila.

Cuando la pieza no puede bajar más, comienza el retardo de bloqueo: `lockTimer` se incrementa; si alcanza `LOCK_DELAY = 0.45 s` sin que el jugador mueva o rote la pieza, se bloquea definitivamente. Mover o rotar reinicia `lockTimer` hasta un máximo de 15 reinicios (`lockResets`), evitando que el jugador postergue el bloqueo indefinidamente.

### Limpieza de líneas y puntuación

Tras bloquear una pieza, se detectan las filas completamente llenas. La puntuación se aplica con la tabla estándar antes de eliminar las filas:

| Líneas simultáneas | Multiplicador base |
| --- | --- |
| 1 | 100 |
| 2 | 300 |
| 3 | 500 |
| 4 (Tetris) | 800 |

El puntaje final por limpieza es `base × nivel`. La caída suave suma 1 punto por fila; la caída rápida suma 2 puntos por fila. Cada 10 líneas acumuladas el nivel sube en 1, hasta un máximo de 15.

## Interfaz de usuario y experiencia (UI/UX)

El diseño visual sigue un estilo arcade oscuro con tokens de color definidos como Custom Properties de CSS en `:root`. Cada tipo de pieza tiene su propio color (`--piece-i`, `--piece-t`, etc.), lo que permite cambiar el tema sin tocar el JavaScript.

### Estructura del layout

En escritorio, la pantalla se divide en dos columnas mediante CSS Grid:

- **Zona de juego** (`section.play`): el canvas del tablero con su overlay de estado.
- **Panel lateral** (`aside.panel`): puntuación, nivel, líneas, vista previa de la siguiente pieza y la pieza guardada, referencia de controles y botón de reinicio.

En móvil (< 820 px) el layout pasa a una sola columna con los controles táctiles visibles debajo del tablero.

### Efectos visuales

| Efecto | Implementación |
| --- | --- |
| Bloque fantasma (ghost) | Se dibuja en el Canvas con relleno semitransparente y borde del color de la pieza |
| Brillo en pieza activa | `ctx.shadowColor` + `ctx.shadowBlur` proporcional al tamaño de celda |
| Sacudida del tablero (shake) | Translación aleatoria del contexto Canvas cuando `shake > 0.002` |
| Flash de limpieza | Rectángulo blanco semitransparente sobre las filas eliminadas, animado con `Math.sin` |
| Partículas | Objetos `{x, y, vx, vy, life}` con física de gravedad simple, dibujados en Canvas |
| Popup de puntos | Texto flotante que sube y se desvanece sobre el tablero |
| Animación de puntuación | Clase CSS `is-bump` que escala el elemento al 107% con `@keyframes` |

### Estados de la interfaz

El overlay central refleja cuatro estados del juego:

1. **idle** — Pantalla de inicio con instrucciones y botón «Jugar».
2. **playing** — Overlay oculto; el HUD lateral muestra puntuación en tiempo real.
3. **paused** — Overlay con opciones «Continuar» y «Reiniciar».
4. **over** — Overlay con puntuación final, récord y botón «Jugar de nuevo»; indica si se superó el récord.

## Accesibilidad y compatibilidad

### Accesibilidad

| Característica | Implementación |
| --- | --- |
| Roles ARIA en el canvas | `role="img"` con `aria-label` descriptivo en el `<canvas>` del tablero |
| Diálogo modal del overlay | `role="dialog"` con `aria-modal` y `aria-labelledby` / `aria-describedby` |
| Región de estado en vivo | `<div role="status" aria-live="polite">` para anunciar eventos (nuevo nivel, fin de juego) |
| Navegación por teclado | Todos los botones son elementos `<button>` nativos con `focus-visible` destacado |
| Reducción de movimiento | `prefers-reduced-motion: reduce` desactiva la sacudida, el bump de puntuación y otras animaciones |
| Texto auxiliar | Clase `.sr-only` para etiquetas visibles solo para lectores de pantalla |
| Botones con estado | `aria-pressed` en el botón de sonido; `aria-label` dinámico en pausa/reanudación |

### Compatibilidad de navegadores

El juego usa APIs estándar ampliamente soportadas:

| API | Soporte mínimo estimado |
| --- | --- |
| Canvas 2D | Chrome 4, Firefox 2, Safari 3.1 |
| Web Audio API | Chrome 35, Firefox 25, Safari 9 |
| Pointer Events API | Chrome 55, Firefox 59, Safari 13 |
| CSS Custom Properties | Chrome 49, Firefox 31, Safari 9.1 |
| localStorage | Chrome 4, Firefox 3.5, Safari 4 |

Todos los navegadores modernos (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+) soportan el conjunto completo. Se incluye el atributo `lang="es"` y `<meta charset="utf-8">` para correcta interpretación de caracteres.

### Adaptación a pantallas

- El canvas se redibuja con la función `fitBoard()` en cada evento `resize` u `orientationchange`.
- Se usa `ResizeObserver` para detectar cambios de tamaño del contenedor del tablero y los paneles de previsualización.
- La altura del tablero usa `clamp(420px, calc(100dvh - 130px), 640px)` para adaptarse a ventanas de distinto alto.
- En dispositivos con `pointer: coarse` se muestran automáticamente los controles táctiles.

## Audio sintetizado con Web Audio API

Todos los efectos de sonido se generan proceduralmente mediante la Web Audio API, sin archivos de audio externos. La función `tone(freq, dur, opts)` crea un oscilador, lo conecta a un nodo de ganancia con curva de entrada/salida suave (`exponentialRampToValueAtTime`) y lo conecta a la salida del contexto de audio.

### Efectos de sonido

| Evento del juego | Tipo de onda | Frecuencia base | Efecto adicional |
| --- | --- | --- | --- |
| Mover pieza | `square` | 190 Hz | — |
| Rotar pieza | `triangle` | 320 Hz | — |
| Bloqueo de pieza | `sine` | 130 Hz | — |
| Caída rápida | `square` | 90 Hz | Slide descendente −30 Hz |
| Guardar pieza (hold) | `sine` | 440 Hz | — |
| Limpiar 1–4 líneas | `triangle` | 523/659/784/1047 Hz | Notas en cascada (delay 55 ms entre cada una) |
| Subir de nivel | `triangle` | 392/523/659 Hz | Acorde ascendente |
| Fin de partida | `sawtooth` | 392→196 Hz | Cuatro notas descendentes |
| Inicio de partida | `triangle` | 392/523/659 Hz | Acorde ascendente |
| Pausa | `sine` | 294 Hz | — |

### Gestión del contexto de audio

El `AudioContext` se crea en diferido (al primer gesto del usuario) para cumplir la política de autoplay de los navegadores. Si el contexto queda suspendido, se reanuda con `audioCtx.resume()`. El jugador puede silenciar el audio con el botón dedicado; la preferencia se persiste en `localStorage`.

## Instrucciones de despliegue y uso

### Requisitos

- Navegador moderno con JavaScript habilitado (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+).
- No requiere servidor web, instalación, ni conexión a internet.

### Despliegue local

1. Descargar el archivo `index.html`.
2. Abrir el archivo con doble clic, o arrastrarlo a una pestaña del navegador.
3. Pulsar el botón **Jugar** (o `Enter`) para iniciar la partida.

### Despliegue en servidor / hosting estático

Basta subir `index.html` a cualquier servicio de hosting estático (GitHub Pages, Netlify, Vercel, etc.). Al ser un archivo autocontenido sin dependencias externas, no se requiere configuración adicional.

```bash
# Ejemplo con servidor local de Python (para pruebas)
python3 -m http.server 8080
# Luego abrir http://localhost:8080 en el navegador
```

### Estructura de archivos

| Archivo | Descripción |
| --- | --- |
| `index.html` | Juego completo (HTML + CSS + JavaScript) |
| `README.md` | Instrucciones de uso para el usuario final |

## Controles y sistema de puntuación

### Tabla de controles

| Acción | Teclado | Táctil / Gestos |
| --- | --- | --- |
| Mover izquierda | `←` | Botón ← / deslizar horizontalmente sobre el tablero |
| Mover derecha | `→` | Botón → / deslizar horizontalmente sobre el tablero |
| Girar (sentido horario) | `↑` o `X` | Botón girar / tocar el tablero sin desplazarse |
| Girar (antihorario) | `Z` | — |
| Caída suave | `↓` (mantener) | Botón ↓ (mantener) |
| Caída rápida | `Espacio` | Botón caída / deslizar rápido hacia abajo sobre el tablero |
| Guardar pieza | `C` o `Shift` | Botón de intercambio |
| Pausa / Reanudar | `P` o `Escape` | Botón de pausa en la barra superior |
| Reiniciar | `R` | Botón «Reiniciar» en el panel |

### Sistema de puntuación

| Acción | Puntos |
| --- | --- |
| Completar 1 línea | 100 × nivel |
| Completar 2 líneas | 300 × nivel |
| Completar 3 líneas | 500 × nivel |
| Completar 4 líneas (Tetris) | 800 × nivel |
| Caída suave (1 fila) | 1 punto |
| Caída rápida (1 fila) | 2 puntos |

El récord personal se guarda automáticamente en `localStorage` bajo la clave `nova-blocks-best` y persiste entre sesiones del mismo navegador.

## Conclusiones y trabajo futuro

### Conclusiones

Nova Blocks demuestra que es posible construir un juego arcade completo, accesible y visualmente cuidado con tecnologías web nativas sin dependencias externas. Los objetivos del hackatón se cumplieron:

- El juego es funcional y jugable en escritorio y dispositivos móviles.
- El código está organizado, comentado y sigue patrones estándar de desarrollo de juegos (separación lógica/render, delta time, máquina de estados).
- Se aplicó inteligencia artificial como herramienta de apoyo de forma declarada y responsable, acelerando el desarrollo sin sustituir el criterio del desarrollador.
- El producto puede distribuirse como un único archivo HTML, lo que simplifica la entrega y la evaluación.

### Trabajo futuro

| Mejora propuesta | Prioridad | Complejidad estimada |
| --- | --- | --- |
| Tabla de clasificación local (top 10 scores) | Alta | Baja |
| Modos de juego alternativos (Sprint 40 líneas, Maratón) | Media | Media |
| Personalización de colores / temas | Media | Baja |
| Efectos de sonido extendidos (música de fondo sintetizada) | Baja | Media |
| Exportar puntuación como imagen para compartir | Baja | Media |
| Soporte para gamepads (Gamepad API) | Baja | Media |
| Internacionalización (i18n) para otros idiomas | Baja | Baja |
