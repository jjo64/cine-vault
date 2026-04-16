---
name: css-migration-cinevault
description: >
  Complemento de refactor-cinevault. Migra inline styles y .css globales
  a CSS Modules por componente. Aplica CSS moderno (container queries,
  clamp(), auto-fit/minmax) para eliminar media queries redundantes y
  corregir layouts que dependen de margin para posicionar.
  Incluye checklist de accesibilidad CSS orientado a Lighthouse ≥92
  en las categorías Accessibility y Best Practices.
  Invocar desde refactor-cinevault en la Fase 6 (estilos) o de forma
  independiente cuando el único problema es el CSS.
---

# Skill: CSS Migration — CineVault

## Cuándo usar esta skill

Esta skill se invoca en dos contextos:

1. **Desde `refactor-cinevault`** — en la Fase 6 (estilos), cuando el diagnóstico
   detecta `Inline styles: Sí` o `CSS global (.css): Sí`.
2. **Directamente** — cuando el componente no es un god component pero su CSS
   está mal estructurado (abuso de margin, media queries redundantes, tokens locales
   inconsistentes).

```
Invocar con:
"Quiero migrar los estilos de MovieDetail usando css-migration-cinevault"
```

---

## PASO 1 — AUDITORÍA DEL CSS EXISTENTE

Antes de escribir una sola línea, analizar el CSS actual y completar esta tabla:

```
AUDITORÍA CSS: [NombreArchivo.css / inline styles en NombreArchivo.tsx]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOKENS
━━━━━━
¿Usa tokens --md-* o --cv-*?:      [listar cuáles]
¿Hay hex directos en el CSS?:       [Sí → listar / No]
¿Hay valores de color duplicados?:  [Sí → listar / No]

LAYOUT
━━━━━━
¿Cuántas @media queries tiene?:     [N]
¿Hay margin usado para posicionar?: [Sí → listar casos / No]
¿Hay width/height fijos en px?:     [Sí → listar / No]
¿Usa JS para responsive?:           [Sí → listar hooks/states / No]
¿Grid con columnas hardcoded?:      [Sí → listar / No]
¿Flex sin gap (usa margin-right)?:  [Sí → listar / No]

CALIDAD
━━━━━━━
¿Cuántos !important hay?:           [N]
¿Hay clases duplicadas/conflictivas?:[listar]
¿Hay dead code (clases no usadas)?: [Sí → listar / No]
¿Hay z-index sin contexto?:         [Sí → listar valores / No]

INLINE STYLES (en el .tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━
¿Cuántos style={{ }} hay?:         [N]
¿Son estáticos o calculados?:      [Estáticos → migrar / Calculados → mantener]
¿Alguno depende de estado/props?:  [Sí → listar cuáles / No]

ACCESIBILIDAD (impacto en Lighthouse)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
¿Hay texto con contraste insuficiente (<4.5:1)?:  [Sí → listar clases / No]
¿Hay elementos interactivos sin :focus-visible?:  [Sí → listar / No]
¿Hay touch targets <44px en mobile?:              [Sí → listar / No]
¿Hay `user-select: none` en texto de contenido?:  [Sí → listar / No]
¿Hay `pointer-events: none` que tape interacción?: [Sí → listar / No]
¿Hay animaciones sin `prefers-reduced-motion`?:   [Sí → listar / No]

CLASIFICACIÓN FINAL
━━━━━━━━━━━━━━━━━━
Esfuerzo estimado: [Bajo <2h / Medio 2-4h / Alto +4h]
Riesgo de regresión visual: [Bajo / Medio / Alto]
Score Lighthouse estimado antes: [Accessibility: N / Best Practices: N]
```

---

## PASO 2 — ESTRATEGIA DE TOKENS

### Regla de oro: un solo sistema de tokens

Todo valor de color o tipografía viene de los tokens globales `--cv-*`.
Los tokens locales `--md-*` o similares **se eliminan** y se mapean directamente.

```css
/* ❌ ANTES — token local redundante */
:root {
  --md-bg: #080808;
  --md-accent: #D4AF7A;
}
.hero { background: var(--md-bg); }

/* ✅ DESPUÉS — token global directo */
.hero { background: var(--cv-bg); }
```

### Mapa canónico de tokens CineVault

