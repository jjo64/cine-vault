# CineVault — Frontend Implementation Prompt (GitHub Copilot Agent)

You are implementing features and fixes for **CineVault** (`cinevault.art`), a full-stack cinephile SaaS platform. This is a React + Vite + TypeScript + Tailwind CSS frontend. Respond in Spanish.

---

## CONTEXTO DE MARCA Y ARQUITECTURA

**Stack:** React + Vite + TypeScript + Tailwind CSS. Feature-based folder structure: `src/features/[feature]/hooks/`, `components/`, `types/`. Path alias `@/` apunta a `src/`.

**Patrones obligatorios:**
- Composition pattern con TypeScript namespaces (no boolean props). Ejemplo: `namespace ReviewCard { export const Frame, Header, Body, Footer }`
- No `useEffect` para datos derivados — usar `useMemo` o cálculo directo en render
- State lifting: el estado sube por encima de todos los componentes que lo necesitan
- Compound components con Context para componentes complejos
- `key` en listas: nunca usar index como key, siempre IDs de entidad

**Identidad visual — "Oro Silencioso":**
- Tipografías: Cormorant Garamond (serif, cuerpo/títulos) + Syne (sans, UI/labels)
- Paleta: fondo oscuro `#0a0a0f`, dorado `#c9a84c`, texto crema `#e8e0d4`, gris medio `#888`
- Estética: videoclub europeo de autor, oscuro, elegante, con textura analógica
- Voz de marca: irónica y cinéfila. Nada genérico. Ejemplos: "Tu vault está vacío. Toda gran colección empieza con una." / "Esta noche, sin excusas:"

**API:** El backend corre en `https://api.cinevault.art`. Usar `import.meta.env.VITE_API_URL` con fallback a esa URL.

---

## FASE 1 — BUGS CRÍTICOS (implementar primero)

### BUG-01: Google OAuth — redirect_uri_mismatch

**Síntoma:** Error 400 en el flujo de registro/login con Google: `redirect_uri_mismatch`.

**Fix:**
1. Verificar qué `redirect_uri` se está enviando en el request OAuth desde el frontend
2. Asegurar que coincida exactamente con el registrado en Google Cloud Console
3. La URI correcta de producción debe ser: `https://cinevault.art/auth/google/callback`
4. Si se construye dinámicamente, usar `import.meta.env.VITE_GOOGLE_REDIRECT_URI` y no `window.location.origin` (puede diferir en prod)
5. Verificar que en desarrollo se use `http://localhost:5000/auth/google/callback` (también debe estar registrada en Google Cloud Console)

### BUG-02: Respuestas a reseñas no se guardan

**Síntoma:** En `MovieDetail`, la sección de reseñas muestra el input para responder, pero al enviar, la respuesta no se guarda ni aparece.

**Fix:**
1. Localizar el handler de submit del formulario de respuesta en `src/features/movies/` o `src/features/reviews/`
2. Verificar que el `POST` al endpoint de respuestas esté enviando el `review_id` padre correcto en el body
3. Verificar que tras el submit exitoso se invalide/refetch la lista de respuestas (no solo el estado local)
4. El estado optimista, si existe, debe hacer rollback en caso de error con feedback visual al usuario
5. Testear con Thunder Client: `POST /api/reviews/:id/comments` con body `{ content: "..." }`

---

## FASE 2 — NUEVAS PÁGINAS

### PAGE-01: `/activity` — Página de actividad global

**Ruta:** `src/features/activity/`

**Estructura de la página:**
```
/activity
├── Tab "Amigos"  → actividad de usuarios que sigo
└── Tab "Tú"      → mi propia actividad
```

**Tipos de eventos a mostrar en el feed de actividad:**
- Nueva reseña publicada
- Nueva entrada en el diario
- Película añadida al vault
- Like a una reseña
- Nuevo seguidor / nuevo seguido
- Película añadida a watchlist

