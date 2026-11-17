# Nova Blocks

Juego arcade de bloques inspirado en los clásicos de piezas que caen, hecho para el Hackatón Nova Game 2026. Todo vive en un solo archivo `index.html`: no hay dependencias, imágenes externas ni instalación.

## Cómo jugar

Abre `index.html` en cualquier navegador moderno (doble clic o arrástralo a una pestaña). Pulsa **Jugar** y encaja las piezas para completar líneas horizontales. Cada diez líneas sube el nivel y la caída se acelera.

## Controles

| Acción | Teclado | Táctil |
| --- | --- | --- |
| Mover | `←` `→` | Botones o deslizar sobre el tablero |
| Girar | `↑` o `X` | Botón de giro o tocar el tablero |
| Girar al revés | `Z` | — |
| Caída suave | `↓` | Botón de flecha abajo |
| Caída rápida | `Espacio` | Botón de caída o deslizar hacia abajo |
| Guardar pieza | `C` o `Shift` | Botón de intercambio |
| Pausa | `P` o `Esc` | Botón de pausa |

## Puntos

- Una línea: 100 puntos × nivel.
- Dos líneas: 300 × nivel.
- Tres líneas: 500 × nivel.
- Cuatro líneas: 800 × nivel.
- Caída suave: 1 punto por fila.
- Caída rápida: 2 puntos por fila.

La mejor puntuación se guarda en el navegador con `localStorage`.

## Detalles técnicos

- Arquitectura modular limpia: `index.html` (estructura), `style.css` (estilos y diseño responsivo) y `script.js` (motor y lógica de juego), sin librerías externas.
- Tablero de 10 × 20 celdas dibujado con Canvas 2D.
- Bolsa de siete piezas, cola de siguientes, pieza fantasma y pieza guardada.
- Rotación con ajustes de pared y retardo de bloqueo.
- Sonido sintetizado con Web Audio API (se puede silenciar).
- Diseño adaptable a escritorio y móvil, controles táctiles y gestos.
- Respeta `prefers-reduced-motion` y funciona con teclado.

## Archivos

- `index.html` — Estructura semántica de la aplicación y maquetación.
- `style.css` — Estilos, diseño responsive, tokens visuales y animaciones.
- `script.js` — Motor del juego, renderizado Canvas 2D, lógica 7-bag y Web Audio API.
- `README.md` — Este documento.