```css
/* COLORES */
--cv-bg:           #080808    /* fondo base de la app */
--cv-surface:      #111111    /* tarjetas, paneles */
--cv-elevated:     #1A1A1A    /* inputs, elementos elevados */
--cv-border:       #252525    /* bordes y separadores */
--cv-accent:       #D4AF7A    /* dorado primario — oro silencioso */
--cv-accent-dim:   #9A7A48    /* dorado apagado — estados secundarios */
--cv-accent-glow:  rgba(212, 175, 122, 0.10)   /* brillo sutil */
--cv-accent-glow-strong: rgba(212, 175, 122, 0.18)
--cv-gold:         #C8A96E    /* dorado alternativo — detalles finos */
--cv-text:         #E2E2E2    /* texto principal */
--cv-text-soft:    #7A7A7A    /* texto secundario */
--cv-text-muted:   #3A3A3A    /* texto desactivado/placeholder */

/* TIPOGRAFÍA */
--cv-font-serif:   'Cormorant Garamond', serif
--cv-font-sans:    'Syne', sans-serif
```

### Tokens locales permitidos (solo layout, no color)

Dentro del `.module.css` se pueden declarar propiedades custom **solo para
valores de layout específicos del componente** que no pertenecen al sistema global:

```css
/* ✅ Permitido — son de layout, no de color */
.container {
  --_poster-width: 300px;      /* prefijo _ = privado al componente */
  --_sidebar-width: 320px;
  --_hero-overlap: -27vh;
}
```

Nunca declarar tokens de color locales. Si un color no está en `--cv-*`,
se consulta antes de inventarlo.

---

## PASO 3 — ESTRATEGIA DE RESPONSIVE

### Principio: el contenido se adapta, no el CSS lo fuerza

El objetivo es **mínimas media queries** usando técnicas que hacen que el layout
fluya solo. Las media queries quedan reservadas para cambios de composición
imposibles de lograr con flujo natural.

### Breakpoints oficiales de CineVault

```css
/* Solo estos cuatro. No inventar breakpoints intermedios. */
@media (max-width: 480px)  { /* mobile pequeño  */ }
@media (max-width: 768px)  { /* mobile           */ }
@media (max-width: 1024px) { /* tablet/portátil  */ }
@media (min-width: 1280px) { /* desktop completo */ }
```

Si un ajuste aplica a "todos los dispositivos pequeños", usar `max-width: 768px`.
**No crear `max-width: 410px`, `max-width: 640px` ni variantes intermedias** — esos
casos se resuelven con `clamp()` o `auto-fit/minmax`, no con queries adicionales.

---

## PASO 4 — TÉCNICAS DE LAYOUT MODERNO

### A. `clamp()` para tipografía y espaciado fluido

Elimina la necesidad de sobrescribir `font-size` en cada breakpoint.

```css
/* ❌ ANTES — 3 media queries para el mismo valor */
.hero-title { font-size: 54px; }
@media (max-width: 768px)  { .hero-title { font-size: 36px !important; } }
@media (max-width: 410px)  { .hero-title { font-size: 32px !important; } }

/* ✅ DESPUÉS — una sola declaración, fluido entre 375px y 1440px */
.heroTitle { font-size: clamp(36px, 8vw, 110px); }
```

**Fórmula de referencia para CineVault:**

| Elemento | `clamp()` recomendado |
|---|---|
| Hero title | `clamp(36px, 8vw, 110px)` |
| Hero subtitle | `clamp(22px, 4vw, 52px)` |
| Section heading | `clamp(18px, 3vw, 32px)` |
| Body serif | `clamp(15px, 1.5vw, 18px)` |
| Padding lateral | `clamp(14px, 4vw, 52px)` |
| Gap entre secciones | `clamp(24px, 5vw, 80px)` |

### B. Grid `auto-fit` / `auto-fill` para listas

Reemplaza grids con columnas hardcodeadas y sus media queries asociadas.

```css
/* ❌ ANTES — columnas fijas + 2 media queries */
.cast-list { grid-template-columns: repeat(6, 96px); }
@media (max-width: 768px) { .cast-list { grid-template-columns: repeat(4, 96px); } }
@media (max-width: 480px) { .cast-list { grid-template-columns: repeat(3, 96px); } }

/* ✅ DESPUÉS — se adapta solo */
.castList {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 16px;
}
```

### C. Container Queries para componentes con contexto variable

Usar cuando un componente cambia de layout según el ancho de **su contenedor**,
no del viewport. Ideal para cards en sidebar vs. cards en feed principal.