**Componentes a crear (composition pattern):**
```tsx
namespace ActivityFeed {
  export const Frame       // contenedor con tabs
  export const Tab         // tab individual (Amigos / Tú)
  export const EventCard   // tarjeta de evento genérica
  export const ReviewEvent // evento: nueva reseña
  export const VaultEvent  // evento: añadido al vault
  export const FollowEvent // evento: nuevo follow
  export const LikeEvent   // evento: like a reseña
}
```

**Endpoint esperado:** `GET /api/activity/feed?type=friends|own&page=1&limit=20`

**UX:** Scroll infinito con `IntersectionObserver`. Skeleton loader durante carga. Estado vacío con copy de marca: *"Silencio en la sala. Seguí a alguien para ver su actividad."*

---

### PAGE-02: `/for-you` — Feed personalizado

**Ruta:** `src/features/foryou/`

**Lógica de contenido (delegar al backend):**
El frontend solo consume `GET /api/recommendations/for-you?page=1`. El algoritmo vive en el backend. El frontend renderiza el resultado sin lógica de scoring.

**Pool de contenido a mostrar:**
- Películas recomendadas basadas en el historial del usuario
- Reseñas de películas afines a sus gustos
- Películas de cine de autor / indie que coincidan con su perfil
- Recomendaciones generales como fallback si el perfil está vacío

**Componentes:**
```tsx
namespace ForYouFeed {
  export const Frame
  export const MovieCard      // poster + título + match score visual
  export const ReviewCard     // reseña con contexto de por qué se recomienda
  export const EmptyState     // "Tu perfil cinematográfico está en blanco. Empezá a puntuar."
  export const SectionHeader  // separador de secciones con copy de marca
}
```

**UX:** Scroll infinito. Sin imágenes de usuario por ahora (solo texto + posters de TMDB). Layout inspirado en MUBI — vertical, elegante, sin ruido.

---

### PAGE-03: `/:username/movie/:slug` — Hilo de reseña

**Ruta:** `src/features/reviews/ReviewThread.tsx`

**URL de ejemplo:** `/josue/movie/965150-aftersun`

**Contenido de la página:**
1. Reseña principal (completa, no truncada) con todos sus elementos visuales (radar de dimensiones si existe, blockquote de diálogo, veredicto)
2. Contador de likes con botón de like/unlike
3. Sección de respuestas ordenadas por fecha
4. Caja de nueva respuesta para usuarios autenticados
5. Cada respuesta tiene: editar (si es propia) y like

**Componentes:**
```tsx
namespace ReviewThread {
  export const Frame
  export const MainReview      // reseña principal expandida
  export const ReplyList       // lista de respuestas
  export const ReplyCard       // respuesta individual con acciones
  export const ReplyComposer   // caja de nueva respuesta
  export const LikeButton      // like con estado optimista
}
```

**Endpoints:**
- `GET /api/reviews/:username/:movieSlug` → reseña principal + metadata
- `GET /api/reviews/:reviewId/comments` → lista de respuestas
- `POST /api/reviews/:reviewId/comments` → nueva respuesta
- `PUT /api/reviews/comments/:commentId` → editar respuesta propia
- `DELETE /api/reviews/comments/:commentId` → eliminar respuesta propia
- `POST /api/reviews/:reviewId/like` → toggle like

---

## FASE 3 — CAMBIOS VISUALES Y UX

### UI-01: Navbar unificado

**Problema:** El navbar de `MovieDetail` es diferente al del resto de la app.

**Fix:** Extraer el navbar de `MovieDetail` como componente compartido y aplicarlo en todas las rutas autenticadas: `Home`, `Activity`, `Profile`, `Feed`, `ForYou`, `Diary`, `Watchlist`.

**Nueva estructura del navbar:**
```
[Logo CineVault]  |  Diario(ícono)  Esta noche  Feed  Members  Lists  Films  |  [🔔]  [Avatar]
```

