# CineVault — Plan de Responsividad Completa

> **Para Copilot:** Lee este plan de arriba a abajo y ejecútalo tarea por tarea.  
> Responde siempre en **español**. El código se escribe en **inglés** (nombres de variables, clases, comentarios técnicos).  
> Confirma cada tarea completada antes de pasar a la siguiente.

**Goal:** Hacer toda la app CineVault responsive para mobile (≥ 320px) sin eliminar contenido, usando CSS-native (media queries, clamp, container queries) y eliminando inline styles que bloquean la adaptación.

**Architecture:**  
Mobile-first. Breakpoints ya definidos en `tokens.css` (`--bp-sm: 480px`, `--bp-md: 768px`, `--bp-lg: 1024px`). Cada tarea ataca una superficie concreta: global → navbars → páginas → componentes de features. No se toca lógica de negocio ni servicios. Se prioriza CSS sobre JS para comportamiento responsive.

**Tech Stack:** React + Vite + TypeScript + Tailwind CSS + CSS Modules propios. Los tokens ya están en `src/styles/tokens.css`. Las clases de Tailwind (`sm:`, `md:`, `lg:`) son válidas junto con los CSS files existentes.

---

## CONTEXTO DEL PROYECTO (léelo antes de empezar)

### Identidad visual — "Oro Silencioso"
- **Paleta:** `#080808` bg · `#111111` surface · `#1A1A1A` elevated · `#252525` border · `#D4AF7A` accent (oro)
- **Tipografía:** `Cormorant Garamond` serif (headings) · `Syne` sans (body/ui)
- **Estilo:** oscuro, elegante, cinematográfico. Sin bordes redondeados (`--radius: 0rem`).

### Reglas de codificación del proyecto
- Nombres de variables y funciones en **español** (`iniciarSesion`, `manejadorAsincrono`, etc.)
- Commits en **español**
- Los archivos CSS existentes siguen el patrón `component-name.css` / `Page.css`
- Clases CSS en inglés kebab-case (`search-nav-mobile`, `feed-container`, etc.)

### Estado actual de responsividad
- `tokens.css` ✅ ya tiene `--space-*` con `clamp()` y breakpoints definidos
- `Landing.css` ✅ tiene breakpoints en secciones principales  
- `MovieDetail.css` ✅ tiene breakpoints en navbar interno
- `Profile.css` ✅ tiene grid layout responsive
- `TVDetail.css` ✅ usa `clamp()` en padding
- `UserNavbar.tsx` ❌ todo inline styles — sin ningún breakpoint mobile
- `Vault.tsx`, `Diary.tsx`, `Lists.tsx` ❌ todo inline styles — sin media queries
- `SearchResults.tsx` ⚠️ tiene CSS file pero la navbar interna no colapsa en mobile
- `Settings.tsx` ⚠️ layout básico pero falta contenido interior responsive
- `PersonPage.tsx` ⚠️ CSS parcial, hero y grid sin adaptar
- `Feed` feature ⚠️ TikTok-style, funciona en mobile pero actions panel no está optimizado

---

## TAREA 1 — Tokens globales mobile + meta viewport

**Archivos:**
- Modificar: `src/styles/tokens.css`
- Verificar: `index.html` (que tenga `<meta name="viewport">`)

**Qué hacer:**

Añadir al final de `:root` en `tokens.css` estas custom properties para mobile:

```css
/* Mobile-specific layout tokens */
--nav-height: 64px;
--nav-height-mobile: 56px;
--page-padding-x: clamp(14px, 4vw, 52px);
--page-padding-x-sm: clamp(14px, 3vw, 24px);
--content-max-width: 1280px;
--touch-target: 44px;
```

Verificar que `index.html` contiene:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

Si no existe, añadirlo dentro de `<head>`.

**Commit:**
```bash
git add src/styles/tokens.css index.html
git commit -m "feat(responsive): añadir tokens mobile y verificar meta viewport"
```

---

## TAREA 2 — UserNavbar: colapso hamburger mobile

**Archivos:**
- Modificar: `src/components/UserNavbar.tsx`
- Crear: `src/components/UserNavbar.css`