```css
/* En el componente contenedor */
.movieCard {
  container-type: inline-size;
  container-name: movie-card;
}

/* En el sub-componente */
@container movie-card (max-width: 280px) {
  .cardTitle { font-size: 14px; }
  .cardMeta  { display: none; }
}
```

**Usar container queries para:** MovieCard, ReviewCard, CastItem, SidebarPanel  
**Usar media queries para:** layout de página completa, navbar, footer, hero

### D. `gap` en lugar de `margin` para separación entre hermanos

```css
/* ❌ ANTES — margin para separar hermanos en un flex/grid */
.action-btn + .action-btn { margin-left: 12px; }
.section { margin-top: 80px; }

/* ✅ DESPUÉS — gap en el contenedor */
.actionsRow { display: flex; gap: 12px; }
.mainContent { display: grid; gap: clamp(40px, 6vw, 80px); }
```

**El `margin` solo es válido para:**
- Separar un elemento de sí mismo respecto al flujo del documento (`margin-block`)
- El hero overlap (margen negativo intencional de diseño, documentar con comentario)
- Casos donde el elemento no tiene un contenedor flex/grid padre

### E. `padding` en el contenedor, no `margin` en el hijo

```css
/* ❌ ANTES — el hijo se posiciona a sí mismo */
.hero-content { margin-top: 120px; margin-left: 52px; }

/* ✅ DESPUÉS — el padre define el espacio interno */
.hero {
  padding-block-start: clamp(80px, 12vw, 140px);
  padding-inline: clamp(14px, 4vw, 52px);
}
.heroContent { /* sin margin */ }
```

---

## PASO 5 — MIGRACIÓN DE INLINE STYLES

### Regla: ningún `style={{ }}` estático en el JSX final

Los inline styles son aceptables **solo** cuando el valor viene de datos dinámicos:

```tsx
{/* ✅ Permitido — valor calculado en runtime */}
<div style={{ width: `${fillPercent}%` }} />
<div style={{ backgroundImage: `url(${posterUrl})` }} />

{/* ❌ Migrar a .module.css — valor estático */}
<div style={{ display: 'flex', gap: '12px' }} />
<div style={{ color: '#D4AF7A', fontFamily: 'Syne' }} />
```

### Proceso de migración inline → module

1. Identificar todos los `style={{ }}` en el `.tsx`
2. Separar: **estáticos** (migrar) vs **calculados** (mantener)
3. Para los estáticos: crear clase en `.module.css`, reemplazar en JSX
4. Para los calculados con valor parcialmente estático:

```tsx
{/* ❌ Mezcla — parte estática, parte dinámica */}
<div style={{ position: 'absolute', top: offset + 'px' }} />

{/* ✅ Separar con className + style */}
<div className={styles.posterAbs} style={{ top: offset }} />
```

```css
/* .module.css */
.posterAbs { position: absolute; } /* solo lo estático */
```

---

## PASO 6 — REGLAS DE `!important`

### Política: cero `!important` — sin excepciones

Los `!important` del CSS actual son síntoma de especificidad mal manejada
o de intentar forzar overrides que deberían ser estructura.
CSS Modules ya resuelve el problema de especificidad — no hay motivo para usarlos.

```css
/* ❌ ANTES — override forzado */
@media (max-width: 768px) {
  .md-hero-title { font-size: 36px !important; }
}

/* ✅ DESPUÉS — la clase del módulo ya tiene la especificidad correcta */
@media (max-width: 768px) {
  .heroTitle { font-size: clamp(32px, 8vw, 48px); }
}
```

Si durante la migración parece necesario un `!important`, es señal de que
la especificidad está mal — revisar la jerarquía de selectores antes de
ceder. **No hay excepciones.**

---

## PASO 7 — ESTRUCTURA DEL ARCHIVO FINAL

### Orden canónico dentro de un `.module.css`

```css
/* 1. TOKENS LOCALES DE LAYOUT (si los hay) */
.container {
  --_poster-width: 300px;
}

/* 2. COMPONENTE RAÍZ */
.container { ... }

/* 3. ELEMENTOS ATÓMICOS (en orden de aparición en el DOM) */
.header { ... }
.title { ... }
.body { ... }

/* 4. VARIANTES / ESTADOS (mismo elemento, distinto estado) */
.btnPrimary { ... }
.btnPrimary:hover { ... }
.btnPrimary:disabled { ... }

/* 5. CONTAINER QUERIES (si el componente es un contenedor) */
@container (max-width: 280px) { ... }

/* 6. MEDIA QUERIES — solo los cuatro breakpoints oficiales */
@media (max-width: 768px) { ... }
@media (max-width: 480px) { ... }
```

