# Auditoría Técnica Completa del Sistema de Búsqueda (CineVault)

Fecha: 2026-03-14

Este documento describe el sistema real implementado en backend/frontend, con referencias a archivos y líneas y extractos de código para exportación/revisión.

---

## 1) Mapa de archivos del sistema de búsqueda

### Backend

- `backend/src/controllers/SearchController.ts`
- `backend/src/services/search.services.ts`
- `backend/src/helpers/titleRanking.ts`
- `backend/src/helpers/fetchTMDB.ts`
- `backend/src/routes/search.routes.ts`
- `backend/src/config/redis.ts`
- `backend/src/services/security.services.ts`

### Frontend

- `frontend/src/services/searchServices.ts`
- `frontend/src/pages/SearchResults.tsx`

---

## 2) Responsabilidad, exports y tipos por archivo

### 2.1 `backend/src/controllers/SearchController.ts`

**Responsabilidad**
- Orquestar búsqueda unificada (movie/person/tv).
- Construir pool de candidatos y expansión por personas/tokens.
- Calcular `smart_rank` y aplicar reglas de orden fuertes.
- Exponer endpoints HTTP (`/search`, `/search/debug`, etc).
- Gestionar caché Redis y rate limiting por IP.

**Extracto (constantes, pesos y cache version)**
```ts
// SearchController.ts L18-L43 aprox
const TTL_BUSQUEDA = 60 * 60 * 2
const SEARCH_PAGE_SIZE = 20
const FIRST_PAGE_CANDIDATE_PAGES = ["1", "2", "3"]
const SEARCH_CACHE_VERSION = "v18"

const getEnvNumber = (name: string, fallback: number) => {
  const raw = process.env[name]
  if (raw === undefined || raw === null || String(raw).trim() === "") return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

const TITLE_EXACT_BOOST = getEnvNumber("SEARCH_TITLE_EXACT_BOOST", 4200)
const TITLE_SOURCE_BOOST = getEnvNumber("SEARCH_TITLE_SOURCE_BOOST", 1200)
const TOKEN_SOURCE_BOOST = getEnvNumber("SEARCH_TOKEN_SOURCE_BOOST", 800)
const DIRECTOR_CREDIT_BOOST = getEnvNumber("SEARCH_DIRECTOR_CREDIT_BOOST", 700)
const ACTOR_CREDIT_BOOST = getEnvNumber("SEARCH_ACTOR_CREDIT_BOOST", 450)
const TV_SOURCE_BOOST = getEnvNumber("SEARCH_TV_SOURCE_BOOST", 2200)
const TV_EXACT_BOOST = getEnvNumber("SEARCH_TV_EXACT_BOOST", 5000)
const LOCAL_VAULT_BOOST = getEnvNumber("SEARCH_LOCAL_VAULT_BOOST", 240)
const LOCAL_REVIEW_BOOST = getEnvNumber("SEARCH_LOCAL_REVIEW_BOOST", 180)
const LOCAL_WATCHLIST_BOOST = getEnvNumber("SEARCH_LOCAL_WATCHLIST_BOOST", 90)
const PERSON_STRONG_MATCH_BOOST = getEnvNumber("SEARCH_PERSON_STRONG_MATCH_BOOST", 3600)
const TV_NON_EXACT_PENALTY = getEnvNumber("SEARCH_TV_NON_EXACT_PENALTY", 1200)
const VOTE_COUNT_BOOST_WEIGHT = getEnvNumber("SEARCH_VOTE_COUNT_BOOST_WEIGHT", 700)
const VOTE_AVERAGE_BOOST_WEIGHT = getEnvNumber("SEARCH_VOTE_AVERAGE_BOOST_WEIGHT", 140)
```

**Tipos definidos**
```ts
// SearchController.ts L47-L60 aprox
type PersonRole = "director" | "actor"

type PersonCandidate = {
  id: number
  name: string
  popularity?: number
  profile_path?: string | null
  known_for_department?: string
  known_for?: Array<{ id: number; title?: string; name?: string; poster_path?: string | null }>
}

type MovieAggregate = {
  movie: any
  hasTitleSource: boolean
  hasTokenSource: boolean
  tokenMatches: number
  personRoleScore: number
}
```

**Funciones exportadas**
- `getTVDetail`
- `getSearch`
- `getSearchDebug`
- `getMultiSearch`
- `getPersonSearch`
- `getMovieSearch`
- `getMovieGenres`
- `getTVSearch`

---

### 2.2 `backend/src/services/search.services.ts`

**Responsabilidad**
- Tokenización y análisis de intención.
- Fuzzy matching con Levenshtein.
- Enriquecimiento local (vault/reviews/watchlist por `tmdb_id`).

