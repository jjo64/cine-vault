# CineVault — Responsive Mobile Final

> **Para Copilot / Antigravity:** Lee este plan completo antes de tocar código.
> Responde en **español**. Código en **inglés**.
> Ejecuta tarea por tarea y confirma antes de pasar a la siguiente.
> Al terminar ejecuta el script de Playwright de la Tarea 12.

**Goal:** Hacer toda la app CineVault completamente responsive en mobile (375px–480px) conservando 100% del contenido, todas las animaciones existentes (motion/react, Typewriter, parallax, whileInView), y la identidad visual "Oro Silencioso".

**Architecture:**
- Mobile-first: CSS nativo con media queries. Cero `useMediaQuery` / `window.innerWidth` nuevos.
- La excepción es `HomeLogged.tsx` que ya usa `isMobile` — se respeta y se completa donde falta.
- Bottom navigation bar nueva (4 ítems fijos abajo) para todas las páginas autenticadas.
- Ningún contenido se elimina: todo lo visible en desktop existe en mobile, adaptado.
- Las animaciones de `motion/react` (`initial`, `animate`, `whileInView`, `transition`) NO se tocan. Solo se ajustan layouts, paddings y grids.

**Tech Stack:** React + Vite + TypeScript + Tailwind CSS + CSS por página + motion/react (framer-motion) + lucide-react

**Tokens disponibles en `src/styles/tokens.css`:**
```css
--nav-height: 64px
--nav-height-mobile: 56px
--page-padding-x: clamp(14px, 4vw, 52px)
--page-padding-x-sm: clamp(14px, 3vw, 24px)
--touch-target: 44px
--color-bg: #080808
--color-surface: #111111
--color-elevated: #1A1A1A
--color-border: #252525
--color-accent: #D4AF7A
--color-accent-dim: #9A7A48
--color-text: #E2E2E2
--color-text-soft: #7A7A7A
--font-serif: 'Cormorant Garamond', serif
--font-sans: 'Syne', sans-serif
```

---

## REGLAS ABSOLUTAS — leer antes de cualquier tarea

1. **NO eliminar animaciones.** Todos los `motion.div`, `initial`, `animate`, `whileInView`, `transition`, el componente `Typewriter`, el parallax `useScroll/useTransform` del hero de Landing — se preservan tal cual.
2. **NO eliminar contenido.** Si algo no cabe en mobile, se adapta (scroll horizontal, grid 1 col, font más pequeño) — nunca se oculta con `display:none` salvo que el diseño explícitamente lo pida (p.ej. el poster desktop en md-hero ya está `display:none` en mobile por CSS existente — eso es correcto).
3. **NO añadir `useMediaQuery` ni `window.innerWidth`.** El `isMobile` ya existente en `HomeLogged.tsx` es la única excepción.
4. **CSS mobile-first:** escribir el bloque `@media (max-width: 768px)` al final del archivo CSS correspondiente, agrupado, sin duplicar propiedades que ya existen.
5. **Touch targets:** botones y links de navegación deben tener mínimo `44px` de altura/ancho.
6. **Scroll horizontal controlado:** listas de posters, cast, watchlist, filtros — `overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch`.

---

## TAREA 1 — Bottom Navigation Bar (componente nuevo)

**Archivos:**
- Crear: `src/components/BottomNav.tsx`
- Crear: `src/components/BottomNav.css`
- Modificar: `src/App.tsx` (añadir el componente dentro del layout autenticado)

**Problema:** En mobile no hay navegación principal accesible. El hamburger del top navbar existe pero no es suficiente para una app con múltiples secciones.

**Paso 1 — Crear `src/components/BottomNav.css`:**

```css
/* BottomNav.css */
.bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: rgba(8, 8, 8, 0.97);
    border-top: 1px solid var(--color-border);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 300;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
}

.bottom-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 0;
  color: #3A3A3A;
  text-decoration: none;
  font-family: var(--font-sans);
  font-size: 8px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  min-height: var(--touch-target);
}

.bottom-nav__item.active {
  color: var(--color-accent);
}

.bottom-nav__item:hover {
  color: var(--color-text-soft);
}

.bottom-nav__icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-nav__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-accent);
  margin-top: 1px;
}

/* Spacer para que el contenido no quede detrás del bottom nav */
.bottom-nav-spacer {
  display: none;
}

@media (max-width: 768px) {
  .bottom-nav-spacer {
    display: block;
    height: calc(60px + env(safe-area-inset-bottom, 0px));
    flex-shrink: 0;
  }
}
```

**Paso 2 — Crear `src/components/BottomNav.tsx`:**

