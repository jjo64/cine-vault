---
name: component-refactor-checklist
description: >
  Checklist universal de calidad para refactorizar cualquier componente CineVault.
  Define qué preguntas hacerse antes de tocar un archivo, cómo estructurar el output
  y cómo verificar que nada se rompió. Usar siempre antes de empezar un refactor
  en el frontend de CineVault.
---

# Skill: Component Refactor Checklist — CineVault

## Contexto

CineVault es un TFG en producción con dos desarrolladores de distinto nivel. Este checklist
asegura que cualquier refactor, sin importar quién lo haga, sea:
- **Seguro**: no rompe funcionalidad existente
- **Consistente**: sigue los mismos patrones del codebase
- **Verificable**: hay pasos objetivos para confirmar que funciona

Este checklist se usa **antes, durante y después** de cada refactor de componente.
Para refactores de archivos específicos, consultar también las skills especializadas:
- `homelogged-refactor` — para `HomeLogged.tsx` y god components similares
- `css-migration-cinevault` — para migrar inline styles

---

## Fase PRE-REFACTOR — Antes de escribir una sola línea

### 1. Entender el componente

Responder estas preguntas antes de empezar:

- [ ] **¿Qué hace este componente?** (describir en 1 oración)
- [ ] **¿Qué datos recibe por props?** (listar)
- [ ] **¿Qué datos fetcha por sí mismo?** (listar endpoints)
- [ ] **¿Qué estado local tiene?** (listar useState)
- [ ] **¿Qué efectos secundarios tiene?** (listar useEffect)
- [ ] **¿Qué renders condicionales tiene?** (loading, error, empty, data)
- [ ] **¿Qué sub-componentes o helpers define inline?**
- [ ] **¿Qué class names del CSS externo usa?**

### 2. Identificar el tipo de problema

| Síntoma | Tipo de refactor | Skill a usar |
|---|---|---|
| +300 líneas en un solo archivo | God component → descomposición | `homelogged-refactor` |
| Inline styles con `C.accent`, `C.bg`, etc. | CSS migration | `css-migration-cinevault` |
| `useEffect` con 8+ dependencias | Extraer hook | Este checklist |
| Tipos inline no exportados | Mover a `types.ts` | Este checklist |
| Server state sin Zustand | Extraer store por feature | Este checklist |
| Lógica de API en el componente | Extraer a service | `senior-backend` |

### 3. Crear la rama y abrir PR borrador

```bash
git checkout -b refactor/<nombre-descriptivo>
# Ejemplo: refactor/extract-feed-hooks
```

Después de la **Fase 1** (tipos + constantes + store), abrir un PR borrador antes de escribir componentes:
```
Título: "[WIP] Propuesta arquitectura: <nombre del módulo>"
Descripción: listar tipos, store shape, y hooks planeados
```

> ⚠️ Esperar aprobación de Jo antes de continuar. La estructura es más fácil de corregir antes de que existan 20 archivos dependiendo de ella.

### 4. Snapshot visual (opcional pero recomendado)

Tomar una captura de pantalla del componente ANTES de empezar.
Comparar con el DESPUÉS para confirmar que no hay regresiones visuales.

---

## Fase DURANTE — Reglas de ejecución

### Reglas de oro

1. **Un solo cambio por commit**
   - `feat: extraer SafeImg a shared/components` ✅
   - `refactor: mover tipos + estilos + hooks + css` ❌

2. **Verificar después de cada extracción**
   ```bash
   npm run dev  # ¿Se ve igual?
   npx tsc --noEmit  # ¿Compila sin errores?
   ```

3. **No mejorar mientras se refactoriza**
   - Si encontrás un bug: abrí una issue, no lo arregles en el mismo commit
   - Si se te ocurre una mejora: comentá con `// TODO:`, no la implementes ahora
   - El objetivo es **mover** código, no **mejorar** comportamiento

4. **Respetar la estructura de carpetas feature-based**
   ```
   src/features/<feature-name>/
   ├── index.ts          ← barrel, solo exporta lo público
   ├── types.ts          ← interfaces y tipos del módulo
   ├── constants.ts      ← valores fijos del módulo
   ├── utils.ts          ← funciones helper puras
   ├── hooks/            ← custom hooks
   ├── components/       ← componentes React
   └── __tests__/        ← tests del módulo
   ```

5. **Nunca duplicar tipos**
   - Si `MovieMeta` existe en `movie-detail/types.ts`, importar de ahí
   - Si un tipo se usa en 2+ features, moverlo a `src/types/shared.ts`

### Convenciones de naming CineVault

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componente React | PascalCase | `TonightFilmCard.tsx` |
| Custom hook | camelCase con `use` | `useHomeData.ts` |
| CSS Module | mismo nombre que componente | `TonightFilmCard.module.css` |
| Tipo/Interface | PascalCase | `DiaryEntry`, `MovieMeta` |
| Constante de diseño | UPPER_CASE o objeto const | `C`, `SERIF`, `ZONES` |
| Función helper | camelCase | `toPoster`, `relativeLabel` |
| Service function | camelCase | `getMyLists`, `authorizedJson` |