**Tipos definidos**
```ts
// search.services.ts L3-L24 aprox
type SearchIntent = "persona" | "titulo" | "contexto" | "mixto"

type QueryAnalizado = {
  raw: string
  tokens: string[]
  tipo_detectado: SearchIntent
  estrategia: string[]
  queries_tmdb: {
    buscar_personas: boolean
    buscar_peliculas: boolean
    buscar_tv: boolean
    termino_persona?: string
    termino_pelicula?: string
    termino_tv?: string
  }
}

type LocalCounts = {
  vault_count: number
  review_count: number
  watchlist_count: number
}
```

**Funciones exportadas**
- `tokenizarQuery`
- `levenshtein`
- `fuzzyMatch`
- `fuzzyTokenMatchAny`
- `analizarQuery`
- `enriquecerConDatosLocales`
- type exports: `QueryAnalizado`, `SearchIntent`, `LocalCounts`

**Extracto fuzzy**
```ts
// search.services.ts L87-L99 aprox
export function fuzzyMatch(token: string, objetivo: string): boolean {
  const t = normalizeToken(token)
  const o = normalizeToken(objetivo)

  if (!t || !o) return false
  if (o.includes(t)) return true

  const distanciaMaxima = t.length >= 6 ? 2 : t.length >= 4 ? 1 : 0
  if (levenshtein(t, o) <= distanciaMaxima) return true

  const words = o.split(/[^a-z0-9]+/).filter(Boolean)
  return words.some((word) => word.includes(t) || levenshtein(t, word) <= distanciaMaxima)
}
```

---

### 2.3 `backend/src/helpers/titleRanking.ts`

**Responsabilidad**
- Ranking léxico base (`title_rank`).
- Merge EN/ES y títulos alternativos.

**Funciones exportadas**
- `rankMovieByQuery`
- `mergeEnglishAndSpanishResults`
- `attachAlternativeTitles`

**Extracto pesos por campo de título**
```ts
// titleRanking.ts L16-L18 aprox
const ENGLISH_TITLE_FIELD_WEIGHT = 3000
const ORIGINAL_TITLE_FIELD_WEIGHT = 2000
const LOCALIZED_TITLE_FIELD_WEIGHT = 1000
```

**Extracto matchStrength**
```ts
// titleRanking.ts L30-L42 aprox
const matchStrength = (candidate: string, query: string) => {
  if (!candidate || !query) return 0
  if (candidate === query) return 100
  if (candidate.startsWith(query)) return 70
  if (candidate.includes(query)) return 40

  const queryTokens = query.split(/\s+/).filter(Boolean)
  if (queryTokens.length > 1 && queryTokens.every((token) => candidate.includes(token))) {
    return 25
  }

  return 0
}
```

**Extracto rankMovieByQuery**
```ts
// titleRanking.ts L77-L114 aprox
export const rankMovieByQuery = (movie: SearchMovieLike, rawQuery: string) => {
  const query = normalizeText(rawQuery)
  if (!query) return 0

  // ... construye candidatos EN / original / localized con pesos
  // ... suma weight + strength por candidato válido

  score += Number(movie.popularity || 0) * 0.01
  score += Number(movie.vote_count || 0) * 0.0001

  return score
}
```

---

### 2.4 `backend/src/helpers/fetchTMDB.ts`

**Responsabilidad**
- Wrapper de TMDB con idioma default y headers de autorización.

**Función exportada**
- `consultarTMDB`

**Extracto clave**
```ts
// fetchTMDB.ts L10-L22 aprox
export const consultarTMDB = async (endpoint: string, params: Record<string, string> = {}, options = {}) => {
  const defaultLanguage = options.defaultLanguage || "es-ES"
  const includeDefaultLanguage = options.includeDefaultLanguage ?? true

  const hasExplicitLanguage = Object.prototype.hasOwnProperty.call(params, "language")

  if (includeDefaultLanguage && !hasExplicitLanguage && defaultLanguage) {
    normalizedParams.set("language", defaultLanguage)
  }

  // ... arma URL https://api.themoviedb.org/3/${endpoint}?...
}
```

---

### 2.5 `backend/src/routes/search.routes.ts`

**Responsabilidad**
- Declarar rutas HTTP de búsqueda.

**Rutas**
```ts
router.get("/", manejadorAsincrono(getSearch))
router.get("/debug", manejadorAsincrono(getSearchDebug))
router.get("/multi", manejadorAsincrono(getMultiSearch))
router.get("/movie", manejadorAsincrono(getMovieSearch))
router.get("/genres/movie", manejadorAsincrono(getMovieGenres))
router.get("/person", manejadorAsincrono(getPersonSearch))
router.get("/tv", manejadorAsincrono(getTVSearch))
router.get("/tv/:id", manejadorAsincrono(getTVDetail))
```

