---
name: refactor-cinevault
description: >
  Motor universal de refactor para cualquier archivo .tsx de CineVault.
  Analiza el archivo recibido, diagnostica sus problemas, genera la estructura
  objetivo y el plan de ejecución completo respetando la arquitectura feature-based,
  la paleta "Oro Silencioso" y los patrones del proyecto.
  Usar con: "Quiero refactorizar [Archivo.tsx], usando la skill refactor-cinevault..."
---

# Skill: Refactor — CineVault (Universal)

## Cómo usar esta skill

Proporcioná el archivo que querés refactorizar y esta skill genera un plan completo
y específico para ese archivo. El flujo es siempre el mismo:

```
1. DIAGNÓSTICO    → Analizar el archivo recibido
2. CLASIFICACIÓN  → Determinar qué tipo de problemas tiene
3. ESTRUCTURA     → Proponer la carpeta y archivos destino
4. PLAN           → Fases ordenadas con comandos exactos
5. TESTING        → Tests específicos para ese componente
6. CHECKLIST      → Verificación objetiva antes del PR
```

**Invocar con:**
> "Quiero refactorizar `Feed.tsx`, usando la skill `refactor-cinevault` comprueba el archivo y genera el plan."

---

## PASO 1 — DIAGNÓSTICO AUTOMÁTICO

Al recibir un archivo `.tsx`, responder estas preguntas antes de proponer nada:

### A. Radiografía del componente

| Pregunta | Buscar en el código |
|---|---|
| ¿Cuántas líneas tiene? | Contar líneas totales |
| ¿Cuál es su ruta actual? | Path del archivo |
| ¿Ya vive en `src/features/`? | Si está en `src/pages/` o `src/components/` necesita moverse |
| ¿Tiene un `.css` o `.module.css` asociado? | Importa `'./X.css'`? |
| ¿Cuántos `useState` tiene? | Contar llamadas a `useState(` |
| ¿Cuántos `useEffect` tiene? | Contar llamadas a `useEffect(` |
| ¿Cuántos `useMemo` / `useCallback` tiene? | Contar |
| ¿Define tipos localmente? | `type X =` o `interface X` dentro del archivo |
| ¿Define constantes de diseño inline? | `C.accent`, `SERIF`, `SANS`, hex `#` |
| ¿Define funciones `render*()` o helpers inline? | `const renderX = () =>`, `function Img(` |
| ¿Fetcha datos directamente? | `fetch(`, `authorizedJson(`, `axios.` |
| ¿Tiene lógica optimista (optimistic update)? | setState + rollback en catch |
| ¿Tiene inline styles? | `style={{ }}` |
| ¿Usa `any` o castings forzados? | `as any`, `as unknown as` |
| ¿Tiene boolean props? | Props como `isX`, `hasX`, `showX` |

### B. Tabla de diagnóstico — completar al analizar

```
DIAGNÓSTICO: [NombreArchivo.tsx]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Líneas totales:         [N]
Ruta actual:            [src/...]
Ya en features/:        [Sí / No → mover a src/features/X/]

INVENTARIO DE PROBLEMAS
━━━━━━━━━━━━━━━━━━━━━━━
useState locales:       [N] → [N] van al store, [N] se quedan
useEffect:              [N] → [lista de cuáles extraer a hooks]
Tipos inline:           [Sí/No] → mover a types.ts
Constantes de diseño:   [Sí/No] → mover a constants.ts
Funciones render*():    [N] → cada una se convierte en componente
Helpers inline:         [lista] → mover a utils.ts o shared/
Inline styles:          [Sí/No] → migrar con css-migration-cinevault
CSS global (.css):      [Sí/No] → migrar a .module.css
Fetch en componente:    [Sí/No] → extraer a hook/service
Boolean props:          [Sí/No] → refactorizar a composición
any / castings:         [N encontrados]

CLASIFICACIÓN FINAL
━━━━━━━━━━━━━━━━━━━
Tipo:  [God Component / Hook Complejo / Módulo sin feature / Solo CSS / Mixto]
Riesgo: [Alto / Medio / Bajo]  ← basado en si tiene lógica crítica (auth, pagos, etc.)
```

---

## PASO 2 — CLASIFICACIÓN

Según el diagnóstico, el componente cae en uno o más de estos tipos:

### Tipo A: God Component (+300 líneas, múltiples responsabilidades)
**Síntomas:** funciones `render*()`, muchos `useState`, tipos inline, constantes inline  
**Acción:** Descomposición completa en feature module  
**Estructura destino:** `src/features/<nombre>/` con `store/`, `hooks/`, `components/`

### Tipo B: Hook Complejo (useEffect con muchas dependencias / fetch mezclado)
**Síntomas:** 1-2 `useEffect` con 5+ llamadas async, lógica de transformación  
**Acción:** Extraer hook(s) dedicados  
**Estructura destino:** `src/features/<nombre>/hooks/useXData.ts`

### Tipo C: Módulo fuera de su lugar (vive en `pages/` o `components/` pero tiene lógica)
**Síntomas:** Ruta en `src/pages/X.tsx` pero tiene hooks, types, helpers propios  
**Acción:** Mover a `src/features/<nombre>/` con estructura completa  
**Nota:** No agrupa pages/ que son solo wrappers de features (esos pueden quedarse)

### Tipo D: CSS sin migrar (inline styles + .css global)
**Síntomas:** Muchos `style={{ }}`, importa `.css` sin `.module.css`  
**Acción:** Seguir `css-migration-cinevault` skill  
**Estructura destino:** `ComponentName.module.css` junto al `.tsx`

### Tipo E: Componente limpio, solo ajustes menores
**Síntomas:** <150 líneas, sin tipos inline, sin fetch directo  
**Acción:** Solo lint + pequeñas correcciones  
**No crear estructura nueva** — no vale la pena el overhead

---

## PASO 3 — ESTRUCTURA OBJETIVO

Generar la estructura de carpetas **específica para el archivo analizado**.

### Plantilla base (adaptar según diagnóstico)

```
src/features/<nombre-del-feature>/
├── index.ts                    ← barrel: solo exporta lo público del módulo
├── types.ts                    ← todos los tipos/interfaces del módulo
├── constants.ts                ← C{}, SERIF, SANS, IDs fijos, URLs base
├── utils.ts                    ← funciones puras sin side effects
├── store/
│   └── use<Nombre>Store.ts     ← Zustand store (solo si hay server state)
├── hooks/
│   ├── use<Nombre>Data.ts      ← fetch + escritura al store
│   ├── use<SubFuncion>.ts      ← un hook por responsabilidad lógica
│   └── ...
├── components/
│   ├── <Nombre>.tsx            ← componente principal (shell, ≤100 líneas)
│   ├── <Nombre>.module.css     ← estilos del shell
│   ├── shared/                 ← sub-componentes reutilizables del módulo
│   │   └── ...
│   └── <SubSeccion>/           ← una carpeta por sección visual grande
│       ├── <SubComp>.tsx
│       └── <SubComp>.module.css
└── __tests__/
    ├── <Nombre>.smoke.test.tsx
    └── use<Nombre>Data.test.ts
```

### Reglas de estructura

**Decidir si `store/` es necesario:**
- Hay server state que 2+ componentes en distintas rutas/features necesitan leer → **crear store**
- Todo el estado lo usa un solo componente o sub-componentes de la misma vista → **no crear store, usar useState + hook en el feature**
- No crear stores para datos efímeros de una sola página.

**Decidir si `shared/` es necesario:**
- Hay componentes inline que se repiten en múltiples páginas (`Navbar`, `Grain`, `SafeImg`, `Img`) → mover a **`src/components/shared/`** o **`src/components/layout/`**.
- Hay componentes que solo usa este feature → `src/features/<nombre>/components/shared/`.
- No duplicar componentes globales dentro de las carpetas de feature.

**Decidir si `constants.ts` es necesario:**
- El archivo tiene la paleta `C{}` inline → **siempre crear constants.ts**
- Solo tiene 1-2 constantes simples → pueden ir en el componente principal

---

## PASO 4 — PLAN DE EJECUCIÓN

Generar las fases **en este orden fijo**. Cada fase termina con un commit y una verificación.

### Fase 0 — Git setup
```bash
git checkout -b refactor/<nombre-kebab-case>
```

---

### Fase 1 — Tipos, constantes y store ⚠️ STOP → PR borrador para Jo