```tsx
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Film, User } from 'lucide-react'
import './BottomNav.css'

const ITEMS = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/search', icon: Search, label: 'Buscar' },
  { to: '/feed', icon: Film, label: 'Feed' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

export function BottomNav() {
  const { pathname } = useLocation()

  const isActive = (to: string) => {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {ITEMS.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className={`bottom-nav__item ${isActive(to) ? 'active' : ''}`}
          aria-label={label}
        >
          <div className="bottom-nav__icon">
            <Icon size={18} strokeWidth={isActive(to) ? 2 : 1.5} />
          </div>
          {label}
          {isActive(to) && <div className="bottom-nav__dot" />}
        </Link>
      ))}
    </nav>
  )
}
```

**Paso 3 — Añadir en `src/App.tsx`:**

Importar `BottomNav` y `BottomNav.css`. Añadir `<BottomNav />` justo antes del `</div>` del wrapper principal (fuera del `<Routes>`). Añadir también un `<div className="bottom-nav-spacer" />` al final de cada página que tenga scroll — o directamente añadirlo global en el wrapper.

La forma más limpia: en el layout wrapper de `App.tsx`, añadir al final:
```tsx
<BottomNav />
<div className="bottom-nav-spacer" />
```

**Verificación:** En 375px aparece la barra de 4 ítems fija abajo. El ítem activo tiene color dorado y punto. El contenido de página no queda tapado.

**Commit:**
```bash
git add src/components/BottomNav.tsx src/components/BottomNav.css src/App.tsx
git commit -m "feat(responsive): añadir bottom navigation bar para mobile"
```

---

## TAREA 2 — Landing: secciones pendientes mobile

**Archivos:**
- Modificar: `src/components/Landing.css`

**Contexto:** `Landing.css` ya tiene breakpoints para navbar, hero, footer y grids principales. Lo que falta son las secciones intermedias.

**Paso 1 — Verificar qué ya existe** buscando en `Landing.css` si hay breakpoints para:
- `.landing-grid-night` (NightFeature — dos columnas)
- `.landing-grid-3` (Pillars, Reviews — tres columnas)
- `MovieGridSection` inner grid (`auto-fill minmax(130px, 1fr)`)

**Paso 2 — Añadir al final de `Landing.css` solo lo que falte:**

```css
/* ── Landing Mobile: secciones intermedias ── */

/* MovieGridSection: grid de películas → 3 cols en mobile */
@media (max-width: 768px) {
  .landing-section-sm {
    padding: 28px 14px;
  }

  .landing-section {
    padding: 36px 14px;
  }

  .landing-section-lg {
    padding: 44px 14px;
  }
}

/* InfiniteSlider wrapper — prevenir overflow */
@media (max-width: 768px) {
  .landing-section-sm > div {
    overflow: hidden;
  }
}

/* NightFeature: dos columnas → columna */
/* (ya existe .landing-grid-night en 768px, verificar — si no existe añadir:) */
@media (max-width: 768px) {
  .landing-grid-night {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .landing-grid-night .night-stat-pill {
    bottom: 8px;
    right: 8px;
  }
}

/* HowItWorks / Reviews: tres columnas → una columna */
/* (ya existe .landing-grid-3 en 768px → 1 col, verificar) */

/* FinalCTA props row → columna */
@media (max-width: 768px) {
  .landing-final-cta-wrap {
    width: 100%;
  }

  .landing-final-cta-btn {
    width: 100%;
    max-width: 100%;
    justify-content: center;
  }
}

/* Footer grid → 2 cols en 768, 1 col en 480 */
@media (max-width: 768px) {
  .landing-footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }

  .landing-footer-grid > div:first-child {
    grid-column: 1 / -1;
  }
}
/* (480px ya existe en el CSS — verificar que tiene 1fr) */
```

**Nota crítica — animaciones:** NO tocar nada relacionado con:
- `<Typewriter>` component: efecto máquina de escribir en el hero (`texts={['resenas.', 'obsesiones.', 'rituales.', 'descubrimientos.', 'opiniones.']}`) — es CSS animation pura, no tiene nada de responsive, no se toca.
- `motion.div` con `useScroll/useTransform` en el hero parallax — no se toca.
- `whileInView={{ opacity: 1, y: 0 }}` en todos los pillar cards, movie cards, reviews — no se toca.
- El navbar `motion.nav` con `initial={{ opacity: 0, y: -12 }}` — no se toca.

**Commit:**
```bash
git add src/components/Landing.css
git commit -m "feat(responsive): Landing secciones intermedias adaptadas a mobile"
```

---

