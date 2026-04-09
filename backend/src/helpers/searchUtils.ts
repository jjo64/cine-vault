export type SearchIntent = "persona" | "titulo" | "contexto" | "mixto"

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

export type LocalCounts = {
  vault_count: number
  review_count: number
  watchlist_count: number
}

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
  "pelicula",
])

const NON_PERSON_HINTS = /^(bajo|alto|gran|pequeno|nuevo|viejo|old|new)$/i
const PERSON_CONTEXT_HINT = /(director|directora|actor|actriz|cast|starring)/i

const normalizeToken = (value: string) => value.trim().toLowerCase()

export const tokenizarQuery = (raw: string): string[] =>
  raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))

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

export const fuzzyTokenMatchAny = (tokens: string[], candidates: string[]) => {
  if (tokens.length === 0 || candidates.length === 0) return false

  const normalizedCandidates = candidates
    .map((value) => normalizeToken(value))
    .filter(Boolean)

  return tokens.some((token) => normalizedCandidates.some((candidate) => fuzzyMatch(token, candidate)))
}

export function calcularPersonNameScore(query: string, nombrePersona: string): number {
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
          (nameToken) => 1 - levenshtein(queryToken, nameToken) / Math.max(queryToken.length, nameToken.length)
        )
      )
    )

    const strongTokenMatches = tokenScores.filter((score) => score >= 0.82).length
    const avgTokenScore = tokenScores.reduce((acc, score) => acc + score, 0) / tokenScores.length

    if (strongTokenMatches >= Math.min(2, queryTokens.length) && avgTokenScore >= 0.72) {
      return avgTokenScore * 0.98
    }
  }

  if (queryTokens.length === 1 && nameTokens.length > 0) {
    const mejorToken = Math.max(
      ...nameTokens.map(
        (nameToken) =>
          1 - levenshtein(queryTokens[0], nameToken) / Math.max(queryTokens[0].length, nameToken.length)
      )
    )
    return mejorToken * 0.88
  }

  return fullSim
}

export function analizarQuery(raw: string): QueryAnalizado {
  const tokens = tokenizarQuery(raw)
  const estrategia: string[] = []

  const hasTwoCapitalizedWords = /\b[A-Z][a-z]+\b\s+\b[A-Z][a-z]+\b/.test(raw.trim())
  const hasPersonContext = PERSON_CONTEXT_HINT.test(raw)
  const tokensImprobables = tokens.filter(
    (token) => token.length >= 4 && !NON_PERSON_HINTS.test(token)
  )
  const hasLongTokenPair = tokens.length === 2 && tokens.every((token) => token.length >= 5)
  const hasSingleLongToken = tokens.length === 1 && tokens[0].length >= 5

  let tipo: SearchIntent = "titulo"
  const queries_tmdb: QueryAnalizado["queries_tmdb"] = {
    buscar_personas: false,
    buscar_peliculas: true,
    buscar_tv: true,
    termino_pelicula: raw,
    termino_tv: raw,
  }

  if (tokens.length <= 2 && (hasTwoCapitalizedWords || hasPersonContext)) {
    tipo = "persona"
    estrategia.push("Nombre probable detectado: priorizar endpoint de personas")
    queries_tmdb.buscar_personas = true
    queries_tmdb.buscar_peliculas = false
    queries_tmdb.buscar_tv = false
    queries_tmdb.termino_persona = raw
    delete queries_tmdb.termino_pelicula
    delete queries_tmdb.termino_tv
  } else if (hasSingleLongToken) {
    tipo = "mixto"
    estrategia.push("Token unico largo detectado: combinar personas, peliculas y tv")
    queries_tmdb.buscar_personas = true
    queries_tmdb.buscar_peliculas = true
    queries_tmdb.buscar_tv = true
    queries_tmdb.termino_persona = raw
    queries_tmdb.termino_pelicula = raw
    queries_tmdb.termino_tv = raw
  } else if ((tokens.length >= 3 && tokensImprobables.length >= 2) || hasLongTokenPair) {
    tipo = "mixto"
    estrategia.push("Query mixto detectado: combinar personas, peliculas y tv")
    queries_tmdb.buscar_personas = true
    queries_tmdb.buscar_peliculas = true
    queries_tmdb.buscar_tv = true
    queries_tmdb.termino_persona = raw
    queries_tmdb.termino_pelicula = raw
    queries_tmdb.termino_tv = raw
  } else {
    estrategia.push("Query de titulo/contexto: priorizar peliculas y tv")
  }

  return {
    raw,
    tokens,
    tipo_detectado: tipo,
    estrategia,
    queries_tmdb,
  }
}