### Naming en CSS Modules

- Clases en **camelCase** (porque se usan como `styles.heroTitle` en JSX)
- Sin prefijos `md-` ni similares — el módulo ya da el scope
- Descriptivos del elemento, no del estilo: `.heroTitle` no `.largeBoldText`

```css
/* ❌ */
.md-hero-title { ... }
.large-bold-serif { ... }

/* ✅ */
.heroTitle { ... }
.heroSubtitle { ... }
```

---

## PASO 8 — RESTRICCIONES Y ZONAS PROTEGIDAS

### 🚫 No tocar — Composición visual intacta

Estas propiedades definen la identidad visual de CineVault y **no se modifican**
durante una migración CSS, aunque parezcan subóptimas:

| Elemento | Propiedad protegida | Razón |
|---|---|---|
| Hero backdrop | `min-height: 100vh`, gradiente radial | Composición de diseño aprobada |
| Quote section | `margin-top: -27vh` | Overlap intencional sobre el hero |
| Grain overlay | `position: fixed`, `z-index: 900`, SVG data URI | Efecto cinematográfico |
| Notice bar | `position: fixed; top: 72px` | Sincronizado con altura de navbar |
| Modal overlay | `backdrop-filter: blur(5px)` | Efecto de capa del sistema de modales |
| Sidebar sticky | `position: sticky; top: 80px` | Comportamiento de scroll intencional |
| `--cv-accent` y variantes | Ningún valor de color | Paleta "Oro Silencioso" — no negociar |

### ✅ Sí migrar — Problemas conocidos

| Problema actual | Técnica a aplicar |
|---|---|
| `margin-top: 120px` en hero-content | `padding-block-start` en `.hero` + `clamp()` |
| Media queries en `max-width: 410px` | Absorber en `max-width: 480px` + `clamp()` |
| Grid de cast con columnas fijas | `auto-fill, minmax(96px, 1fr)` |
| `!important` en overrides de mobile | Especificidad correcta + media query limpia |
| Tokens `--md-*` locales de color | Reemplazar por `--cv-*` equivalente |
| `gap: 0` + `margin` entre hermanos | `gap` en el contenedor |
| `width: 100% !important` en mobile | Flujo natural sin declaración |

---

## PASO 8B — ACCESIBILIDAD CSS (objetivo Lighthouse ≥92)

El score de Accessibility en Lighthouse lo controla principalmente el HTML
y el CSS. Esta sección cubre **solo lo que se puede resolver desde el CSS**
durante la migración — los problemas de HTML/ARIA se tratan en `refactor-cinevault`.

### Contraste de color — el ítem con más peso en Lighthouse

La paleta "Oro Silencioso" fue validada con WCAG en el proceso de diseño.
Sin embargo, al migrar, verificar que ninguna clase cambia el color de fondo
o texto de forma que rompa el contraste aprobado.

**Ratios mínimos obligatorios:**

| Par de colores | Ratio mínimo | Uso |
|---|---|---|
| `--cv-text` `#E2E2E2` sobre `--cv-bg` `#080808` | 17.2:1 ✅ | Texto principal |
| `--cv-accent` `#D4AF7A` sobre `--cv-bg` `#080808` | 7.4:1 ✅ | Labels, section headers |
| `--cv-text-soft` `#7A7A7A` sobre `--cv-bg` `#080808` | 4.6:1 ✅ | Texto secundario |
| `--cv-text-soft` `#7A7A7A` sobre `--cv-surface` `#111111` | 4.5:1 ✅ | Texto en tarjetas |
| `--cv-text-muted` `#3A3A3A` sobre `--cv-bg` `#080808` | 1.9:1 ❌ | **Solo decorativo** — nunca en texto de contenido |
| `--cv-accent-dim` `#9A7A48` sobre `--cv-bg` `#080808` | 3.1:1 ❌ | **Solo en bordes** — nunca como color de texto |

**Regla:** `--cv-text-muted` y `--cv-accent-dim` están prohibidos como `color`
en texto de contenido. Solo se usan en `border-color`, `background`, o
elementos puramente decorativos.