## TAREA 3 — HomeLogged: reemplazar `isMobile` por CSS classes

**Archivos:**
- Modificar: `src/components/HomeLogged.tsx`
- Crear: `src/components/HomeLogged.css`

**Problema:** `HomeLogged.tsx` usa `isMobile` (via `useMediaQuery`) en 38 lugares con inline ternarios. Esto es funcional pero es JS-based responsive. El plan es migrar los layouts críticos a clases CSS, manteniendo el `isMobile` solo donde sea imprescindible (condicionales de visibilidad como `!isMobile && <ComponenteEntero />`).

**Paso 1 — Crear `src/components/HomeLogged.css`:**

```css
/* HomeLogged.css */

/* Tonight card */
.hl-tonight-inner {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 28px;
  align-items: start;
}

.hl-tonight-poster {
  aspect-ratio: 2/3;
  border-radius: 1px;
  overflow: hidden;
  border: 1.5px solid var(--color-accent-dim);
}

.hl-tonight-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Activity entries (diario, watchlist en home) */
.hl-activity-row {
  display: grid;
  grid-template-columns: 36px 48px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border);
}

.hl-activity-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-accent-dim);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Feed rápido post */
.hl-feed-post {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid var(--color-border);
  align-items: start;
}

.hl-feed-poster {
  width: 52px;
  height: 78px;
}

.hl-feed-header {
  display: flex;
  gap: 7px;
  align-items: center;
  margin-bottom: 6px;
  flex-wrap: nowrap;
}

/* Vault grid */
.hl-vault-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* Diario + Listas two-col */
.hl-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

/* Zona selector (3 cols desktop) */
.hl-zones {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  height: 170px;
  border-bottom: 1px solid var(--color-border);
}

/* Estadísticas 4 cols */
.hl-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

/* Logros 6 cols */
.hl-achievements-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .hl-tonight-inner {
    grid-template-columns: 100px 1fr;
    gap: 16px;
    align-items: center;
    text-align: left;
  }

  .hl-tonight-actions {
    display: none; /* el aside desktop se oculta; el botón CTA va inline */
  }

  .hl-activity-row {
    grid-template-columns: 32px 1fr auto;
    gap: 10px;
  }

  .hl-activity-avatar {
    width: 28px;
    height: 28px;
  }

  .hl-feed-post {
    grid-template-columns: 40px 1fr auto;
    gap: 12px;
  }

  .hl-feed-poster {
    width: 40px;
    height: 60px;
  }

  .hl-feed-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
  }

  .hl-vault-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .hl-two-col {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .hl-zones {
    grid-template-columns: 1fr;
    height: auto;
  }

  .hl-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hl-achievements-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .hl-stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
}
```

**Paso 2 — En `HomeLogged.tsx`:**

1. Añadir `import './HomeLogged.css'` al inicio.
2. En los elementos que correspondan, reemplazar el `style={{ display: 'grid', gridTemplateColumns: isMobile ? 'X' : 'Y' }}` por `className="hl-XXX"` con el className correspondiente. El `style` puede quedar para propiedades que no son de grid/layout (colores, gaps de texto, etc.).
3. Los `!isMobile && <ComponenteCompleto />` (renderizado condicional de componentes enteros) se pueden dejar como están — eso es lógica de negocio, no layout CSS.

**Prioridad de migración** (por impacto visual en mobile):
- `gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)'` → `className="hl-vault-grid"`
- `gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'` → `className="hl-two-col"`
- `gridTemplateColumns: isMobile ? '32px 1fr auto' : '36px 48px 1fr auto'` en activity rows → `className="hl-activity-row"`
- `gridTemplateColumns: isMobile ? '40px 1fr auto' : '52px 1fr auto'` en feed posts → `className="hl-feed-post"`
- La zona selector `gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr'` → `className="hl-zones"`

**Nota:** No es necesario migrar el 100% de los `isMobile` en un solo commit. Priorizar los que causan overflow o quiebre visual. Los ternarios de `fontSize` o `padding` menores son aceptables dejándolos como están.

**Commit:**
```bash
git add src/components/HomeLogged.tsx src/components/HomeLogged.css
git commit -m "feat(responsive): HomeLogged CSS classes para layouts críticos mobile"
```

---

## TAREA 4 — MovieDetail: poster mobile + sidebar como acordeón

**Archivos:**
- Modificar: `src/pages/MovieDetail.css`
- Modificar: `src/pages/MovieDetail.tsx`

**Problema A:** El poster desktop ya está `display:none` en mobile (correcto). En mobile el hero queda como un banner de solo texto. El mockup aprobado muestra el poster pequeño a la derecha del texto hero. Hay que activarlo en mobile con dimensiones reducidas.

