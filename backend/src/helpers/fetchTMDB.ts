/**
 * Helper para centralizar las peticiones a la API de TMDB.
 * Todas las respuestas se solicitan en español (es-ES) por defecto.
 */
type TMDBFetchOptions = {
  defaultLanguage?: string
  includeDefaultLanguage?: boolean
}

export const consultarTMDB = async <T = unknown>(
  endpoint: string,
  params: Record<string, string> = {},
  options: TMDBFetchOptions = {}
): Promise<T> => {
  const defaultLanguage = options.defaultLanguage || "es-ES"
  const includeDefaultLanguage = options.includeDefaultLanguage ?? true

  const hasExplicitLanguage = Object.prototype.hasOwnProperty.call(params, "language")

  const normalizedParams = new URLSearchParams()
  if (includeDefaultLanguage && !hasExplicitLanguage && defaultLanguage) {
    normalizedParams.set("language", defaultLanguage)
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    const nextValue = String(value).trim()
    if (!nextValue) continue
    normalizedParams.set(key, nextValue)
  }

  const parametrosUrl = normalizedParams
  const url = `https://api.themoviedb.org/3/${endpoint}?${parametrosUrl.toString()}`
  const opciones = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.API_KEY_TMDB}`,
    },
  }

  const respuesta = await fetch(url, opciones)
  if (!respuesta.ok) {
    throw new Error(`Error de TMDB. Estado: ${respuesta.status}`)
  }
  return respuesta.json() as T
}