**Problema:**  
`UserNavbar.tsx` usa 24 `style={{...}}` inline sin ninguna media query. En mobile (< 768px) todo se apelotona y el search input de 200px quiebra el layout.

**Qué hacer:**

1. Crear `UserNavbar.css` con estos estilos:

```css
/* UserNavbar.css */
.user-navbar {
  background: #14181c;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding: 0 var(--page-padding-x);
  height: var(--nav-height);
  display: flex;
  align-items: center;
  justify-content: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.user-navbar__container {
  width: 100%;
  max-width: 1100px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-navbar__logo {
  font-size: 22px;
  font-weight: bold;
  color: #fff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.user-navbar__menu {
  display: flex;
  gap: 20px;
}

.user-navbar__menu-link {
  color: #9ab;
  text-decoration: none;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
}

.user-navbar__search {
  position: relative;
}

.user-navbar__search-input {
  background: #2c3440;
  border: none;
  border-radius: 20px;
  padding: 6px 15px 6px 35px;
  color: #fff;
  font-size: 13px;
  width: 200px;
}

.user-navbar__search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.user-navbar__right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-navbar__actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-navbar__hamburger {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ab;
  padding: 4px;
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  align-items: center;
  justify-content: center;
}

.user-navbar__mobile-menu {
  display: none;
  position: fixed;
  top: var(--nav-height-mobile);
  left: 0;
  right: 0;
  background: #14181c;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding: 16px var(--page-padding-x-sm);
  flex-direction: column;
  gap: 4px;
  z-index: 99;
}

.user-navbar__mobile-menu--open {
  display: flex;
}

.user-navbar__mobile-link {
  display: block;
  padding: 12px 4px;
  color: #9ab;
  text-decoration: none;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.user-navbar__mobile-search {
  margin-bottom: 8px;
}

.user-navbar__mobile-search-input {
  width: 100%;
  background: #2c3440;
  border: none;
  border-radius: 4px;
  padding: 10px 14px;
  color: #fff;
  font-size: 14px;
}

.user-navbar__log-btn {
  background: #00b020;
  color: #fff;
  border: none;
  padding: 6px 15px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: var(--touch-target);
}

.user-navbar__notification-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ab;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: var(--touch-target);
  height: var(--touch-target);
  position: relative;
}

.user-navbar__badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #D4AF7A;
  color: #080808;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-navbar__user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
}

.user-navbar__avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #456;
}

.user-navbar__username {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
}

.user-navbar__chevron {
  font-size: 10px;
  color: #678;
}

.user-navbar__dropdown {
  position: absolute;
  top: 120%;
  right: 0;
  background: #2c3440;
  padding: 10px 0;
  width: 150px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  z-index: 1000;
}

.user-navbar__dropdown a,
.user-navbar__dropdown button {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 8px 15px;
  color: #9ab;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .user-navbar {
    height: var(--nav-height-mobile);
    padding: 0 var(--page-padding-x-sm);
  }

  .user-navbar__menu,
  .user-navbar__search {
    display: none;
  }

  .user-navbar__hamburger {
    display: inline-flex;
  }

  .user-navbar__logo {
    font-size: 18px;
  }

  .user-navbar__username {
    display: none;
  }

  .user-navbar__chevron {
    display: none;
  }
}
```

2. En `UserNavbar.tsx`:
   - Añadir `import './UserNavbar.css'`
   - Añadir estado `const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)`
   - Reemplazar todos los `style={{...}}` por las clases CSS creadas
   - Añadir botón hamburger (icono `Menu`/`X` de lucide-react ya importado) que toggle `isMobileMenuOpen`
   - Añadir el `<div className="user-navbar__mobile-menu">` con links + search input, controlado por `isMobileMenuOpen`
   - El `position: sticky` en CSS evita que el `top: var(--nav-height-mobile)` del menú móvil funcione mal — verificar que el navbar es sticky, no fixed

**Verificación:**  
Redimensionar a 375px — el hamburger aparece, los links desaparecen, el menú abre al clicar.

**Commit:**
```bash
git add src/components/UserNavbar.tsx src/components/UserNavbar.css
git commit -m "feat(responsive): UserNavbar con hamburger mobile y CSS extraído de inline styles"
```

---

## TAREA 3 — Navbar.tsx (subpage navbar): hamburger mobile