**Paso 1 — En `MovieDetail.css`, localizar el bloque `@media (max-width: 768px)` que tiene `.md-hero-poster { display: none !important; }` y cambiarlo:**

```css
@media (max-width: 768px) {
  .md-hero-poster {
    /* Reactivar en mobile con tamaño pequeño */
    display: block !important;
    right: 12px;
    width: 80px; /* más pequeño que desktop */
    top: auto;
    bottom: 20px;
    transform: none;
  }
}

@media (max-width: 480px) {
  .md-hero-poster {
    width: 68px;
  }
}
```

**Problema B:** El sidebar (Ficha técnica + Géneros + Dónde ver + Similares) en mobile queda debajo del contenido principal en una sola columna, lo que hace la página muy larga. Hay que convertirlo en secciones inline que aparecen naturalmente entre las secciones de contenido en mobile.

**Paso 2 — En `MovieDetail.css`, añadir:**

```css
/* Sidebar en mobile: se muestra inline, no en columna aparte */
@media (max-width: 1024px) {
  .md-main-layout {
    display: flex;
    flex-direction: column;
  }

  /* El sidebar pasa a ser inline y su sticky se desactiva */
  .md-sidebar-sticky {
    position: static;
    top: auto;
  }
}

/* Sidebar panels: padding reducido en mobile */
@media (max-width: 768px) {
  .md-sidebar-panel {
    padding: 16px;
    margin-bottom: 8px;
  }

  .md-sidebar-row {
    gap: 8px;
  }

  /* Grid de similares: 3 cols en mobile */
  .md-sidebar-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 8px !important;
  }
}
```

**Commit:**
```bash
git add src/pages/MovieDetail.css src/pages/MovieDetail.tsx
git commit -m "feat(responsive): MovieDetail poster visible en mobile y sidebar inline"
```

---

## TAREA 5 — Profile: hero mobile completo + tabs sticky

**Archivos:**
- Modificar: `src/components/profile-v2/Profile.css`

**Contexto:** El hero ya tiene breakpoints en 768px. Lo que falta es asegurar que las action buttons (Seguir / Compartir) sean tapeables, que los stats no se compriman, y que la tabs bar sea sticky al hacer scroll.

**Paso 1 — Verificar que en `Profile.css` existe lo siguiente; añadir solo lo que falte:**

```css
/* Action buttons en hero */
@media (max-width: 768px) {
  .profile-hero-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .profile-hero-follow-btn {
    flex: 1;
    min-height: var(--touch-target);
    justify-content: center;
  }

  .profile-hero-share-btn {
    min-width: var(--touch-target);
    min-height: var(--touch-target);
  }

  /* Tabs bar sticky con top correcto en mobile */
  .profile-tabs-bar {
    position: sticky;
    top: var(--nav-height-mobile, 56px);
    z-index: 50;
    background: var(--color-bg);
  }

  /* Paneles: padding lateral reducido */
  .profile-main-wrapper {
    padding: 16px 14px 0;
  }
}

/* Poster grid del resumen: 3 columnas en mobile */
@media (max-width: 768px) {
  .profile-poster-grid,
  .profile-grid-6 {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 2px !important;
  }
}

/* Diary timeline: columnas más estrechas */
@media (max-width: 768px) {
  /* El timeline usa grid 148px 1fr — en mobile reducir la col de fecha */
  [style*="gridTemplateColumns: '148px 1fr'"] {
    /* No se puede sobreescribir inline styles con CSS — ver nota abajo */
  }
}
```

**Nota sobre el DiaryPanel:** El timeline usa `style={{ display: 'grid', gridTemplateColumns: '148px 1fr' }}` inline, que CSS no puede sobreescribir. Añadir `className="profile-diary-row"` a esos divs en `src/components/profile-v2/panels.tsx` y luego:

```css
@media (max-width: 768px) {
  .profile-diary-row {
    grid-template-columns: 70px 1fr !important;
  }

  .profile-diary-timeline-line {
    left: 62px !important; /* ajustar la línea vertical */
  }

  .profile-diary-dot {
    left: 56px !important;
  }
}
```

**Commit:**
```bash
git add src/components/profile-v2/Profile.css src/components/profile-v2/panels.tsx
git commit -m "feat(responsive): Profile tabs sticky, diary timeline mobile y poster grid"
```

---

## TAREA 6 — PersonPage: content-wrap padding override

**Archivos:**
- Modificar: `src/pages/PersonPage.tsx`