```css
/* ❌ Viola WCAG AA — ratio insuficiente */
.metaLabel { color: var(--cv-text-muted); }

/* ✅ Contraste correcto */
.metaLabel { color: var(--cv-text-soft); }
```

### Focus visible — puntos directos en Lighthouse

Todos los elementos interactivos deben tener un outline visible al recibir
focus por teclado. El reset de browsers modernos quita el outline por defecto.

```css
/* ❌ Elimina accesibilidad por teclado */
button { outline: none; }
a { outline: none; }

/* ✅ Quita el outline feo del browser y pone uno que respeta el diseño */
.actionBtn:focus-visible {
  outline: 2px solid var(--cv-accent);
  outline-offset: 3px;
}

/* Si se quiere quitar el outline en click (mouse), no en teclado */
.actionBtn:focus:not(:focus-visible) {
  outline: none;
}
```

**Regla global recomendada en el CSS base del proyecto:**
```css
/* En index.css o global.css — no en módulos */
:focus-visible {
  outline: 2px solid var(--cv-accent);
  outline-offset: 3px;
}
```

### Touch targets — mobile accessibility

Lighthouse penaliza elementos táctiles menores a 44×44px en mobile.
Ya está en los estilos de botones, pero verificar al migrar:

```css
/* ✅ Patrón establecido — mantener en todos los botones y links táctiles */
.actionBtn {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Casos que Lighthouse detecta y penaliza:**
- Botones de iconos (`X` de modal, flechas de navegación) que no aplican el min-height
- Links en listas muy juntos donde el área táctil se superpone

### Animaciones y movimiento reducido

Los usuarios con `prefers-reduced-motion` activo no deben recibir animaciones
que puedan causarles malestar. Lighthouse no penaliza esto directamente pero
sí lo hace la auditoría de Best Practices.

```css
/* ❌ ANTES — animación sin consideración de preferencia */
.grain {
  animation: grain 0.5s steps(2) infinite;
}

/* ✅ DESPUÉS — respeta la preferencia del sistema */
@media (prefers-reduced-motion: no-preference) {
  .grain {
    animation: grain 0.5s steps(2) infinite;
  }
}

/* Regla global para transiciones */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Notar:** Esta es la **única excepción documentada** donde se permite `!important`
— y solo en esta regla global de `prefers-reduced-motion`, no en CSS de componentes.

### Texto seleccionable

No usar `user-select: none` en texto de contenido. Solo en elementos UI
donde la selección es un problema de UX real (botones, labels de rating).

```css
/* ✅ Permitido — elemento puramente interactivo */
.starBtn { user-select: none; }

/* ❌ Prohibido — texto de contenido */
.movieDescription { user-select: none; }
.reviewText { user-select: none; }
```

### Color como único indicador

No comunicar información solo con color — Lighthouse lo detecta en su auditoría.

```css
/* ❌ Solo color diferencia activo de inactivo */
.tabBtn          { color: var(--cv-text-soft); }
.tabBtn--active  { color: var(--cv-accent); }

/* ✅ Color + indicador visual adicional */
.tabBtn          { color: var(--cv-text-soft); border-bottom: 2px solid transparent; }
.tabBtnActive    { color: var(--cv-accent);    border-bottom: 2px solid var(--cv-accent); }
```

---

### Breakpoints a verificar obligatoriamente

Abrir la preview de Vercel y chequear en este orden:

```
375px  — iPhone SE / mobile mínimo soportado
430px  — iPhone 16 Pro / mobile estándar
768px  — iPad portrait / tablet
1024px — iPad landscape / portátil pequeño
1280px — breakpoint desktop oficial
1440px — desktop estándar de diseño
```

### Checklist visual por breakpoint

Para cada uno de los 6 breakpoints anteriores:

- [ ] El texto no se desborda ni se corta
- [ ] Las imágenes mantienen su aspect-ratio
- [ ] Los botones tienen mínimo 44px de alto (touch target)
- [ ] No hay scroll horizontal indeseado
- [ ] La composición del hero (backdrop + texto + poster) es correcta
- [ ] El quote overlap sobre el hero se ve limpio
- [ ] El navbar tiene la altura correcta (`56px` mobile / `64px` desktop)
- [ ] Los modales se cierran y el scroll del body queda bloqueado
- [ ] Los elementos interactivos muestran outline al navegar con Tab