**Archivos:**
- Modificar: `src/components/Navbar.tsx`
- Verificar: `src/App.css` (donde viven los estilos `.subpage-navbar`, `.nav-container`, etc.)

**Problema:**  
`Navbar.tsx` usa clases CSS pero no hay hamburger ni colapso de menú en mobile.

**Qué hacer:**

1. Añadir a los estilos de `.subpage-navbar` (en `App.css` o crear `Navbar.css`):

```css
/* Mobile hamburger — añadir a los estilos existentes de Navbar */
.nav-hamburger {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-soft);
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  align-items: center;
  justify-content: center;
}

.nav-mobile-overlay {
  display: none;
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  background: rgba(8,8,8,0.97);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  padding: 16px var(--page-padding-x-sm);
  flex-direction: column;
  gap: 0;
  z-index: 200;
}

.nav-mobile-overlay--open {
  display: flex;
}

.nav-mobile-link {
  display: block;
  padding: 14px 0;
  color: var(--color-text-soft);
  text-decoration: none;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 0.1em;
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-sans);
}

.nav-mobile-search {
  padding: 12px 0 4px;
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  
  .nav-hamburger {
    display: inline-flex;
  }

  .nav-search {
    display: none;
  }
}
```

2. En `Navbar.tsx`: añadir `isMobileMenuOpen` state, botón hamburger usando `Menu`/`X` de lucide-react, overlay con links y search.

**Commit:**
```bash
git add src/components/Navbar.tsx
git commit -m "feat(responsive): Navbar subpage con hamburger mobile"
```

---

## TAREA 4 — Landing page: secciones pendientes mobile

**Archivos:**
- Modificar: `src/components/Landing.css`
- Revisar: `src/components/Landing.tsx` (para identificar qué secciones tienen inline styles sin contraparte CSS)

**Problema:**  
`Landing.css` ya tiene grid y section padding responsive, pero varias secciones dentro de `Landing.tsx` usan inline styles fijos (`style={{ width: '340px' }}`, gaps fijos, etc.) que no se adaptan.

**Qué hacer:**

Buscar en `Landing.tsx` todos los bloques con `style={{...}}` que contengan valores fijos de `width`, `padding`, `gap`, `fontSize`. Por cada uno:

1. Crear una clase CSS semántica en `Landing.css`
2. Reemplazar el `style={{...}}` por `className="landing-XXX"`
3. Añadir breakpoint `@media (max-width: 768px)` con valores adaptados

Patrones prioritarios a buscar y convertir:
- Hero search bar: que en mobile ocupe `100%` del ancho disponible
- CTA buttons: que en mobile sean `width: 100%` o al menos `min-width: auto`
- Testimonials / feature cards: que en mobile sean columna única
- InfiniteSlider wrapper: verificar overflow y que no cause scroll horizontal

Añadir al footer de `Landing.css`:
```css
@media (max-width: 480px) {
  .landing-footer-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .landing-footer {
    padding: 40px 14px 28px;
  }
}
```

**Verificación:**  
En 375px — sin scroll horizontal, texto legible, botones tapeables (≥ 44px altura).

**Commit:**
```bash
git add src/components/Landing.css src/components/Landing.tsx
git commit -m "feat(responsive): Landing secciones hero y footer adaptadas a mobile"
```

---

## TAREA 5 — SearchResults: navbar interna + grid de resultados

**Archivos:**
- Modificar: `src/pages/SearchResults.css`
- Revisar: `src/pages/SearchResults.tsx`

**Problema:**  
`SearchResults.css` existe pero la navbar interna no tiene hamburger, y el result card (grid `92px + 1fr`) puede quedar estrecho en mobile muy pequeño.

**Qué hacer:**

Añadir a `SearchResults.css`:

```css
/* ── Mobile Navbar ── */
.search-nav-hamburger {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-soft);
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  align-items: center;
  justify-content: center;
}

.search-nav-mobile-menu {
  display: none;
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  background: rgba(8,8,8,0.97);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  padding: 16px 14px;
  flex-direction: column;
  z-index: 200;
}

.search-nav-mobile-menu--open {
  display: flex;
}

/* ── Result Card Mobile ── */
@media (max-width: 768px) {
  .search-results-main {
    padding: 80px 14px 40px;
  }

  .search-nav {
    padding: 0 14px;
    height: 56px;
  }

  .search-nav-links,
  .search-input-wrapper {
    display: none !important;
  }

  .search-nav-hamburger {
    display: inline-flex;
  }

  .search-result-poster {
    width: 72px;
    height: 108px;
  }

  .search-result-card-layout {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .search-results-filter-bar {
    overflow-x: auto;
    width: 100%;
    -webkit-overflow-scrolling: touch;
  }
}

@media (max-width: 480px) {
  .search-result-poster {
    width: 60px;
    height: 90px;
  }

  .search-result-card-layout {
    grid-template-columns: 60px minmax(0, 1fr);
  }
}
```

Añadir en `SearchResults.tsx` el state `isMobileMenuOpen` y el botón hamburger en la navbar interna, igual que en tareas anteriores.

**Commit:**
```bash
git add src/pages/SearchResults.css src/pages/SearchResults.tsx
git commit -m "feat(responsive): SearchResults navbar hamburger y result cards adaptados"
```

---

## TAREA 6 — MovieDetail: secciones de contenido principales

**Archivos:**
- Modificar: `src/pages/MovieDetail.css`
- Revisar: `src/pages/MovieDetail.tsx` (3086 líneas — ir sección a sección)

**Problema:**  
`MovieDetail.css` ya tiene breakpoints para la navbar interna, pero el resto del contenido (hero backdrop, poster + info grid, secciones de reseñas, panel de streaming, similares) usa inline styles masivos dentro del TSX.

**Qué hacer — por secciones:**

**Sección A — Hero backdrop:**  
El backdrop image ocupa full-width con overlay. En mobile debe reducir height:
```css
.md-hero {
  min-height: clamp(280px, 50vw, 480px);
}
```

**Sección B — Poster + Info layout (grid principal):**  
Buscar en MovieDetail.tsx el layout `poster | info` (generalmente `display: flex, gap: Npx` con el poster a la izquierda). Extraer a clases:
```css
.md-main-layout {
  display: flex;
  gap: 40px;
  align-items: flex-start;
  padding: 40px var(--page-padding-x) 0;
  max-width: 1280px;
  margin: 0 auto;
}

.md-poster-col {
  flex-shrink: 0;
  width: 220px;
}

.md-info-col {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .md-main-layout {
    flex-direction: column;
    padding: 24px 14px 0;
    gap: 20px;
  }

  .md-poster-col {
    width: 140px;
    align-self: center;
  }
}

@media (max-width: 480px) {
  .md-poster-col {
    width: 120px;
  }
}
```

**Sección C — Acciones rápidas (watchlist, favorites, etc.):**  
Los botones de acción en mobile deben tener `min-height: var(--touch-target)` y el grupo debe hacer `flex-wrap: wrap`.
```css
.md-actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.md-action-btn {
  min-height: var(--touch-target);
  padding: 0 12px;
}
```

**Sección D — Cast grid:**  
El cast usa un grid o flex horizontal. En mobile debe ser scrollable horizontalmente:
```css
.md-cast-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.md-cast-item {
  flex-shrink: 0;
  width: 80px;
}
```

**Sección E — Películas similares:**  
Grid de pósters similar al cast, mismo tratamiento scroll horizontal en mobile.

**Sección F — Sección de reseñas:**  
En mobile las reseñas deben ocupar ancho completo, sin padding lateral excesivo.

**Nota importante:** MovieDetail.tsx tiene 3086 líneas con inline styles mezclados. Buscar sistemáticamente con `Ctrl+F` patrones como `style={{ display: 'flex'` y `style={{ padding:` para ir extrayendo clase por clase. No hace falta convertir el 100% — priorizar los layouts rotos en 375px.

**Verificación:**  
En 375px — poster visible, título legible, botones de acción tapeables, no hay desbordamiento horizontal.

**Commit:**
```bash
git add src/pages/MovieDetail.css src/pages/MovieDetail.tsx
git commit -m "feat(responsive): MovieDetail hero, poster-info layout y acciones adaptados a mobile"
```

---

## TAREA 7 — TVDetail y PersonPage