**Problema:** El div `.person-page-content-wrap` tiene `style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 52px 0' }}` inline. El CSS tiene `!important` override en mobile, pero el padding lateral de `52px` en desktop es excesivo para pantallas de 375px.

**Paso 1 — En `PersonPage.tsx`, localizar:**
```tsx
<div className="person-page-content-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 52px 0' }}>
```

**Reemplazar por:**
```tsx
<div className="person-page-content-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(28px, 6vw, 64px) clamp(14px, 5vw, 52px) 0' }}>
```

Esto hace que el padding escale fluidamente con el viewport sin necesitar media query. En 375px queda `28px 14px 0`, en 1280px queda `64px 52px 0`.

**Paso 2 — Misma técnica para el hero content:**

Localizar `style={{ position: 'relative', zIndex: 3, maxWidth: 700, padding: '0 52px 56px', ...}}` en el hero y cambiar a `padding: '0 clamp(16px, 5vw, 52px) clamp(32px, 5vw, 56px)'`.

**Verificación:** En 375px el texto no toca los bordes ni tiene padding excesivo.

**Commit:**
```bash
git add src/pages/PersonPage.tsx
git commit -m "feat(responsive): PersonPage paddings fluidos con clamp() en hero y content-wrap"
```

---

## TAREA 7 — SearchResults: panel de filtros como drawer mobile

**Archivos:**
- Modificar: `src/pages/SearchResults.tsx`
- Modificar: `src/pages/SearchResults.css`

**Problema:** En desktop el panel de filtros (`FiltersPanel`) es una columna de 240px a la izquierda de los resultados. En mobile ese layout es imposible. Hay que convertirlo en un drawer (panel deslizante desde abajo) activado por un botón "Filtros".

**Paso 1 — En `SearchResults.css`, añadir al final:**

```css
/* ── Filters drawer mobile ── */
.search-filters-drawer-backdrop {
  display: none;
}

.search-filters-drawer {
  /* Desktop: columna lateral */
}

@media (max-width: 768px) {
  /* Ocultar panel lateral */
  .search-filters-sidebar {
    display: none !important;
  }

  /* Botón para abrir filtros */
  .search-filters-mobile-btn {
    display: inline-flex !important;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-soft);
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    min-height: var(--touch-target);
  }

  .search-filters-mobile-btn.has-filters {
    border-color: var(--color-accent-dim);
    color: var(--color-accent);
    background: var(--color-accent-glow);
  }

  /* Drawer backdrop */
  .search-filters-drawer-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 400;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s;
  }

  .search-filters-drawer-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }

  /* Drawer panel */
  .search-filters-drawer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 85vh;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    border-radius: 16px 16px 0 0;
    z-index: 401;
    overflow-y: auto;
    padding: 20px 16px 32px;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .search-filters-drawer.open {
    transform: translateY(0);
  }

  /* Handle visual */
  .search-filters-drawer-handle {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--color-border);
    margin: 0 auto 16px;
  }

  /* El layout de resultados ocupa ancho completo */
  .search-results-layout {
    display: block !important;
    width: 100%;
  }

  .search-results-main {
    padding-top: 80px;
    padding-left: 14px;
    padding-right: 14px;
  }
}

.search-filters-mobile-btn {
  display: none; /* oculto en desktop */
}
```

**Paso 2 — En `SearchResults.tsx`:**

1. Añadir estado `const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false)`.
2. Al `FiltersPanel` existente darle `className="search-filters-sidebar"` en el wrapper.
3. Añadir el botón mobile justo encima de los resultados (en la barra de tabs):
```tsx
<button
  className={`search-filters-mobile-btn ${activeCount > 0 ? 'has-filters' : ''}`}
  onClick={() => setFiltersDrawerOpen(true)}
>
  <SlidersHorizontal size={12} />
  Filtros {activeCount > 0 && `(${activeCount})`}
</button>
```
4. Añadir el drawer al final del JSX (antes del `</div>` principal):
```tsx
<div
  className={`search-filters-drawer-backdrop ${filtersDrawerOpen ? 'open' : ''}`}
  onClick={() => setFiltersDrawerOpen(false)}
/>
<div className={`search-filters-drawer ${filtersDrawerOpen ? 'open' : ''}`}>
  <div className="search-filters-drawer-handle" />
  <FiltersPanel filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} />
</div>
```

**Verificación:** En 375px — botón "Filtros" visible junto a los tabs. Al tocar, sube un panel desde abajo con todos los filtros. Al tocar fuera o aplicar filtros, el panel se cierra.

**Commit:**
```bash
git add src/pages/SearchResults.tsx src/pages/SearchResults.css
git commit -m "feat(responsive): SearchResults filtros como drawer mobile"
```

