/**
 * @file searchUtils.ts
 * @description Motor de inteligencia y análisis de consultas para el buscador de CineVault.
 * Contiene algoritmos de procesamiento de lenguaje natural (tokenización, stop-words),
 * métricas de similitud de cadenas (Levenshtein) y lógica heurística para detectar
 * la intención de búsqueda del usuario.
 */

/** Intenciones de búsqueda detectadas por el motor */
export type SearchIntent = "persona" | "titulo" | "contexto" | "mixto"

/** Estructura resultante del análisis de una consulta */
export type QueryAnalizado = {
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

/** Contadores de registros locales matcheados */
export type LocalCounts = {
  vault_count: number
  review_count: number
  watchlist_count: number
}

/**
 * Conjunto de palabras irrelevantes (stop-words) en ES/EN que se filtran
 * durante la tokenización para enfocar la búsqueda en términos clave.
 */
const STOP_WORDS = new Set([
  "y",
  "e",
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "con",
  "en",
  "a",
  "o",
  "que",
  "the",
  "and",
  "of",
  "in",
  "movie",
  "film",
  "pelicula",
])

/** Heurísticas para detección de nombres y contextos de personas */
const NON_PERSON_HINTS = /^(bajo|alto|gran|pequeno|nuevo|viejo|old|new)$/i
const PERSON_CONTEXT_HINT = /(director|directora|actor|actriz|cast|starring)/i

const normalizeToken = (value: string) => value.trim().toLowerCase()

/**
 * Convierte una cadena de texto en un array de términos significativos.
 * Filtra términos cortos y palabras comunes.
 */
export const tokenizarQuery = (raw: string): string[] =>
  raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))

/**
 * Implementación del algoritmo de distancia de Levenshtein.
 * Calcula el número mínimo de ediciones (inserciones, borrados, sustituciones)
 * necesarias para transformar una cadena en otra.
 *
 * @param a - Primera cadena.
 * @param b - Segunda cadena.
 * @returns Entero representando la distancia.
 */
export function levenshtein(a: string, b: string): number {
  const source = a.toLowerCase()
  const target = b.toLowerCase()
  const m = source.length
  const n = target.length

  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (source[i - 1] === target[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

/**
 * Realiza una coincidencia difusa (Fuzzy Match) entre un término y un objetivo.
 * Utiliza Levenshtein con un umbral dinámico basado en la longitud del término.
 */
export function fuzzyMatch(token: string, objetivo: string): boolean {
  const t = normalizeToken(token)
  const o = normalizeToken(objetivo)

  if (!t || !o) return false
  if (o.includes(t)) return true

  // Tolerancia dinámica: términos largos permiten más errores tipográficos.
  const distanciaMaxima = t.length >= 6 ? 2 : t.length >= 4 ? 1 : 0
  if (levenshtein(t, o) <= distanciaMaxima) return true

  const words = o.split(/[^a-z0-9]+/).filter(Boolean)
  return words.some(
    (word) => word.includes(t) || levenshtein(t, word) <= distanciaMaxima
  )
}

/**
 * Verifica si alguno de los tokens proporcionados tiene una coincidencia difusa
 * con alguno de los candidatos.
 */
export const fuzzyTokenMatchAny = (tokens: string[], candidates: string[]) => {
  if (tokens.length === 0 || candidates.length === 0) return false

  const normalizedCandidates = candidates
    .map((value) => normalizeToken(value))
    .filter(Boolean)

  return tokens.some((token) =>
    normalizedCandidates.some((candidate) => fuzzyMatch(token, candidate))
  )
}

/**
 * Calcula un score de similitud específico para nombres de personas.
 * Otorga mayor peso si coinciden múltiples apellidos/nombres de forma fuerte.
 */
export function calcularPersonNameScore(
  query: string,
  nombrePersona: string
): number {
  const q = normalizeToken(query)
  const n = normalizeToken(nombrePersona)
  if (!q || !n) return 0

  const fullSim = 1 - levenshtein(q, n) / Math.max(q.length, n.length)
  if (fullSim >= 0.82) return fullSim

  const queryTokens = q.split(/\s+/).filter(Boolean)
  const nameTokens = n.split(/\s+/).filter(Boolean)

  if (queryTokens.length >= 2 && nameTokens.length > 0) {
    const tokenScores = queryTokens.map((queryToken) =>
      Math.max(
        ...nameTokens.map(
          (nameToken) =>
            1 -
            levenshtein(queryToken, nameToken) /
              Math.max(queryToken.length, nameToken.length)
        )
      )
    )

    const strongTokenMatches = tokenScores.filter((score) => score >= 0.82).length
    const avgTokenScore =
      tokenScores.reduce((acc, score) => acc + score, 0) / tokenScores.length

    if (
      strongTokenMatches >= Math.min(2, queryTokens.length) &&
      avgTokenScore >= 0.72
    ) {
      return avgTokenScore * 0.98
    }
  }

  if (queryTokens.length === 1 && nameTokens.length > 0) {
    const mejorToken = Math.max(
      ...nameTokens.map(
        (nameToken) =>
          1 -
          levenshtein(queryTokens[0], nameToken) /
            Math.max(queryTokens[0].length, nameToken.length)
      )
    )
    return mejorToken * 0.88
  }

  return fullSim
}

/**
 * Analiza una consulta en bruto para determinar la intención del usuario.
 * Decide si se deben consultar endpoints de personas, películas o mixto,
 * optimizando el consumo de la API externa.
 *
 * @param raw - Consulta original del buscador.
 * @returns Objeto con la estrategia de búsqueda recomendada.
 */
export function analizarQuery(raw: string): QueryAnalizado {
  const tokens = tokenizarQuery(raw)
  const estrategia: string[] = []

  // Heurística: ¿Parece un nombre propio (Capitalizado + Capitalizado)?
  const hasTwoCapitalizedWords = /\b[A-Z][a-z]+\b\s+\b[A-Z][a-z]+\b/.test(
    raw.trim()
  )
  const hasPersonContext = PERSON_CONTEXT_HINT.test(raw)
  const tokensImprobables = tokens.filter(
    (token) => token.length >= 4 && !NON_PERSON_HINTS.test(token)
  )
  const hasLongTokenPair =
    tokens.length === 2 && tokens.every((token) => token.length >= 5)
  const hasSingleLongToken = tokens.length === 1 && tokens[0].length >= 5

  let tipo: SearchIntent = "titulo"
  const queries_tmdb: QueryAnalizado["queries_tmdb"] = {
    buscar_personas: true,
    buscar_peliculas: true,
    buscar_tv: true,
    termino_persona: raw,
    termino_pelicula: raw,
    termino_tv: raw,
  }

  // Lógica de decisión heurística
  if (tokens.length <= 2 && (hasTwoCapitalizedWords || hasPersonContext)) {
    tipo = "persona"
    estrategia.push(
      "Estructura de nombre detectada: priorizar búsqueda de personas (manteniendo catálogo activo)"
    )
  } else if (
    hasSingleLongToken ||
    (tokens.length >= 3 && tokensImprobables.length >= 2) ||
    hasLongTokenPair
  ) {
    tipo = "mixto"
    estrategia.push(
      "Consulta ambigua/mixta detectada: consulta total de entidades"
    )
  } else {
    estrategia.push("Consulta de tipo título/contextual: búsqueda en catálogo")
  }

  return {
    raw,
    tokens,
    tipo_detectado: tipo,
    estrategia,
    queries_tmdb,
  }
}