**Archivos:**
- Modificar: `src/pages/TVDetail.css`, `src/pages/TVDetail.tsx`
- Modificar: `src/pages/PersonPage.css`, `src/pages/PersonPage.tsx`

**Problema:**  
`TVDetail.css` usa `clamp()` en padding (bien) pero el layout hero + info puede no colapsar. `PersonPage.css` tiene estilos parciales.

**Qué hacer — TVDetail:**

Añadir a `TVDetail.css`:
```css
.tv-main-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 32px;
  padding: 32px clamp(16px, 4vw, 56px);
  max-width: 1180px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .tv-main-layout {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px 14px;
  }

  .tv-hero {
    min-height: 280px;
  }
}

.tv-episode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 16px;
}
```

**Qué hacer — PersonPage:**

Añadir/completar en `PersonPage.css`:
```css
.person-hero {
  display: flex;
  gap: 32px;
  padding: 32px var(--page-padding-x);
  align-items: flex-start;
}

.person-photo {
  width: 200px;
  flex-shrink: 0;
}

.person-filmography-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(140px, 100%), 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .person-hero {
    flex-direction: column;
    align-items: center;
    padding: 24px 14px;
    gap: 20px;
    text-align: center;
  }

  .person-photo {
    width: 140px;
  }

  .person-filmography-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(110px, 100%), 1fr));
    gap: 10px;
  }
}
```

Revisar `PersonPage.tsx` y reemplazar inline styles del hero y filmography por estas clases.

**Commit:**
```bash
git add src/pages/TVDetail.css src/pages/TVDetail.tsx src/pages/PersonPage.css src/pages/PersonPage.tsx
git commit -m "feat(responsive): TVDetail y PersonPage layout hero adaptados a mobile"
```

---

## TAREA 8 — Vault, Diary, Lists: extraer inline styles críticos

**Archivos:**
- Crear: `src/pages/Vault.css`
- Crear: `src/pages/Diary.css`
- Crear: `src/pages/Lists.css`
- Modificar: `src/pages/Vault.tsx`, `src/pages/Diary.tsx`, `src/pages/Lists.tsx`

**Problema:**  
Estas tres páginas son 100% inline styles. `Vault.tsx` usa `react-responsive-masonry` (que sí es responsive por sí solo), pero el navbar interno y el header no se adaptan. `Diary.tsx` tiene un layout de sesiones con gaps fijos.

**Qué hacer — Vault:**

Crear `Vault.css`:
```css
/* Vault.css */
.vault-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(8,8,8,0.97);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--page-padding-x);
  display: flex;
  align-items: center;
  gap: 20px;
  height: var(--nav-height);
}

.vault-header {
  padding: 40px var(--page-padding-x) 24px;
  max-width: 900px;
  margin: 0 auto;
}

.vault-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--page-padding-x) 80px;
}

.vault-type-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

@media (max-width: 768px) {
  .vault-navbar {
    padding: 0 14px;
    height: var(--nav-height-mobile);
  }

  .vault-header {
    padding: 24px 14px 16px;
  }

  .vault-content {
    padding: 0 14px 60px;
  }
}
```

**Qué hacer — Diary:**

Crear `Diary.css`:
```css
/* Diary.css */
.diary-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(8,8,8,0.97);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--page-padding-x);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--nav-height);
}

.diary-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 48px var(--page-padding-x) 80px;
}

.diary-session-layout {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}

.diary-session-date-col {
  flex-shrink: 0;
  width: 60px;
  text-align: right;
}

.diary-session-films {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .diary-navbar {
    padding: 0 14px;
    height: var(--nav-height-mobile);
  }

  .diary-main {
    padding: 32px 14px 60px;
  }

  .diary-session-layout {
    gap: 16px;
  }

  .diary-session-films {
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .diary-session-layout {
    flex-direction: column;
    gap: 10px;
  }

  .diary-session-date-col {
    width: auto;
    text-align: left;
  }
}
```

**Qué hacer — Lists:**

Crear `Lists.css` siguiendo el mismo patrón: navbar sticky con padding responsive, content max-width con padding responsive, grid de listas con `auto-fill minmax(min(300px, 100%), 1fr)`.

En cada `.tsx` añadir el import del CSS y reemplazar los inline styles del navbar interno y del layout principal por las clases. Los styled components de las tarjetas internas pueden quedar inline si son pequeños — priorizar lo que causa overflow o compresión.