### Auditoría Lighthouse — objetivo ≥92 en Accessibility

Correr Lighthouse **en la preview de Vercel** (no en localhost) después de
cada migración de componente importante.

```
Chrome DevTools → Lighthouse → Categories: Accessibility + Best Practices
Mode: Navigation → Device: Mobile (más estricto que Desktop)
```

**Score objetivo:**

| Categoría | Mínimo aceptable | Objetivo |
|---|---|---|
| Accessibility | 92 | 95+ |
| Best Practices | 92 | 95+ |
| Performance | — | Se controla en `.tsx` — fuera del scope de esta skill |
| SEO | — | Se controla con meta tags y estructura HTML |

**Ítems de Accessibility que el CSS puede romper o mejorar:**

| Ítem Lighthouse | CSS responsable | Fix |
|---|---|---|
| "Background and foreground colors do not have sufficient contrast ratio" | Color de texto sobre fondo | Usar solo pares validados del mapa de tokens |
| "Interactive controls — focus not visible" | Falta de `:focus-visible` | Agregar outline en todos los elementos interactivos |
| "Touch targets do not have sufficient size or spacing" | `min-height` / `min-width` < 44px | Aplicar patrón de touch target en todos los botones |
| "Avoid large layout shifts" | Imágenes sin dimensiones reservadas | Definir `aspect-ratio` en contenedores de imagen |
| "Content is not sized correctly for the viewport" | Overflow horizontal | Verificar que ningún elemento rompe el ancho del viewport |

**Flujo si el score cae de 92:**
1. Expandir los ítems fallidos en el reporte
2. Separar responsabilidades: CSS vs HTML/JS
3. CSS → corregir en el `.module.css` afectado → volver a correr Lighthouse
4. HTML/JS → crear issue separado para `refactor-cinevault`

### Herramientas

```bash
# Siempre auditar sobre build de producción
npm run build

# Verificar tipos
npx tsc --noEmit

# Lint
npm run lint
```

### Test de regresión visual — método diff

1. Antes de migrar: capturar screenshot en 375px y 1440px
2. Después de migrar: capturar los mismos puntos
3. Comparar manualmente o con una herramienta de diff de imágenes
4. Documentar en el PR con tabla Antes/Después

---

## PASO 10 — CHECKLIST FINAL DE MIGRACIÓN

### Tokens
- [ ] Cero tokens `--md-*` o locales de color en el CSS migrado
- [ ] Todo color es `var(--cv-*)` — sin hex directo
- [ ] Tipografía usa `var(--cv-font-serif)` y `var(--cv-font-sans)`

### Layout
- [ ] Cero `!important` — sin excepciones (salvo la regla global de `prefers-reduced-motion`)
- [ ] Espaciado entre hermanos usa `gap`, no `margin`
- [ ] El padding lateral usa `clamp(14px, 4vw, 52px)` o equivalente
- [ ] Grids de listas usan `auto-fill/auto-fit, minmax(...)` donde aplica
- [ ] Listas horizontales en mobile usan `overflow-x: auto` + `scrollbar-width: none`
- [ ] Solo se usaron los 4 breakpoints oficiales

### Inline Styles
- [ ] Cero `style={{ }}` estáticos en el JSX
- [ ] Los `style={{ }}` restantes son 100% calculados en runtime
- [ ] Los mixtos (parte estática + dinámica) usan `className` + `style` separados

### Accesibilidad CSS (Lighthouse ≥92)
- [ ] Todos los pares color/fondo usan tokens del mapa de contraste validado
- [ ] `--cv-text-muted` y `--cv-accent-dim` no se usan como `color` en texto de contenido
- [ ] Todos los elementos interactivos tienen `:focus-visible` con outline dorado
- [ ] Todos los botones e iconos táctiles tienen `min-height: 44px` y `min-width: 44px`
- [ ] No hay `user-select: none` en texto de contenido
- [ ] Animaciones tienen `@media (prefers-reduced-motion: no-preference)` donde aplica
- [ ] No se usa color como único indicador de estado (activo/inactivo, error/ok)
- [ ] Contenedores de imagen tienen `aspect-ratio` definido para evitar layout shifts
- [ ] Score Lighthouse Accessibility en preview de Vercel: ≥92

