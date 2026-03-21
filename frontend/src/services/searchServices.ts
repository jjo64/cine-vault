const API_URL = import.meta.env.VITE_API_URL

export type SearchMovieResult = {
  id: number
  title?: string
  title_en?: string | null
  title_es?: string | null
  localized_title?: string | null
  localized_titles?: string[]
  name?: string
  media_type?: 'movie' | 'tv' | 'person'
  original_title?: string
  original_name?: string
  release_date?: string
  first_air_date?: string
  poster_path?: string | null
  profile_path?: string | null
  known_for_department?: string
  director?: string
  runtime?: number | null
  genres?: Array<{ id: number; name: string }>
  production_countries?: Array<{ iso_3166_1: string; name: string }>
  overview?: string
  alternative_titles?: Array<{ iso_3166_1?: string; title?: string }>
  _score_debug?: {
    title_rank?: number
    title_source_boost?: number
    token_source_boost?: number
    exact_title_boost?: number
    exact_token_boost?: number
    fuzzy_boost?: number
    contextual_token_boost?: number
    person_role_boost?: number
    strong_person_match_boost?: number
    local_boost?: number
    token_matches?: number
  }
}

export type SearchSuggestionItem = {
  id: number
  title?: string
  name?: string
  media_type?: 'movie' | 'tv' | 'person'
  poster_path?: string | null
  profile_path?: string | null
}

export type SearchPersonPanel = {
  id: number
  name: string
  profile_path?: string | null
  known_for_department?: string
  known_for?: Array<{
    id: number
    title?: string
    name?: string
    poster_path?: string | null
  }>
}

export type SearchResponse = {
  page?: number
  total_pages?: number
  total_results?: number
  results?: SearchMovieResult[]
  movie_results?: SearchMovieResult[]
  tv_results?: SearchMovieResult[]
  people_results?: SearchPersonPanel[]
  _debug?: {
    query?: string
    analysis?: {
      tipo_detectado?: string
      tokens?: string[]
      estrategia?: string[]
    }
  }
}

export type GenreItem = {
  id: number
  name: string
}

type SearchScope = 'general' | 'debug' | 'multi' | 'movie' | 'person' | 'tv'

const scopePath: Record<SearchScope, string> = {
  general: '/api/search',
  debug: '/api/search/debug',
  multi: '/api/search/multi',
  movie: '/api/search/movie',
  person: '/api/search/person',
  tv: '/api/search/tv',
}

type SearchParams = {
  query: string
  page?: number
  withGenres?: number[]
}

async function runSearch(scope: SearchScope, params: SearchParams): Promise<SearchResponse> {
  const query = params.query.trim()
  if (!query) return { page: 1, total_pages: 1, total_results: 0, results: [] }

  const search = new URLSearchParams()
  search.set('q', query)
  search.set('page', String(params.page || 1))

  if (scope === 'movie' && params.withGenres && params.withGenres.length > 0) {
    search.set('with_genres', params.withGenres.join(','))
  }

  const response = await fetch(`${API_URL}${scopePath[scope]}?${search.toString()}`)
  if (!response.ok) {
    throw new Error(`Error ${response.status}`)
  }
  return (await response.json()) as SearchResponse
}

export async function searchMovies(query: string, page = 1): Promise<SearchResponse> {
  return runSearch('general', { query, page })
}

export async function searchMoviesDebug(query: string, page = 1): Promise<SearchResponse> {
  return runSearch('debug', { query, page })
}

export const searchMulti = (query: string, page = 1) => runSearch('multi', { query, page })

export const searchMovie = (query: string, page = 1, withGenres: number[] = []) =>
  runSearch('movie', { query, page, withGenres })

export const searchPerson = (query: string, page = 1) => runSearch('person', { query, page })

export const searchTV = (query: string, page = 1) => runSearch('tv', { query, page })

export async function fetchMovieGenres(): Promise<GenreItem[]> {
  const response = await fetch(`${API_URL}/api/search/genres/movie`)
  if (!response.ok) return []
  const data = (await response.json()) as { genres?: GenreItem[] }
  return Array.isArray(data.genres) ? data.genres : []
}