- Eliminar del navbar: Films, Lists, Members, Journal (como items de texto)
- Agregar: Diario (con ícono, no texto), Esta noche, Feed, Members, Lists, Films
- Agregar al lado del avatar: ícono de campana `🔔` que lleva a `/activity`
- Componente: `src/components/layout/Navbar.tsx` con composition pattern

---

### UI-02: Reseñas con 3 modos de renderizado

**Jerarquía visual de una reseña publicada:**

```
[Avatar] [Nombre usuario] · [Fecha] · [Película]
─────────────────────────────────────────────────
[Si tiene rating por dimensiones → gráfico radar SVG de 5 puntas]
[Cuerpo de texto en Cormorant Garamond]
[Si tiene cita de diálogo → blockquote con línea dorada izquierda]
[Timestamps como fichas inline dentro del texto]
─────────────────────────────────────────────────
[Veredicto en tipografía más grande, separado por línea fina]
```

**3 modos de renderizado:**
1. `compact` — solo avatar, nombre, rating global y primeras 2 líneas del texto (para feed y listas)
2. `standard` — todo excepto el radar de dimensiones (para MovieDetail)
3. `full` — todo incluido el radar SVG (para la página de hilo `/username/movie/slug`)

**Gráfico radar:** SVG puro, 5 puntas, sin dependencias externas. Las dimensiones son las que el usuario completó al escribir la reseña (dirección, guión, actuaciones, fotografía, música). Si no hay dimensiones, no renderizar el radar.

**Componente:**
```tsx
namespace ReviewCard {
  export const Frame
  export const Header        // avatar + nombre + fecha + película
  export const RadarChart    // SVG radar, solo en modo full
  export const Body          // texto con soporte para blockquote y timestamps
  export const Verdict       // veredicto final
  export type Mode = 'compact' | 'standard' | 'full'
}
```

---

### UI-03: Firma cinematográfica en perfil — edición inline

**Problema actual:** Al editar la firma, salta un `alert()` nativo que rompe la experiencia.

**Fix:**
1. Reemplazar el `alert()` por edición inline directamente sobre el elemento de firma
2. Al hacer click en "Editar firma": el texto se convierte en un `<textarea>` con el mismo estilo visual (Cormorant Garamond, mismo tamaño)
3. Botones inline: "Guardar" y "Cancelar" — pequeños, discretos, debajo del textarea
4. Al guardar: `PATCH /api/users/me/signature` y volver al modo lectura
5. Al cancelar: restaurar texto original sin llamada al servidor
6. Límite de caracteres: 280 — mostrar contador discreto `[x/280]`

---

### UI-04: Buscador de película para nueva entrada (Diario y Home)

**Contexto:** El botón "+ Nueva entrada" en `/diary` y el botón "Añadir entrada" en `Home > Mi diario` deben abrir un buscador de película.

**Flujo:**
1. Click en "+ Nueva entrada" → aparece dropdown/modal con un `<input>` de búsqueda
2. El usuario escribe → debounce 300ms → `GET /api/movies/search?q=...` → resultados en tiempo real
3. Cada resultado muestra: poster pequeño (TMDB, w92) + título + año. Nada más.
4. Click en una película → cierra el buscador y abre el modal de `ReviewOrLog` (el mismo que ya existe en `MovieDetail`)
5. El modal de `ReviewOrLog` recibe el `tmdb_id` y título de la película seleccionada

**Componente:**
```tsx
namespace MovieSearchDropdown {
  export const Trigger      // el botón que lo abre
  export const Overlay      // fondo semitransparente
  export const Input        // campo de búsqueda con ícono
  export const ResultItem   // poster + título + año
  export const EmptyState   // "Sin resultados para '...'"
  export const Loading      // skeleton de 3 items
}
```

---

## FASE 4 — HARDCODED DATA

### DATA-01: Directores "que quizá no conocés" — Home

**Problema:** La sección muestra directores hardcodeados.