**Archivos a crear:**
1. `src/features/<nombre>/types.ts` — extraer todos los tipos inline
2. `src/features/<nombre>/constants.ts` — extraer `C{}`, tipografías, IDs
3. `src/features/<nombre>/utils.ts` — extraer helpers puros
4. *(si aplica)* `src/features/<nombre>/store/use<Nombre>Store.ts`

**Verificar:**
```bash
npx tsc --noEmit   # debe pasar (los tipos no se usan aún)
```

**Commit:**
```bash
git add src/features/<nombre>/types.ts src/features/<nombre>/constants.ts
git commit -m "refactor(<nombre>): extraer tipos, constantes y utils"
```

> 🛑 **Abrir PR borrador** con estos archivos. Esperar aprobación de Jo antes de continuar.
> Template del PR: ver sección "Template de PR" al final de esta skill.

---

### Fase 2 — Extraer shared components

Solo los helpers definidos inline que sean componentes visuales reutilizables.

**Por cada helper inline encontrado:**
1. Crear `src/features/<nombre>/components/shared/<NombreHelper>.tsx`
2. Si el helper ya existe en otro feature → importar desde `src/components/shared/`
3. En el archivo original: reemplazar la definición por el import

**Verificar:**
```bash
npm run dev        # visual idéntico
npx tsc --noEmit   # sin errores
```

**Commit por cada helper extraído:**
```bash
git commit -m "refactor(<nombre>): extraer <NombreHelper> a shared"
```

---

### Fase 3 — Extraer hooks

**Por cada responsabilidad de datos identificada:**

1. Crear `src/features/<nombre>/hooks/use<Nombre>Data.ts`
   - Contiene el `useEffect` de fetch
   - Si hay store: escribe con `store.setData(...)`, no retorna datos
   - Si no hay store: retorna `{ data, loading, error }`
   - **Preservar el patrón `let active = true` / `return () => { active = false }`**

2. Crear hooks adicionales para lógica de UI compleja:
   - Optimistic updates → `use<Nombre>Actions.ts`
   - Navegación/URL state → `use<Nombre>Navigation.ts`
   - Formularios → `use<Nombre>Form.ts`

**Verificar:**
```bash
npm run dev        # misma funcionalidad
npx tsc --noEmit
```

**Commit:**
```bash
git commit -m "refactor(<nombre>): extraer hook use<Nombre>Data"
```

---

### Fase 4 — Extraer sub-componentes

**Orden recomendado: de menos a más estado**
1. Componentes puramente visuales / estáticos primero (sin props de datos)
2. Componentes con props simples
3. Componentes que leen del store
4. El componente shell principal al final

**Por cada función `render*()` o bloque visual grande:**
1. Crear `src/features/<nombre>/components/<SubComp>.tsx`
2. Crear `src/features/<nombre>/components/<SubComp>.module.css` (ver `css-migration-cinevault`)
3. Los sub-componentes leen del store directamente — no prop drilling

**Verificar después de cada sub-componente:**
```bash
npm run dev        # visual idéntico en esa sección
npx tsc --noEmit
```

**Commit por cada sub-componente:**
```bash
git commit -m "refactor(<nombre>): extraer componente <SubComp>"
```

---

### Fase 5 — Ensamblar el componente principal limpio

El resultado esperado: **≤100 líneas**, sin tipos inline, sin constantes inline, sin helpers inline.

```tsx
// Estructura tipo del componente principal post-refactor:
export default function <Nombre>(<props mínimas>) {
  // 1. Hooks de datos (disparan carga, no retornan datos si hay store)
  use<Nombre>Data()

  // 2. Hooks de UI
  const { ... } = use<Nombre>Navigation()

  // 3. Estado de loading/error del store (si aplica)
  const { loading, error } = use<Nombre>Store((s) => ({ loading: s.loading, error: s.error }))

  return (
    <div className={styles.root}>
      {/* Sub-componentes, no JSX inline */}
      <SubComponenteA />
      <SubComponenteB />
    </div>
  )
}
```

**Verificar:**
```bash
npm run dev        # funcionalidad completa
npx tsc --noEmit
```

---

### Fase 6 — CSS Migration

Seguir la skill `css-migration-cinevault` para:
- Convertir inline styles a `.module.css`
- Reemplazar colores hex por `var(--cv-*)`
- Reemplazar handlers JS de hover por `:hover` CSS
- Crear/actualizar `src/styles/tokens.css` si falta alguna variable

**Verificar:**
```bash
npm run dev        # visual EXACTAMENTE igual
```