---

### 2.6 `backend/src/config/redis.ts`

**Responsabilidad**
- Cache helper `getOSet` y funciones de invalidación.

**Extracto**
```ts
// redis.ts L25-L38 aprox
const TTL_DEFAULT = 60 * 5

export const getOSet = async <T>(key: string, fn: () => Promise<T>, ttl: number = TTL_DEFAULT): Promise<T> => {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached) as T

  const resultado = await fn()
  await redis.setex(key, ttl, JSON.stringify(resultado))
  return resultado
}
```

---

## 3) Endpoints TMDB exactos, orden y condiciones

### 3.1 En búsqueda general unificada (`runSmartUnifiedSearch`)

Se dispara un `Promise.all` condicional:
```ts
// SearchController.ts L510-L526 aprox
const [movieData, personData, tvData] = await Promise.all([
  queries_tmdb.buscar_peliculas ? runRankedMovieSearch(...) : Promise.resolve(EMPTY_SEARCH_PAYLOAD),
  queries_tmdb.buscar_personas ? consultarTMDB("search/person", { query, page }, { includeDefaultLanguage: false }) : Promise.resolve(EMPTY_SEARCH_PAYLOAD),
  queries_tmdb.buscar_tv ? consultarTMDB("search/tv", { query, page }, { includeDefaultLanguage: false }) : Promise.resolve(EMPTY_SEARCH_PAYLOAD),
])
```

### 3.2 Endpoints TMDB usados en el pipeline

1. `search/movie` (EN): query, page, optional with_genres
2. `search/movie` (ES): query, page, optional with_genres, language=es-ES
3. `movie/{id}/credits` (language=en-US)
4. `movie/{id}/alternative_titles`
5. `search/person` (query principal)
6. `search/person` por token (si corresponde)
7. `person/{id}/movie_credits` para expansión persona->películas
8. `search/movie` por token (si intención persona/mixto y query combinado)
9. `search/tv` (query principal)
10. fallback combinado: `search/movie` + `search/tv` por token
11. endpoints dedicados:
- `search/multi`
- `genre/movie/list`
- `tv/{id}` con append_to_response

### 3.3 Paralelo vs secuencial

- Paralelo:
1. movie/person/tv base en `Promise.all`
2. EN/ES movie por page en `Promise.all`
3. credits + alternative_titles por película en `Promise.all`
4. fallback movie/tv por token en `Promise.all`
- Secuencial controlado por lotes:
1. `pMap` para pages y para tokens con concurrencia limitada.

---

## 4) Análisis de intención

### 4.1 Detección

```ts
// search.services.ts L111+ aprox
const hasTwoCapitalizedWords = /\b[A-Z][a-z]+\b\s+\b[A-Z][a-z]+\b/.test(raw.trim())
const hasPersonContext = PERSON_CONTEXT_HINT.test(raw)
const tokensImprobables = tokens.filter((token) => token.length >= 4 && !NON_PERSON_HINTS.test(token))
const hasLongTokenPair = tokens.length === 2 && tokens.every((token) => token.length >= 5)
```

### 4.2 Reglas exactas

1. Tipo `persona`:
- `tokens.length <= 2 && (hasTwoCapitalizedWords || hasPersonContext)`
- Activa solo personas (`buscar_personas=true`, `buscar_peliculas=false`, `buscar_tv=false`).

2. Tipo `mixto`:
- `(tokens.length >= 3 && tokensImprobables.length >= 2) || hasLongTokenPair`
- Activa personas + películas + TV.

3. Tipo `titulo/contexto` (default):
- Personas false, películas true, TV true.

---

## 5) Pipeline de candidatos

1. Pool movie inicial: `runRankedMovieSearch`.
2. Pool people inicial: `search/person` principal + `search/person` por tokens (si aplica).
3. `collectPersonCandidates` deduplica por id y scorea candidatos persona.
4. `runPersonMovieMatches` expande persona a movie credits (`crew` director, `cast` actor).
5. `mergeMovieFromTitleSearch` y `mergeMovieFromPersonCredit` unen señales en `movieMap`.
6. Si query combinado y tipo persona/mixto: expansión adicional movie por token (`mergeMovieFromTokenSearch`).
7. Se aplica enriquecimiento local por `tmdb_id`.
8. Se calcula `smart_rank`.
9. Filtro de calidad (`hasMinimumMetadata`).
10. Orden y reglas fuertes.

