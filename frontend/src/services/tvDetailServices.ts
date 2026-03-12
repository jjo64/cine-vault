const API_URL = import.meta.env.VITE_API_URL

export type TVDetailApi = {
  id: number
  name: string
  original_name?: string
  first_air_date?: string
  last_air_date?: string
  number_of_seasons?: number
  number_of_episodes?: number
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
  credits?: {
    cast?: Array<{ id: number; name: string; character?: string; profile_path?: string | null }>
    crew?: Array<{ id: number; name: string; job?: string; profile_path?: string | null }>
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
