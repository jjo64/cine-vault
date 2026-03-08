const API_URL = import.meta.env.VITE_API_URL

export type SearchMovieResult = {
  id: number
  title: string
  original_title?: string
  release_date?: string
  poster_path?: string | null
  director?: string
  overview?: string
}

export type SearchResponse = {
  page?: number
  total_pages?: number
  total_results?: number
  results?: SearchMovieResult[]
}

export async function searchMovies(query: string, page = 1): Promise<SearchResponse> {
  const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}&page=${page}`)
  if (!response.ok) {
    throw new Error(`Error ${response.status}`)
  }
  return (await response.json()) as SearchResponse
}