---

## TAREA 8 — TVDetail y Diary: breakpoints faltantes

**Archivos:**
- Modificar: `src/pages/TVDetail.css`
- Modificar: `src/pages/Diary.css`
- Modificar: `src/pages/Diary.tsx`

### TVDetail

**Paso 1 — Verificar en `TVDetail.css` que existe el bloque mobile (ya existe según auditoría). Añadir solo lo que falte:**

```css
/* Si no existen estos estilos, añadirlos */
@media (max-width: 768px) {
  /* Episode grid: 1 col en mobile */
  .tv-episodes-grid {
    grid-template-columns: 1fr !important;
  }

  /* Cast grid: 2 cols */
  .tv-cast-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  /* Padding del hero */
  .tv-hero {
    padding: 20px 14px;
    min-height: 260px;
  }

  /* Navbar del TVDetail */
  .tv-nav-links {
    display: none;
  }
}
```

### Diary

El `Diary.css` ya tiene breakpoints básicos. El problema es que la página `Diary.tsx` tiene su propio navbar interno con inline styles.

**Paso 2 — En `Diary.tsx` localizar el navbar interno** (el `<nav>` sticky con padding inline) y añadir clases:
- `className="diary-navbar"` al `<nav>` (ya existe en `Diary.css`)
- Verificar que el padding `0 48px` del navbar tiene override en mobile a `0 14px`

**Commit:**
```bash
git add src/pages/TVDetail.css src/pages/Diary.css src/pages/Diary.tsx
git commit -m "feat(responsive): TVDetail y Diary breakpoints mobile completados"
```

---

## TAREA 9 — Settings, Lists, Vault, Activity: padding y grids

**Archivos:**
- `src/pages/Settings.css` (ya tiene breakpoints — verificar contenido interior)
- `src/pages/Lists.css` (ya tiene breakpoints — verificar)
- `src/pages/Vault.css` (ya tiene breakpoints — verificar)
- `src/pages/Activity.tsx` + crear `src/pages/Activity.css`

**Paso 1 — Settings:** Verificar que los form groups son `1fr` en mobile. Añadir si falta:
```css
@media (max-width: 768px) {
  .settings-main {
    padding: 80px 14px 100px;
  }
  /* Tabs: scroll horizontal */
  .settings-tabs {
    overflow-x: auto;
    scrollbar-width: none;
    flex-wrap: nowrap;
  }
  /* Inputs: ancho completo */
  .settings-input, input[type="text"], input[type="email"], textarea {
    width: 100%;
  }
}
```

**Paso 2 — Lists:** Verificar grid de listas responsive. Si el grid usa `repeat(auto-fill, minmax(300px, 1fr))`, en 375px quedará 1 sola columna automáticamente — verificar que funciona.

**Paso 3 — Vault:** Ya tiene breakpoints. Verificar que el masonry (`react-responsive-masonry`) tiene el prop `columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 4 }}`. Si no lo tiene, añadirlo en `Vault.tsx`.

**Paso 4 — Activity.tsx:** Crear `src/pages/Activity.css` con:
```css
/* Activity.css */
.activity-page {
  min-height: 100vh;
  padding-top: var(--nav-height);
}

.activity-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 48px var(--page-padding-x) 80px;
}

@media (max-width: 768px) {
  .activity-page {
    padding-top: var(--nav-height-mobile);
  }

  .activity-main {
    padding: 28px 14px 80px;
  }
}
```
Importar en `Activity.tsx` si no está importado.

**Commit:**
```bash
git add src/pages/Settings.css src/pages/Lists.css src/pages/Vault.tsx src/pages/Activity.css src/pages/Activity.tsx
git commit -m "feat(responsive): Settings, Lists, Vault y Activity ajustes mobile"
```

---

## TAREA 10 — Global: antioverflow, touch targets, safe areas

**Archivos:**
- Modificar: `src/index.css`

**Paso 1 — Verificar que `index.css` tiene este bloque (ya existe según auditoría). Si le falta algo, añadirlo:**

```css
/* ── Global mobile fixes ── */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}

/* Safe area para notch/Dynamic Island */
@supports (padding: max(0px)) {
  .nav, .user-navbar, .profile-nav {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
}

/* Touch targets mínimos — SOLO para elementos interactivos de nav,
   NO para badges, pills, labels inline */
@media (max-width: 768px) {
  .m-nav-icon,
  .nav-hamburger,
  .user-navbar__hamburger,
  .user-navbar__notification-btn {
    min-width: var(--touch-target, 44px);
    min-height: var(--touch-target, 44px);
  }

  /* Evitar que imágenes rompan el layout */
  img {
    max-width: 100%;
  }

  /* Scrollbars ocultos globalmente en mobile */
  * {
    -ms-overflow-style: none;
  }
}
```

