/**
 * @file titleRanking.ts
 * @description Motor de relevancia y lógica de ordenamiento para títulos de películas.
 * Implementa algoritmos de normalización de texto, comparación semántica y
 * fusión de resultados multilenguaje (Inglés/Español) para garantizar que el
 * título más preciso aparezca en las primeras posiciones.
 */

/** Estructura de títulos alternativos devuelta por TMDB */
type TMDBAlternativeTitle = {
  iso_3166_1?: string
  title?: string
}

type SearchMovieLike = any

/** Resultado de la fusión de dos conjuntos de búsqueda */
type MergeSearchResult = {
  merged: any[]
  byId: Map<number, any>
}

// Pesos ponderados por campo para el cálculo de relevancia
const ENGLISH_TITLE_FIELD_WEIGHT = 3000
const ORIGINAL_TITLE_FIELD_WEIGHT = 2000
const LOCALIZED_TITLE_FIELD_WEIGHT = 1000

/**
 * Normaliza una cadena de texto eliminando diacríticos, convirtiendo a minúsculas
 * y limpiando espacios. Fundamental para comparaciones "fuzzy".
 */
const normalizeText = (value: string | null | undefined) =>
  String(value || "")
    .normalize("NFD") // Descompone caracteres con acentos
    .replace(/[\u0300-\u036f]/g, "") // Elimina la marca de acento
    .toLowerCase()
    .trim()

/** Elimina duplicados de un array de cadenas y limpia nulos */
const uniqueStrings = (values: Array<string | null | undefined>) => [
  ...new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
]

/**
 * Evalúa la fuerza de coincidencia entre un candidato y una consulta.
 *
 * @param candidate - Título almacenado o alternativo.
 * @param query - Texto buscado por el usuario.
 * @returns Puntuación de 0 a 100 basada en proximidad léxica.
 */
const matchStrength = (candidate: string, query: string) => {
  if (!candidate || !query) return 0
  if (candidate === query) return 100
  if (candidate.startsWith(query)) return 70
  if (candidate.includes(query)) return 40

  // Coincidencia por tokens individuales
  const queryTokens = query.split(/\s+/).filter(Boolean)
  if (
    queryTokens.length > 1 &&
    queryTokens.every((token) => candidate.includes(token))
  ) {
    return 25
  }

  return 0
}

/**
 * Mapea candidatos a pesos específicos para evitar cálculos redundantes
 * sobre el mismo título en diferentes campos.
 */
const buildWeightedCandidateMap = (
  fields: Array<{ candidates: string[]; weight: number }>
) => {
  const map = new Map<string, { weight: number; strength: number }>()

  for (const field of fields) {
    for (const candidate of field.candidates) {
      const current = map.get(candidate)
      if (!current) {
        map.set(candidate, { weight: field.weight, strength: 0 })
        continue
      }
      // Mantenemos el peso del campo con mayor prioridad
      current.weight = Math.max(current.weight, field.weight)
      map.set(candidate, current)
    }
  }

  return map
}

const withNormalizedCandidates = (values: Array<string | null | undefined>) =>
  uniqueStrings(values).map(normalizeText).filter(Boolean)

const getLocalizedTitlesFromAlternative = (
  titles: TMDBAlternativeTitle[] = []
) => uniqueStrings(titles.map((item) => item.title))

const getSpanishTitleFromAlternative = (titles: TMDBAlternativeTitle[] = []) =>
  titles.find((item) => (item.iso_3166_1 || "").toUpperCase() === "ES")
    ?.title || null

/**
 * Calcula la puntuación de relevancia de una película respecto a una consulta.
 * Considera títulos en inglés, español y el título original con pesos distintos.
 *
 * @param movie - Objeto película con metadatos de TMDB.
 * @param rawQuery - Consulta original del usuario.
 * @returns Score numérico. A mayor valor, mayor relevancia.
 */