Los candidatos no son anónimos: llevan flags de origen (`hasTitleSource`, `hasTokenSource`, `tokenMatches`, `personRoleScore`).

---

## 6) Algoritmo de scoring completo

### 6.1 Fórmula de `smart_rank`

```ts
// SearchController.ts L604-L614 aprox
const score =
  titleRank +
  titleSourceBoost +
  tokenSourceBoost +
  exactTitleBoost +
  exactTokenBoost +
  fuzzyBoost +
  contextualTokenBoost +
  personBoost +
  strongPersonMatchBoost +
  localBoost +
  tmdbSignal.total
```

### 6.2 Cálculo de cada componente

- `titleRank`: `rankMovieByQuery(movie, query)`.
- `titleSourceBoost`: 1200 por default si vino del search por título.
- `tokenSourceBoost`: 800 por default si vino de expansión por token.
- `exactTitleBoost`: 4200 por default si hay exact match del query en títulos normalizados.
- `exactTokenBoost`: 3200 si query tiene >1 token y alguno coincide exacto.
- `fuzzyBoost`: 900 si fuzzy de tokens contra títulos.
- `contextualTokenBoost`: `tokenMatches * 550`.
- `personBoost`: `personRoleScore * personIntentMultiplier`.
- `strongPersonMatchBoost`: 3600 por default si hay señal de persona y fuzzy en contexto.
- `localBoost`: log score con vault/reviews/watchlist.
- `tmdbSignal.total`: vote_count + vote_average ponderados.

### 6.3 `tmdb_rating_signal`

```ts
// SearchController.ts L462-L473 aprox
const voteCountBoost = Math.log10(voteCount + 1) * VOTE_COUNT_BOOST_WEIGHT
const voteAverageBoost = Math.max(0, Math.min(voteAverage, 10)) * VOTE_AVERAGE_BOOST_WEIGHT
total = voteCountBoost + voteAverageBoost
```

### 6.4 `local_boost`

```ts
// SearchController.ts L448-L460 aprox
vault = Math.log10(vault_count + 1) * LOCAL_VAULT_BOOST
reviews = Math.log10(review_count + 1) * LOCAL_REVIEW_BOOST
watchlist = Math.log10(watchlist_count + 1) * LOCAL_WATCHLIST_BOOST
local_boost = vault + reviews + watchlist
```

### 6.5 Variables de entorno y defaults

- `SEARCH_TITLE_EXACT_BOOST` default `4200`
- `SEARCH_TITLE_SOURCE_BOOST` default `1200`
- `SEARCH_TOKEN_SOURCE_BOOST` default `800`
- `SEARCH_DIRECTOR_CREDIT_BOOST` default `700`
- `SEARCH_ACTOR_CREDIT_BOOST` default `450`
- `SEARCH_TV_SOURCE_BOOST` default `2200`
- `SEARCH_TV_EXACT_BOOST` default `5000`
- `SEARCH_LOCAL_VAULT_BOOST` default `240`
- `SEARCH_LOCAL_REVIEW_BOOST` default `180`
- `SEARCH_LOCAL_WATCHLIST_BOOST` default `90`
- `SEARCH_PERSON_STRONG_MATCH_BOOST` default `3600`
- `SEARCH_TV_NON_EXACT_PENALTY` default `1200`
- `SEARCH_VOTE_COUNT_BOOST_WEIGHT` default `700`
- `SEARCH_VOTE_AVERAGE_BOOST_WEIGHT` default `140`

---

## 7) Fuzzy matching

### 7.1 Dónde se aplica

- No se aplica para modificar directamente el query TMDB.
- Se aplica para score interno sobre resultados/candidatos:
1. nombres de persona
2. títulos relacionados (`known_for`)
3. títulos de película
4. contexto (`title + overview + overview_es`)

### 7.2 Algoritmo

- Levenshtein (`levenshtein` en `search.services.ts`).

### 7.3 Umbrales

```ts
// search.services.ts L94 aprox
const distanciaMaxima = t.length >= 6 ? 2 : t.length >= 4 ? 1 : 0
```

### 7.4 Interacción con boosts de persona

- `person_role_boost`: depende de créditos (director/actor) y del `personIntentMultiplier`.
- `strong_person_match_boost`: solo si `personRoleScore > 0` y además fuzzy del query contra contexto de película.

---

## 8) Reglas de ordenamiento fuertes

### 8.1 Orden de películas

