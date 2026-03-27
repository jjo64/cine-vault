const API_URL = import.meta.env.VITE_API_URL

export type TVDetailApi = {
  id: number
  name: string
  original_name?: string
  status?: string
  type?: string
  first_air_date?: string
  last_air_date?: string
  in_production?: boolean
  number_of_seasons?: number
  number_of_episodes?: number
  episode_run_time?: number[]
  overview?: string
  tagline?: string | null
  vote_average?: number
  vote_count?: number
  poster_path?: string | null
  backdrop_path?: string | null
  genres?: Array<{ id: number; name: string }>
  production_countries?: Array<{ iso_3166_1: string; name: string }>
  spoken_languages?: Array<{ english_name?: string; name?: string }>
  created_by?: Array<{ id: number; name: string }>
  networks?: Array<{ id: number; name: string; logo_path?: string | null }>
  seasons?: Array<{
    id: number
    air_date?: string | null
    episode_count?: number
    name: string
    overview?: string
    poster_path?: string | null
    season_number: number
    vote_average?: number
  }>
  season_details?: Array<{
    id: number
    name: string
    season_number: number
    episode_count?: number
    air_date?: string | null
    overview?: string
    poster_path?: string | null
    episodes?: Array<{
      id: number
      name: string
      overview?: string
      air_date?: string | null
      episode_number?: number
      runtime?: number | null
      still_path?: string | null
      vote_average?: number
      vote_count?: number
    }>
  }>
  credits?: {
    cast?: Array<{ id: number; name: string; character?: string; profile_path?: string | null }>
    crew?: Array<{ id: number; name: string; job?: string; department?: string; profile_path?: string | null }>
  }
  watch_providers?: Record<string, {
    flatrate?: Array<{ provider_name: string }>
    rent?: Array<{ provider_name: string }>
    buy?: Array<{ provider_name: string }>
  }>
  similar?: {
    results?: Array<{
      id: number
      name?: string
      poster_path?: string | null
      first_air_date?: string
      vote_average?: number
    }>
  }
  images?: {
    backdrops?: Array<{ file_path?: string | null }>
  }
}

export async function fetchTVDetail(id: string): Promise<TVDetailApi> {
  const response = await fetch(`${API_URL}/api/search/tv/${id}`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Error ${response.status}`)
  }
  return (await response.json()) as TVDetailApi
}