---

### Fase 7 — Lint, build y cleanup

```bash
npm run lint       # 0 errores, 0 warnings
npx tsc --noEmit   # 0 errores
npm run build      # build exitoso
```

Limpiar:
- Borrar `console.log` sin propósito
- Borrar imports no usados
- Asegurar que el archivo `.css` original (si existía) está vacío o eliminado si todo migró a modules

**Commit final:**
```bash
git commit -m "refactor(<nombre>): lint, build limpio, cleanup"
```

---

## PASO 5 — TESTING

Generar tests **específicos para el archivo analizado**. Adaptar según qué hace el componente.

### Smoke test base (siempre)

```ts
// src/features/<nombre>/__tests__/<Nombre>.smoke.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import <Nombre> from '../components/<Nombre>'
// Si tiene store:
// import { use<Nombre>Store } from '../store/use<Nombre>Store'

// Si tiene store — resetear antes de cada test
// beforeEach(() => {
//   use<Nombre>Store.setState({ loading: false, error: null, ... })
// })

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
)

describe('<Nombre> — smoke tests', () => {
  it('renderiza sin crashear', () => {
    render(<<Nombre> />, { wrapper: Wrapper })
    // Buscar algo que SIEMPRE debe aparecer en el componente
    expect(screen.getByRole('[rol apropiado]')).toBeInTheDocument()
  })

  it('muestra loading state cuando loading=true', () => {
    // Si tiene store:
    // use<Nombre>Store.setState({ loading: true })
    render(<<Nombre> />, { wrapper: Wrapper })
    expect(screen.getByText(/[texto de loading del componente]/i)).toBeInTheDocument()
  })

  it('muestra error state cuando hay error', () => {
    // Si tiene store:
    // use<Nombre>Store.setState({ loading: false, error: 'Error de prueba' })
    render(<<Nombre> />, { wrapper: Wrapper })
    expect(screen.getByText(/[texto de error del componente]/i)).toBeInTheDocument()
  })
})
```

### Tests de hooks (si se extrajeron hooks con lógica)

```ts
// src/features/<nombre>/__tests__/use<Nombre>Navigation.test.ts
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { use<Nombre>Navigation } from '../hooks/use<Nombre>Navigation'

// Adaptar según qué hace el hook:
test('estado inicial correcto', () => {
  const { result } = renderHook(() => use<Nombre>Navigation(), {
    wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>
  })
  expect(result.current.[estado]).toBe([valor esperado])
})
```

### Tests de interacciones con optimistic update (si aplica)

```ts
it('hace rollback si el like falla', async () => {
  // Mock del endpoint para que falle
  // Verificar que el estado vuelve al valor original
})
```

---

## PASO 6 — CHECKLIST FINAL

Completar antes de pedir review a Jo:

### Estructura
- [ ] Feature vive en `src/features/<nombre>/`
- [ ] `index.ts` solo exporta el componente principal
- [ ] `types.ts` tiene todos los tipos — ninguno definido inline en componentes
- [ ] `constants.ts` tiene la paleta y constantes — ningún hex directo en componentes
- [ ] Componente principal tiene ≤100 líneas
- [ ] Cada sub-componente tiene su propio `.module.css`

### Estado
- [ ] Server state en Zustand store (si aplica)
- [ ] UI state efímero en `useState` local del componente que lo usa
- [ ] `useXData` hook no retorna datos si hay store — escribe al store
- [ ] No hay prop drilling de datos de API entre componentes

### Comportamiento
- [ ] Funcionalidad idéntica al componente original
- [ ] Optimistic updates funcionan con rollback correcto (si aplica)
- [ ] Sync con URL/searchParams funciona (si aplica)
- [ ] Lógica de navegación intacta

### Visual
- [ ] Colores son `var(--cv-*)` — sin hex directo en CSS
- [ ] Tipografías son `var(--cv-font-serif)` y `var(--cv-font-sans)`
- [ ] Hover que antes era JS ahora es `:hover` CSS
- [ ] Animaciones Framer Motion intactas
- [ ] Sin layout shifts en 375px / 768px / 1440px

### Build & Lint
- [ ] `npm run lint` — 0 errores
- [ ] `npx tsc --noEmit` — 0 errores
- [ ] `npm run build` — exitoso, sin warnings de chunks grandes
- [ ] Sin `console.log` en el código final