**Commit:**
```bash
git add src/pages/Vault.css src/pages/Vault.tsx src/pages/Diary.css src/pages/Diary.tsx src/pages/Lists.css src/pages/Lists.tsx
git commit -m "feat(responsive): Vault, Diary y Lists con CSS extraído y layout mobile"
```

---

## TAREA 9 — Settings: contenido interior

**Archivos:**
- Modificar: `src/pages/Settings.css`
- Revisar: `src/pages/Settings.tsx`

**Problema:**  
`Settings.css` ya tiene el padding responsive del main container, pero el contenido interior (formularios, secciones de configuración, tabs) puede tener anchos fijos.

**Qué hacer:**

Añadir a `Settings.css`:
```css
.settings-section {
  margin-bottom: 48px;
  padding-bottom: 48px;
  border-bottom: 1px solid var(--color-border);
}

.settings-form-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.settings-input {
  width: 100%;
  min-height: var(--touch-target);
}

.settings-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  margin-bottom: 32px;
}

.settings-tab-btn {
  min-height: var(--touch-target);
  white-space: nowrap;
  padding: 0 20px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .settings-form-group {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .settings-section {
    margin-bottom: 32px;
    padding-bottom: 32px;
  }
}
```

Revisar `Settings.tsx` y reemplazar los inline styles de formularios y grids internos por estas clases.

**Commit:**
```bash
git add src/pages/Settings.css src/pages/Settings.tsx
git commit -m "feat(responsive): Settings formularios y tabs adaptados a mobile"
```

---

## TAREA 10 — Feed feature: FeedCard y FeedNavbar mobile

**Archivos:**
- Revisar: `src/features/feed/components/FeedNavbar/FeedNavbar.tsx`
- Revisar: `src/features/feed/components/FeedCard/FeedCard.tsx`
- Revisar: `src/components/MovieActionsPanel.css`

**Problema:**  
El Feed es TikTok-style (scroll snap vertical, `height: 100vh`). Esto funciona bien en mobile por naturaleza, pero el navbar del Feed y el panel de acciones pueden estar fijos en desktop sin adaptar a pantallas pequeñas.

**Qué hacer:**

En `FeedNavbar.tsx`: verificar que los tabs horizontales tienen `overflow-x: auto` y `scrollbar-width: none` para que en mobile muy estrecho no rompan el layout.

En `FeedCard.tsx`: verificar que el contenido de la tarjeta (poster, texto de reseña, acciones) respeta `max-width: 100%` y no tiene anchos fijos que excedan la pantalla.

En `MovieActionsPanel.css` (si existe) / inline styles del panel de acciones:
```css
/* Añadir si no existe */
@media (max-width: 480px) {
  .feed-actions-panel {
    right: 8px;
    gap: 16px;
  }

  .feed-action-btn {
    width: 40px;
    height: 40px;
  }
}
```

Verificar que el `FeedOverlay` no tiene `position: fixed` con valores que puedan salirse de pantalla en mobile.

**Commit:**
```bash
git add src/features/feed/components/
git commit -m "feat(responsive): Feed navbar tabs scrollable y actions panel adaptado a mobile pequeño"
```

---

## TAREA 11 — Profile v2: panels y poster grids en mobile pequeño

**Archivos:**
- Modificar: `src/components/profile-v2/Profile.css`
- Revisar: `src/components/profile-v2/panels.tsx`

**Contexto:**  
`Profile.css` ya tiene el grid layout responsive (`1fr` en mobile). El trabajo aquí es asegurar que los paneles internos (resumen stats, vault poster grid, watchlist) también se adaptan.

**Qué hacer:**

Añadir a `Profile.css`:
```css
/* Poster grid dentro de panels */
.profile-poster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100px, 100%), 1fr));
  gap: 8px;
}

/* Stats row en resumen */
.profile-stats-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.profile-stat-item {
  min-width: 0;
}

/* Tab bar scrollable */
.profile-tabs {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  border-bottom: 1px solid var(--color-border);
}

.profile-tab-btn {
  flex-shrink: 0;
  min-height: var(--touch-target);
  padding: 0 16px;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .profile-poster-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(80px, 100%), 1fr));
  }

  .profile-stats-row {
    gap: 12px;
  }

  .profile-hero {
    min-height: 320px;
    height: 320px;
  }

  .profile-hero-content {
    padding: 0 14px 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
```

