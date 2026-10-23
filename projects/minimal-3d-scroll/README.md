# Orden — single-page minimalista con scroll 3D

Landing de una sola página para un servicio de automatización con Google
(Gmail, Calendar, Drive, Sheets). Estética minimalista: tres colores,
una familia tipográfica (Geist + Geist Mono), movimiento 100 % ligado al scroll.

## Estructura

```
minimal-3d-scroll/
├── index.html        # Marcado semántico de las 6 secciones
├── css/styles.css    # Tokens (color, tipo, espacio), layout, estados 3D de reposo, responsive
└── js/main.js        # Lenis + GSAP/ScrollTrigger, organizado por sección
```

Librerías por CDN con versión fija: GSAP 3.12.5, ScrollTrigger 3.12.5, Lenis 1.1.13.
No hay build ni dependencias de npm.

## Cómo usarlo

1. Sirva la carpeta con cualquier servidor estático (abrir el archivo con doble clic
   también funciona, pero un servidor evita problemas de rutas):
   ```bash
   cd projects/minimal-3d-scroll
   python3 -m http.server 8080
   # abra http://localhost:8080
   ```
2. Cambie los datos de contacto en el footer de `index.html` (están marcados).
3. Para cambiar la paleta, edite solo los tokens de `:root` en `css/styles.css`
   (hay versión clara y oscura; la oscura se activa con el tema del sistema).
4. Para publicarlo: suba la carpeta tal cual a Netlify, Vercel, GitHub Pages o
   cualquier hosting estático.

## Secciones y efecto de cada una

| # | Sección   | Efecto |
|---|-----------|--------|
| 1 | Hero      | Una placa de 3 capas gira en X/Y y sus capas se separan en Z. Parallax de 2 capas (texto lento, objeto rápido). |
| 2 | Concepto  | Sticky. El bloque entra desde el fondo (`z` negativo + `rotateX`) y las palabras se encienden una a una. |
| 3 | Servicios | Cards que se levantan del plano (`rotateX` 28° → 0, `z` −220 → 0) con sombra en capa propia. Hover con ±3° en escritorio. |
| 4 | Proceso   | Sticky. Túnel en Z: la cámara avanza a través de 4 paneles y se detiene en cada uno. |
| 5 | About     | Parallax de 3 capas (palabra de fondo, texto, ficha) y ficha que gira levemente en Y al entrar. |
| 6 | Footer    | Título que se endereza desde `rotateX` negativo. |

## Técnicas 3D, en breve

**`perspective` en el padre, `preserve-3d` en el hijo.** La perspectiva define a
qué distancia está el "ojo" del usuario (1100–1600px = sutil; menos de 800px se
ve distorsionado). Va en el contenedor para que todos los hijos compartan el
mismo punto de fuga. `transform-style: preserve-3d` permite que los hijos vivan
en el espacio 3D del padre en lugar de aplanarse.

**Capas en Z (hero).** Tres planos con `translateZ(0 / 24 / 48px)`. Con el scroll,
GSAP aumenta esa separación mientras rota el conjunto: se percibe volumen sin
modelar nada en 3D.

**Túnel de cámara (proceso).** Los pasos están en `z = -i × 900px`. En vez de
mover cada paso, se mueve el contenedor completo hacia el usuario (`z = cam × 900`).
La opacidad depende de la distancia a la cámara. El progreso pasa por
`power2.inOut` en cada tramo, por eso la cámara frena en cada paso.

**Sombras baratas.** Animar `box-shadow` repinta en cada frame. Aquí la sombra
es un elemento aparte con la sombra fija, y solo se anima su `opacity`.

**Solo `transform` y `opacity`.** Son las dos propiedades que el navegador puede
animar en la GPU sin recalcular layout. Ninguna animación toca `top`, `width`,
`margin` ni filtros.

**Lenis + ScrollTrigger en el mismo reloj.** Lenis se ejecuta dentro de
`gsap.ticker` y avisa a ScrollTrigger en cada scroll. Así ambos leen el mismo
frame y no hay saltos entre el scroll suave y las animaciones.

## Accesibilidad y rendimiento

- **`prefers-reduced-motion: reduce`**: no se crea Lenis ni ninguna animación. La
  página queda en su estado de reposo (la placa del hero conserva una inclinación
  estática), totalmente legible.
- **Sin JavaScript o si el CDN falla**: la página se ve completa. El HTML y el CSS
  no dependen del JS para mostrar contenido.
- **Móvil (< 900px)**: sin secciones fijadas, rotaciones a la mitad o menos, el
  túnel se convierte en lista vertical y no hay hover 3D.
- `gsap.matchMedia` crea y destruye todo al cruzar el breakpoint o al cambiar la
  preferencia de movimiento, sin recargar la página.
- El texto partido en palabras conserva una copia completa para lectores de pantalla.

## Límites conocidos

- `backdrop-filter` del nav no existe en navegadores muy viejos; el nav sigue siendo
  legible porque su fondo es 82 % opaco.
- Si añade más pasos al proceso, el túnel se ajusta solo (la duración del pin
  depende de la cantidad de pasos).