**Paso 2 — Verificar `meta viewport` en `index.html`:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```
El `viewport-fit=cover` es necesario para que `env(safe-area-inset-*)` funcione en iPhones con notch.

**Commit:**
```bash
git add src/index.css index.html
git commit -m "feat(responsive): global antioverflow, touch targets y safe areas"
```

---

## TAREA 11 — Verificación cruzada: clases CSS en TSX

**Archivos:** Todos los `.tsx` que tienen inline styles que contradicen los CSS creados.

**El problema más común:** Un componente tiene `style={{ padding: '64px 52px' }}` inline y el CSS tiene `@media (max-width: 768px) { .mi-clase { padding: 28px 14px !important; } }`. El `!important` debería ganar, pero hay casos donde el specificity falla.

**Paso 1 — Verificar estos casos concretos:**

En `PersonPage.tsx`:
- `person-page-hero-content`: tiene `style={{ ...padding: '0 52px 56px'...}}` — la clase mobile tiene `!important`, debería funcionar.
- `person-page-content-wrap`: reemplazado en Tarea 6 con `clamp()`, ok.

En `MovieDetail.tsx`:
- `md-main-layout`: tiene `className` sin inline padding conflictivo — ok.
- Verificar que `.md-sidebar-panel` está usado como `className` y no solo como inline style.

En `profile-v2/panels.tsx`:
- `profile-diary-row`: añadido en Tarea 5 — verificar que el className existe.

**Paso 2 — Para cada caso donde el inline style contradice el CSS mobile:**
Extraer el inline style a una clase CSS o usar `clamp()` directamente en el inline style (no necesita media query).

**Commit:**
```bash
git add src/pages/PersonPage.tsx src/pages/MovieDetail.tsx src/components/profile-v2/panels.tsx
git commit -m "fix(responsive): verificar y resolver conflictos inline style vs CSS media queries"
```

---

## TAREA 12 — Test visual Playwright en 375px

**Archivos:**
- Verificar existencia de `scripts/mobile-screenshot-test.ts` (del plan anterior)
- Si no existe, crearlo

**Script `scripts/mobile-screenshot-test.ts`:**

```typescript
import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const BASE_URL = process.env.VITE_TEST_URL || 'http://localhost:5173'
const OUT_DIR = path.join(process.cwd(), 'docs', 'screenshots-mobile')
const VIEWPORT = { width: 375, height: 812 }