export const rankMovieByQuery = (movie: SearchMovieLike, rawQuery: string) => {
  const query = normalizeText(rawQuery)
  if (!query) return 0

  const englishCandidates = withNormalizedCandidates([
    movie.title_en,
    movie.title,
  ])
  const originalCandidates = withNormalizedCandidates([movie.original_title])
  const localizedCandidates = withNormalizedCandidates([
    movie.title_es,
    movie.localized_title,
    ...(Array.isArray(movie.localized_titles) ? movie.localized_titles : []),
    ...getLocalizedTitlesFromAlternative(movie.alternative_titles || []),
  ])

  const weightedCandidates = buildWeightedCandidateMap([
    { candidates: englishCandidates, weight: ENGLISH_TITLE_FIELD_WEIGHT },
    { candidates: originalCandidates, weight: ORIGINAL_TITLE_FIELD_WEIGHT },
    { candidates: localizedCandidates, weight: LOCALIZED_TITLE_FIELD_WEIGHT },
  ])

  let score = 0
  for (const [candidate, metadata] of weightedCandidates.entries()) {
    const strength = matchStrength(candidate, query)
    if (strength <= 0) continue
    score += metadata.weight + strength
  }

  // Desempate basado en métricas de popularidad (ordenamiento estable)
  score += Number(movie.popularity || 0) * 0.01
  score += Number(movie.vote_count || 0) * 0.0001

  return score
}

/**
 * Fusiona resultados obtenidos de búsquedas paralelas en inglés y español.
 * Evita duplicados identificando películas por ID y enriquece la metadata
 * de idioma cruzado.
 *
 * @param englishResults - Resultados de la API TMDB con locale en-US.
 * @param spanishResults - Resultados de la API TMDB con locale es-ES.
 */
export const mergeEnglishAndSpanishResults = (
  englishResults: any[] = [],
  spanishResults: any[] = []
): MergeSearchResult => {
  const byId = new Map<number, any>()
  const merged: any[] = []

  // Procesamos ingleses (prioridad de base de datos técnica)
  for (const movie of englishResults) {
    if (!movie?.id) continue
    const normalizedMovie = {
      ...movie,
      title_en: movie.title || movie.title_en || null,
      title_es: null,
      localized_title: null,
      localized_titles: [],
    }
    byId.set(movie.id, normalizedMovie)
    merged.push(normalizedMovie)
  }

  // Cruzamos con españoles para detectar de forma inteligente el título localizado
  for (const movie of spanishResults) {
    if (!movie?.id) continue
    const existing = byId.get(movie.id)
    if (!existing) {
      const normalizedMovie = {
        ...movie,
        title_en: null,
        title_es: movie.title || null,
        localized_title: movie.title || null,
        localized_titles: movie.title ? [movie.title] : [],
      }
      byId.set(movie.id, normalizedMovie)
      merged.push(normalizedMovie)
      continue
    }

    const mergedLocalized = uniqueStrings([
      ...(Array.isArray(existing.localized_titles)
        ? existing.localized_titles
        : []),
      movie.title,
    ])

    // Enriquecemos la entrada existente (Inglés) con los datos en Castellano
    Object.assign(existing, {
      title:
        existing.title_en ||
        existing.title ||
        movie.title ||
        existing.original_title,
      title_en:
        existing.title_en ||
        movie.original_title ||
        existing.original_title ||
        null,
      title_es: movie.title || existing.title_es || null,
      localized_title: movie.title || existing.localized_title || null,
      localized_titles: mergedLocalized,
      // Recuperamos sinopsis en español si la inglesa estaba vacía
      overview: existing.overview || movie.overview || null,
      poster_path: existing.poster_path || movie.poster_path || null,
    })

    byId.set(movie.id, existing)
  }

  return { merged, byId }
}

/**
 * Enlaza y normaliza títulos alternativos recuperados de un endpoint secundario.
 */
export const attachAlternativeTitles = (
  movie: SearchMovieLike,
  titles: TMDBAlternativeTitle[] = []
) => {
  const spanishFromAlt = getSpanishTitleFromAlternative(titles)
  const localizedTitles = uniqueStrings([
    ...(Array.isArray(movie.localized_titles) ? movie.localized_titles : []),
    spanishFromAlt,
    movie.title_es,
    movie.localized_title,
    ...getLocalizedTitlesFromAlternative(titles),
  ])

  return {
    ...movie,
    alternative_titles: titles,
    title_es: movie.title_es || spanishFromAlt || null,
    localized_title:
      movie.localized_title || movie.title_es || spanishFromAlt || null,
    localized_titles: localizedTitles,
  }
}