> **Naming en español**: Los nombres de dominio de negocio en español (siguiendo la convención del proyecto)
> pero los patrones técnicos en inglés: `useHomeData` (técnico) vs `greetingName` (dominio → `nombreBienvenida` OK también)

---

## Fase POST-REFACTOR — Verificación

### Nivel 1: TypeScript

```bash
npx tsc --noEmit
```
- [ ] 0 errores
- [ ] 0 warnings (si hay, documentar por qué se aceptan)

### Nivel 2: Lint

```bash
npm run lint
```
- [ ] 0 errores de ESLint
- [ ] Prohibido añadir `// eslint-disable` sin comentario explicativo

### Nivel 3: Build

```bash
npm run build
```
- [ ] Build exitoso
- [ ] Sin warnings en la consola de Vite sobre imports circulares
- [ ] Sin warnings sobre chunks excesivamente grandes (si aparecen, considerar lazy loading)

### Nivel 4: Smoke test

```bash
npm run test
# o si no hay test runner configurado:
npm run dev
```
- [ ] El componente renderiza sin crashear
- [ ] Los datos se cargan correctamente desde la API
- [ ] Las interacciones del usuario funcionan (clicks, likes, navegación)

### Nivel 5: Visual

Comparar screenshot ANTES vs DESPUÉS:
- [ ] Colores idénticos
- [ ] Tipografías idénticas
- [ ] Espaciados iguales
- [ ] Animaciones funcionando
- [ ] No hay layout shifts

### Nivel 6: Responsive

Verificar en Chrome DevTools:
- [ ] 375px (iPhone SE) — sin overflow horizontal
- [ ] 768px (tablet) — layout correcto
- [ ] 1440px (desktop) — sin cambios respecto al original

### Nivel 7: Deploy check

```bash
git push origin refactor/<nombre>
```
- [ ] Vercel genera preview URL automáticamente
- [ ] Preview URL carga sin errores 404 ni errores de consola
- [ ] Las variables de entorno (`VITE_API_URL`) están disponibles en Vercel

---

## Qué hacer si algo se rompe

### Rompe TypeScript
```bash
# Ver error específico
npx tsc --noEmit 2>&1 | head -30
```
Causa más común: importar un tipo desde el módulo equivocado o renombrar un tipo sin actualizar todos los imports.

### Rompe el build de Vite
```bash
npm run build 2>&1
```
Causa más común: import circular entre `index.ts` → `ComponentA.tsx` → `index.ts`.
Solución: importar directamente desde el archivo, no desde el barrel.

### Visual diferente en producción vs dev
- Verificar que el CSS Module está siendo importado correctamente
- Verificar que no hay clases en `HomeLogged.css` que se estén aplicando globalmente y ahora falten

### Rollback de emergencia
```bash
git stash
# o
git checkout main
git branch -D refactor/<nombre>
```

---

## Template de PR Description

Usar este template al abrir el Pull Request:

```markdown
## Refactor: [Nombre del componente]

### ¿Qué cambió?
[Descripción de 2-3 líneas]

### Archivos creados
- `src/features/.../hooks/useX.ts` — [qué hace]
- `src/features/.../components/X.tsx` — [qué hace]

### Archivos modificados
- `ComponentOriginal.tsx` — [qué se removió]

### Archivos eliminados
- [ninguno / listar]

### ¿Cambió algún comportamiento?
No. Esta es una refactorización pura.

### Checklist
- [ ] `npx tsc --noEmit` ✅
- [ ] `npm run lint` ✅
- [ ] `npm run build` ✅
- [ ] Visual idéntico verificado
- [ ] Preview URL funcionando
```

---

## Anti-patrones a detectar en code review

Al revisar el código de un refactor, rechazar si:

| Anti-patrón | Por qué es un problema |
|---|---|
| Boolean props (`isActive`, `hasData`) | Viola el principio de composición de CineVault |
| `any` o `as unknown as X` | Rompe la seguridad de tipos |
| Colores hex directos en CSS (`color: #D4AF7A`) | Debe ser `var(--cv-accent)` |
| `useEffect` para calcular datos derivados | Usar `useMemo` |
| Fetch directo con `fetch()` en un componente | Debe ir en un service o custom hook |
| Importar desde `../../features/otro-feature/` | Viola el aislamiento feature-based |
| `console.log` sin eliminar | Código de debug en producción |
| Componente +200 líneas sin justificación | Necesita otra ronda de descomposición |
| Server state en `useState` local cuando hay store | Usar `useHomeStore` o el store del feature |
| Prop drilling de datos de API más de 1 nivel | Los componentes deben leer del store directamente |
| Store con lógica de fetch dentro | El store solo tiene estado; el fetch va en el hook `useXData` |
| Mutación directa del estado del store | Usar los actions del store (`setData`, `setReviews`, etc.) |