### Deploy
- [ ] Push a rama feature → Vercel genera preview automáticamente
- [ ] Preview URL carga sin errores 404 ni errores de consola
- [ ] PR listo para review con template completo

---

## Template de PR

```markdown
## Refactor: [NombreArchivo.tsx]

### Problema
[1-2 oraciones: qué estaba mal en el componente original]

### Solución
[1-2 oraciones: qué patrón se aplicó]

### Archivos creados
- `src/features/.../types.ts` — tipos del módulo
- `src/features/.../store/useXStore.ts` — Zustand store (si aplica)
- `src/features/.../hooks/useXData.ts` — lógica de fetch
- `src/features/.../components/X.tsx` — [qué hace]
... (listar todos)

### Archivos modificados
- `[ruta original]` — reducido a shell de ≤100 líneas

### Archivos eliminados
- `[X.css]` — migrado a CSS Modules por componente

### ¿Cambió algún comportamiento?
No. Esta es una refactorización pura.

### Screenshots
| Antes | Después |
|-------|---------|
| [img] | [img]   |

### Checklist
- [ ] `npx tsc --noEmit` ✅
- [ ] `npm run lint` ✅
- [ ] `npm run build` ✅
- [ ] Visual idéntico verificado en 375px / 1440px
- [ ] Preview URL funcionando: [URL]
```

---

## Restricciones globales — Siempre aplicar

### 🎨 Paleta "Oro Silencioso" — NUNCA modificar valores

```ts
// Si el componente usa estos valores, SOLO moverlos a constants.ts
// No cambiar ningún hex, no inventar variables nuevas
C.bg = '#080808'        → var(--cv-bg)
C.surface = '#111111'   → var(--cv-surface)
C.elevated = '#1A1A1A'  → var(--cv-elevated)
C.border = '#252525'    → var(--cv-border)
C.accent = '#D4AF7A'    → var(--cv-accent)
C.accentDim = '#9A7A48' → var(--cv-accent-dim)
C.text = '#E2E2E2'      → var(--cv-text)
C.textSoft = '#7A7A7A'  → var(--cv-text-soft)
C.textMuted = '#3A3A3A' → var(--cv-text-muted)
C.gold = '#C8A96E'      → var(--cv-gold)
SERIF = "'Cormorant Garamond', serif"  → var(--cv-font-serif)
SANS = "'Syne', sans-serif"            → var(--cv-font-sans)
```

### 🚫 Anti-patrones prohibidos (en cualquier archivo de CineVault)

| Anti-patrón | Qué hacer en su lugar |
|---|---|
| Boolean props (`isActive`, `hasData`) | Composición de componentes |
| `any` o `as unknown as X` | Tipos explícitos o genéricos |
| Hex directo en CSS | `var(--cv-*)` |
| `useEffect` para datos derivados | `useMemo` |
| `fetch()` directo en componente | Extraer a hook o service |
| Import `../../features/otro-feature/` | Solo importar desde `src/features/X/index.ts` |
| `console.log` en producción | Eliminar o usar logger |
| Store con lógica de fetch | Store = solo estado + actions; fetch va en hook |
| Prop drilling de API data >1 nivel | Componentes leen del store directamente |

### 📋 Convenciones de naming CineVault

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componente React | PascalCase | `FeedCard.tsx` |
| Custom hook | `use` + PascalCase | `useFeedData.ts` |
| Zustand store | `use` + Nombre + `Store` | `useFeedStore.ts` |
| CSS Module | mismo nombre que el `.tsx` | `FeedCard.module.css` |
| Tipo / Interface | PascalCase | `FeedItem`, `PostEntry` |
| Constante de diseño | objeto `const` o `UPPER_CASE` | `C`, `SERIF` |
| Helper puro | camelCase | `formatDate`, `toPoster` |
| Service function | camelCase | `getFeedPosts`, `likeReview` |
| Nombres de dominio | español | `entradaActiva`, `usuarioActual` |
| Patrones técnicos | inglés | `useZoneNavigation`, `setLoading` |

### 🔗 Skills relacionadas

- `css-migration-cinevault` — para la Fase 6 (migración de estilos)
- `component-refactor-checklist` — checklist de code review
- `react-composition` — cuando hay boolean props a eliminar
- `cinevault-context` — identidad de marca y voz de la app