const ROUTES = [
  { path: '/', name: '01-landing-hero' },
  { path: '/?scroll=1500', name: '02-landing-canon-critica' },
  { path: '/?scroll=3000', name: '03-landing-pilares-noche' },
  { path: '/?scroll=5000', name: '04-landing-reviews-cta-footer' },
  { path: '/search?q=lynch', name: '05-search-results' },
  { path: '/movie/27205', name: '06-movie-detail-hero' },
  { path: '/person/287', name: '07-person-page' },
  { path: '/diary', name: '08-diary' },
  { path: '/settings', name: '09-settings' },
]

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: VIEWPORT })

  for (const route of ROUTES) {
    const page = await context.newPage()
    try {
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(1000) // esperar animaciones iniciales

      const hasHorizontalOverflow = await page.evaluate(
        () => document.body.scrollWidth > window.innerWidth
      )

      const offenders = hasHorizontalOverflow
        ? await page.evaluate(() => {
            const all = document.querySelectorAll('*')
            const bad: string[] = []
            all.forEach((el) => {
              const rect = el.getBoundingClientRect()
              if (rect.right > window.innerWidth + 5) {
                bad.push(`${el.tagName}.${el.className}`)
              }
            })
            return bad.slice(0, 5)
          })
        : []

      const screenshotPath = path.join(OUT_DIR, `${route.name}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false })

      const status = hasHorizontalOverflow ? `❌ OVERFLOW` : '✅ OK'
      const offenderStr = offenders.length ? ` → ${offenders.join(', ')}` : ''
      console.log(`${status}  ${route.path}${offenderStr}`)
    } catch (err) {
      console.log(`⚠️  ERROR  ${route.path}  →  ${(err as Error).message}`)
    } finally {
      await page.close()
    }
  }

  await browser.close()
  console.log(`\nScreenshots guardados en: ${OUT_DIR}`)
}

run().catch(console.error)
```

**Instalar Playwright si no está:**
```bash
npm install -D @playwright/test
npx playwright install chromium --with-deps
```

**Ejecutar:**
```bash
npm run dev &
sleep 3
npx tsx scripts/mobile-screenshot-test.ts
```

**Para cada `❌ OVERFLOW`:** el script imprime qué elemento lo causa. Buscar ese elemento en el código y aplicar `max-width: 100%` o `overflow: hidden` según corresponda.

**Commit:**
```bash
git add scripts/mobile-screenshot-test.ts docs/screenshots-mobile/
git commit -m "test(responsive): screenshots Playwright en 375px — todas las rutas verificadas"
```

---

## RESUMEN DE ARCHIVOS AFECTADOS

| Tarea | Archivo(s) | Qué hace |
|---|---|---|
| 1 | `BottomNav.tsx` + `.css`, `App.tsx` | Bottom nav fija en mobile |
| 2 | `Landing.css` | Secciones intermedias mobile |
| 3 | `HomeLogged.tsx` + `HomeLogged.css` | Migrar isMobile a clases CSS |
| 4 | `MovieDetail.css`, `MovieDetail.tsx` | Poster mobile + sidebar inline |
| 5 | `Profile.css`, `panels.tsx` | Tabs sticky, diary timeline |
| 6 | `PersonPage.tsx` | Paddings fluidos con clamp() |
| 7 | `SearchResults.tsx` + `.css` | Filtros como drawer mobile |
| 8 | `TVDetail.css`, `Diary.css`, `Diary.tsx` | Breakpoints faltantes |
| 9 | `Settings.css`, `Lists.css`, `Vault.tsx`, `Activity.css` | Ajustes varios |
| 10 | `index.css`, `index.html` | Global safe areas + overflow |
| 11 | Varios `.tsx` | Conflictos inline style vs CSS |
| 12 | `scripts/mobile-screenshot-test.ts` | Test visual automatizado |

---

## CRITERIOS DE ÉXITO (checklist final)

- [ ] Bottom nav de 4 ítems visible en todas las páginas en mobile
- [ ] Landing: todas las secciones visibles en scroll — canon, aclamados, pronto, pilares, esta noche, reseñas, CTA, footer
- [ ] Landing: **Typewriter** ("tus reseñas.", "tus obsesiones.", etc.) sigue funcionando
- [ ] Landing: **parallax del hero** sigue funcionando al hacer scroll
- [ ] Landing: todas las animaciones **whileInView** de los pillar cards y movie cards siguen funcionando
- [ ] MovieDetail: poster visible en mobile (pequeño, a la derecha del texto)
- [ ] MovieDetail: ficha técnica y similares visibles en mobile (inline, no en sidebar lateral)
- [ ] SearchResults: filtros accesibles via drawer desde abajo
- [ ] SearchResults: active filters chips visibles
- [ ] Profile: 6 tabs accesibles en scroll horizontal (Resumen, Vault, Diario, Watchlist, Reseñas, Listas)
- [ ] Profile: tabs bar sticky al hacer scroll dentro del panel
- [ ] PersonPage: hero con retrato + texto, bio legible, filmografía con tabs y décadas
- [ ] En 375px: **cero scroll horizontal** en ninguna página
- [ ] Touch targets ≥ 44px en todos los botones de navegación
- [ ] Contenido 100% conservado — nada eliminado respecto a desktop

---

## NOTA ESPECIAL: ANIMACIONES PROTEGIDAS

Las siguientes animaciones NO deben tocarse bajo ningún concepto:

**Landing.tsx:**
- `<Typewriter>` component (lines ~96-127): máquina de escribir en el hero
- `motion.div style={{ y, scale }}` parallax del hero image
- `motion.nav initial={{ opacity: 0, y: -12 }}` del navbar
- Todos los `whileInView={{ opacity: 1, y: 0 }}` de MovieGridSection, pillar cards, reviews cards
- `motion.div` con delays escalonados en MovieGridSection (`delay: i * 0.06`)

**profile-v2/layout.tsx:**
- `AnimatePresence` en el search dropdown
- `motion.div` del mobile menu overlay

**panels.tsx:**
- `motion.div initial={{ opacity: 0, x: -20 }}` del diary timeline
- `motion.div initial={{ opacity: 0, y: 12 }}` de las list cards

**MovieDetail.tsx:**
- `motion.div` del hero poster (`initial={{ opacity: 0, y: -24, scale: 0.94 }}`)
- `motion.div` del hero content (`initial={{ opacity: 0, y: 24 }}`)

Estas animaciones son parte de la identidad visual de CineVault y fueron explícitamente aprobadas para preservarse.