**Fix:**
1. Crear endpoint en backend: `GET /api/recommendations/directors?userId=:id` que devuelva directores de cine de autor / indie basados en las películas del vault del usuario
2. En el frontend, consumir ese endpoint y renderizar dinámicamente
3. Fallback si el vault está vacío: directores curados de una lista editorial en el backend (no en el frontend)
4. Nunca hardcodear nombres en el componente React

### DATA-02: Feed — scroll infinito con algoritmo

**Problema:** El Feed está hardcodeado.

**Fix:**
1. Endpoint: `GET /api/feed?page=1&limit=10` — el algoritmo vive en el backend
2. Frontend implementa scroll infinito con `IntersectionObserver`
3. Contenido del feed: vault entries, reseñas, recomendaciones — todo mezclado según relevancia
4. Por ahora: solo texto, sin video. Las vault entries muestran poster de TMDB.
5. Estado vacío: *"Tu feed está en silencio. Seguí a alguien o añadí películas a tu vault."*

---

## FASE 5 — FEATURES ADICIONALES

### FEAT-01: Banner de perfil personalizable

**Funcionalidad:**
- El usuario puede subir una imagen como banner/portada de su perfil
- Dimensiones recomendadas: 1500×500px. Mínimo aceptable: 750×250px
- Límite de tamaño: 5MB
- Formatos aceptados: JPG, PNG, WebP
- La imagen se recorta y centra automáticamente en la proporción del banner (3:1)
- Endpoint: `POST /api/users/me/banner` (multipart/form-data)

**UX:**
1. En el perfil propio: zona de banner con botón "Cambiar portada" (hover overlay)
2. Click → file picker nativo filtrado por imagen
3. Preview antes de confirmar (usar `URL.createObjectURL`)
4. Botones "Confirmar" y "Cancelar" sobre el preview
5. Feedback de carga y error inline, sin alerts nativos

### FEAT-02: Search — tab de Series

**Problema:** En `/search` hay tabs para Películas, Personas y Usuarios, pero no hay tab de Series.

**Fix:**
1. Añadir tab "Series" entre Películas y Personas
2. Endpoint: `GET /api/search/tv?q=:query` — busca en TMDB `search/tv`
3. Los resultados de series siguen el mismo card visual que las películas pero con badge "Serie"
4. Al hacer click en una serie va a `/tv/:id` (si existe `TVDetail`) o placeholder

### FEAT-03: TV Detail

**Ruta:** `src/features/tv/TVDetail.tsx`

**Debe tener el mismo aspecto visual que `MovieDetail` con estas diferencias:**
- Sección de temporadas y episodios (acordeón por temporada)
- Cada episodio muestra: número, título, duración, sinopsis corta
- Sección "Dónde ver" con los proveedores reales (usar `GET /tv/:id/watch/providers` de TMDB, mismo approach que movies)
- El navbar es el mismo que el de `MovieDetail` (ya resuelto en UI-01)

---

## REGLAS GENERALES PARA COPILOT

1. **Nunca usar `alert()`, `confirm()` o `prompt()`** — siempre feedback inline o toast
2. **Nunca hardcodear datos** en componentes React — todo viene de API o de `import.meta.env`
3. **Siempre manejar los 3 estados de async:** loading (skeleton), error (mensaje inline con retry), success
4. **Commits en español**, mensajes descriptivos. Ejemplo: `feat(activity): implementar feed de actividad con tabs amigos/tú`
5. **Naming en español** para variables de dominio: `pelicula`, `resena`, `entrada`, `buscador` — no `movie`, `review`, `entry`, `search` en la lógica de negocio
6. **No duplicar componentes** — si ya existe un modal o card similar, extenderlo antes de crear uno nuevo
7. **CSS-first para responsive** — media queries y `clamp()`, no lógica JS con `useResponsive` o `window.innerWidth`
8. **Cada nueva página** tiene su propio `<title>` y `<meta name="description">` vía `react-helmet-async`
9. **Importar desde `@/`** siempre, nunca imports relativos con más de 2 niveles (`../../..`)
10. **Todo componente nuevo** sigue el composition pattern con namespace TypeScript — no boolean props