```ts
// SearchController.ts L727-L739 aprox
rankedMovies.sort((a, b) => {
  const aExact = hasExactTitleMatch(a, normalizedQuery)
  const bExact = hasExactTitleMatch(b, normalizedQuery)

  if (aExact && bExact) {
    const byVotes = Number(b.vote_count || 0) - Number(a.vote_count || 0)
    if (byVotes !== 0) return byVotes
  }

  if (aExact !== bExact) return aExact ? -1 : 1

  return Number(b._smart_rank || 0) - Number(a._smart_rank || 0)
})
```

### 8.2 Forzado top en persona/mixto

```ts
// SearchController.ts L741-L747 aprox
if (currentPage === 1 && (analisis.tipo_detectado === "persona" || analisis.tipo_detectado === "mixto")) {
  const forcedTopMovie = rankedMovies.find(
    (movie) => Number(movie?._score_debug?.strong_person_match_boost || 0) > 0
  )
  if (forcedTopMovie) rankedMovies = [forcedTopMovie, ...rankedMovies.filter((m) => m.id !== forcedTopMovie.id)]
}
```

### 8.3 Promoción TV exacta condicionada

```ts
// SearchController.ts L755-L766 aprox
const hasExactMovieMatch = rankedMovies.some((movie) => hasExactTitleMatch(movie, normalizedQuery))
const exactTVMatches = rankedTV.filter((tv) => hasExactTVNameMatch(tv, normalizedQuery)).slice(0, 2)
if (exactTVMatches.length > 0 && !hasExactMovieMatch) {
  // promueve TV exacta al frente
}
```

---

## 9) Filtros de calidad

### 9.1 Descarte total

```ts
// SearchController.ts L476-L480 aprox
const hasMinimumMetadata = (item: AnyRecord) => {
  const hasPoster = Boolean(item?.poster_path)
  const hasOverview = normalizeQuery(String(item?.overview || "")).length > 0
  return hasPoster && hasOverview
}
```

Aplicado en:
- `rankedMovies = rankedMovies.filter(hasMinimumMetadata)`
- `rankedTV = rankedTV.filter(hasMinimumMetadata)`

### 9.2 Degradación en vez de descarte

- Para TV no exacta: penaliza score (`-TV_NON_EXACT_PENALTY`) en vez de eliminar.

---

## 10) Señales locales (vault/reviews/watchlist)

### 10.1 Obtención

```ts
// search.services.ts L176-L191 aprox
refs = await prisma.movies_ref.findMany({
  where: { tmdb_id: { in: tmdbIds } },
  select: {
    tmdb_id: true,
    _count: {
      select: {
        vault: true,
        reviews: true,
        watchlist: true,
      },
    },
  },
})
```

### 10.2 Cache

- No hay cache dedicada para `enriquecerConDatosLocales`.
- Sí quedan cacheados indirectamente en la respuesta de búsqueda completa (`getSearch`) vía Redis:
  - TTL búsqueda general: `TTL_BUSQUEDA = 2h`.
  - Clave versionada: `tmdb:search:v18:...`

---

## 11) Endpoints de API interna (proyecto)

- `GET /api/search`
- `GET /api/search/debug`
- `GET /api/search/multi`
- `GET /api/search/movie`
- `GET /api/search/person`
- `GET /api/search/tv`
- `GET /api/search/tv/:id`
- `GET /api/search/genres/movie`

Rutas en: `backend/src/routes/search.routes.ts`.

---

## 12) Frontend: consumo y navegación

### 12.1 Cliente de búsqueda

```ts
// frontend/src/services/searchServices.ts L84-L123 aprox
const scopePath = {
  general: '/api/search',
  debug: '/api/search/debug',
  multi: '/api/search/multi',
  movie: '/api/search/movie',
  person: '/api/search/person',
  tv: '/api/search/tv',
}

export async function searchMoviesDebug(query: string, page = 1) {
  return runSearch('debug', { query, page })
}
```

### 12.2 Navegación por tipo

```ts
// frontend/src/pages/SearchResults.tsx L87-L96 aprox
function navigateByResultType(navigate, item) {
  if (item.media_type === 'person') return navigate(`/person/${item.id}`)
  if (item.media_type === 'tv') return navigate(`/tv/${item.id}`)
  return navigate(`/movie/${item.id}-${createSlug(label)}`)
}
```

### 12.3 Modo debug UI

- `debug=1` en query string activa fetch a `/api/search/debug` en tab all.

---

## 13) Conclusión técnica corta

El sistema actual es híbrido: intención + expansión + ranking léxico + señales TMDB + señales locales, con reglas de orden fuertes y caché versionada. No usa un promedio único; usa suma ponderada de componentes y reglas determinísticas adicionales en ordenamiento.