### Estructura del archivo
- [ ] El `.module.css` sigue el orden canónico (tokens → raíz → elementos → variantes → container queries → media queries)
- [ ] Clases en camelCase — sin prefijos `md-` ni kebab-case
- [ ] Sin clases sin usar (dead code eliminado)
- [ ] Zonas protegidas intactas (hero overlap, grain, modales)

### Build
- [ ] `npm run build` — exitoso
- [ ] `npx tsc --noEmit` — 0 errores
- [ ] Preview URL en Vercel — sin errores de consola
- [ ] Visual verificado en los 6 breakpoints obligatorios

---

## Template de PR — Migración CSS

```markdown
## CSS Migration: [NombreArchivo.css → NombreArchivo.module.css]

### Problema
[Describir los problemas concretos: N !important, M media queries, tokens locales, etc.]

### Técnicas aplicadas
- `clamp()` para: [listar qué propiedades]
- `auto-fill/minmax` para: [listar qué grids]
- Container queries para: [listar qué componentes, o N/A]
- Logical properties para: [listar casos, o N/A]
- `gap` reemplazando `margin` en: [listar casos]

### Media queries eliminadas
De [N] queries originales → [M] queries en el resultado final.
Breakpoints usados: [listar solo los 4 oficiales que se usaron]

### Accesibilidad
- Contraste verificado contra mapa de tokens validado: ✅
- `:focus-visible` aplicado en todos los elementos interactivos: ✅
- Touch targets ≥44px en mobile: ✅
- `prefers-reduced-motion` cubierto: ✅ / N/A
- Score Lighthouse Accessibility en preview: [N]/100

### Zonas protegidas — sin cambios
- Hero backdrop y composición visual: ✅ intacta
- Quote overlap (-27vh): ✅ intacto
- Grain overlay: ✅ intacto
- Tokens --cv-*: ✅ sin modificar valores

### Screenshots
| 375px Antes | 375px Después |
|---|---|
| [img] | [img] |

| 1440px Antes | 1440px Después |
|---|---|
| [img] | [img] |

### Checklist
- [ ] 0 `!important`
- [ ] 0 tokens `--md-*` o hex directo
- [ ] 0 `style={{ }}` estáticos en JSX
- [ ] Solo 4 breakpoints oficiales
- [ ] Lighthouse Accessibility ≥92 en preview de Vercel
- [ ] `npm run build` ✅
- [ ] Visual verificado en 375px / 768px / 1024px / 1440px
- [ ] Preview URL: [URL]
```

---

## Integración con `refactor-cinevault`

Esta skill es la **Fase 6** del flujo de `refactor-cinevault`.
Cuando el diagnóstico de la skill principal detecta problemas de CSS,
el punto de handoff es:

```
refactor-cinevault: Fase 5 completa (componente descompuesto, hooks extraídos)
         ↓
css-migration-cinevault
  ├── Paso 1:  Auditoría CSS + accesibilidad baseline
  ├── Paso 2:  Tokens → migrar --md-* a --cv-*
  ├── Paso 3:  Estrategia responsive → 4 breakpoints oficiales
  ├── Paso 4:  Layout moderno → clamp, auto-fit, container queries, gap
  ├── Paso 5:  Inline styles → migrar estáticos, separar dinámicos
  ├── Paso 6:  !important → cero, sin excepciones
  ├── Paso 7:  Estructura del .module.css → orden canónico
  ├── Paso 8:  Zonas protegidas → composición visual intacta
  ├── Paso 8B: Accesibilidad CSS → contraste, focus, touch targets, motion
  └── Paso 9:  Testing → 6 breakpoints + Lighthouse ≥92 en Vercel preview
         ↓
refactor-cinevault: Paso 10 (checklist final) → PR
```

**La Fase 6 de `refactor-cinevault` debe incluir explícitamente:**
```
### Fase 6 — Migración CSS ⚠️ STOP → PR borrador para Jo
Seguir skill `css-migration-cinevault` completa.
Al finalizar: score Lighthouse Accessibility ≥92 en preview de Vercel.
Commit: git commit -m "style(<nombre>): migrar a CSS Modules, Lighthouse ≥92"
```

La migración CSS **no bloquea** el refactor funcional — pueden ocurrir en ramas
paralelas si el riesgo de conflictos es bajo. Si corren en paralelo, mergear
primero la rama de CSS antes de mergear la rama funcional para evitar conflictos
en los archivos `.tsx`.