Revisar `panels.tsx` e identificar los grids de pósters y listas que usan inline styles con anchos fijos. Reemplazar por las clases o por `style` con valores relativos (`minmax`, `%`, `vw`).

**Commit:**
```bash
git add src/components/profile-v2/Profile.css src/components/profile-v2/panels.tsx
git commit -m "feat(responsive): Profile panels poster grids y tabs adaptados a viewport pequeño"
```

---

## TAREA 12 — Auditoría final y scroll horizontal

**Archivos:**
- Revisar: todos los archivos modificados
- Revisar: `src/index.css`

**Qué hacer:**

1. Añadir a `src/index.css` una regla global antioverflow:
```css
/* Prevenir scroll horizontal global */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}
```

2. Abrir DevTools en Chrome → Toggle Device Toolbar → iPhone SE (375px).  
   Navegar por estas rutas y verificar que no hay scroll horizontal:
   - `/` Landing
   - `/search?q=test` SearchResults
   - `/film/123/titulo` MovieDetail
   - `/profile/usuario` Profile
   - `/diary` Diary
   - `/vault/usuario` Vault
   - `/settings` Settings
   - `/feed` Feed
   - `/tv/123/titulo` TVDetail

3. Para cada página con scroll horizontal detectado: identificar el elemento con `overflow: visible` y ancho fijo, aplicar `max-width: 100%` o `min-width: 0` según corresponda.

4. Verificar touch targets: los botones de acción principales deben tener al menos `44px` de altura. Si alguno es más pequeño, añadir `min-height: var(--touch-target)` en su clase CSS.

**Commit final:**
```bash
git add src/index.css
git commit -m "feat(responsive): auditoría final, antioverflow global y touch targets verificados"
```

---

## RESUMEN DE ARCHIVOS AFECTADOS

| Archivo | Estado | Prioridad |
|---|---|---|
| `src/styles/tokens.css` | Ampliar con tokens mobile | Alta |
| `index.html` | Verificar meta viewport | Alta |
| `src/components/UserNavbar.tsx` + `.css` (nuevo) | Crear CSS, hamburger | Alta |
| `src/components/Navbar.tsx` | Hamburger + overlay | Alta |
| `src/components/Landing.css` + `Landing.tsx` | Completar inline styles | Media |
| `src/pages/SearchResults.css` + `.tsx` | Hamburger + result cards | Alta |
| `src/pages/MovieDetail.css` + `.tsx` | Layout poster+info, cast, reviews | Alta |
| `src/pages/TVDetail.css` + `.tsx` | Layout hero+info | Media |
| `src/pages/PersonPage.css` + `.tsx` | Layout hero, filmography | Media |
| `src/pages/Vault.css` (nuevo) + `Vault.tsx` | Crear CSS, navbar, masonry | Media |
| `src/pages/Diary.css` (nuevo) + `Diary.tsx` | Crear CSS, session layout | Media |
| `src/pages/Lists.css` (nuevo) + `Lists.tsx` | Crear CSS, grid | Media |
| `src/pages/Settings.css` + `.tsx` | Form groups, tabs | Baja |
| `src/features/feed/**` | FeedNavbar tabs, actions panel | Baja |
| `src/components/profile-v2/Profile.css` + `panels.tsx` | Poster grids, stats, tabs | Media |
| `src/index.css` | Antioverflow global | Alta |

## CRITERIOS DE ÉXITO

- [ ] En 375px (iPhone SE): ninguna página tiene scroll horizontal
- [ ] Todos los navbars tienen hamburger funcional en mobile
- [ ] Touch targets ≥ 44px en botones de acción principales  
- [ ] `clamp()` en tipografías de headings principales
- [ ] Cero instancias de `useResponsive` / `window.innerWidth` añadidas (ya no existe en el código — mantenerlo así)
- [ ] Identidad "Oro Silencioso" intacta en todos los breakpoints
- [ ] Contenido 100% visible en mobile (nada oculto salvo la navbar expandida)
