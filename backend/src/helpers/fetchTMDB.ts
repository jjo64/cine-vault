/**
 * @file fetchTMDB.ts
 * @description Helper especializado para orquestar la integración con la API de The Movie Database (TMDB).
 * Centraliza la configuración de cabeceras, gestión de errores de red y la
 * normalización de parámetros de idioma para asegurar una experiencia consistente en español.
 */

import { NotFoundError } from "../errors/AppErrors.js"

/** Opciones de configuración para las peticiones a la API externa */
type TMDBFetchOptions = {
  /** Idioma por defecto de la respuesta (ej: "es-ES") */
  defaultLanguage?: string
  /** Indica si se debe inyectar el idioma por defecto si no se proporciona uno explícito */
  includeDefaultLanguage?: boolean
}

/**
 * Realiza una petición parametrizada a los servicios de TMDB.
 *
 * @template T - Tipo esperado de la respuesta JSON decodificada.
 * @param endpoint - Ruta del recurso (ej: "movie/popular"). No debe incluir "/3/".
 * @param params - Diccionario de parámetros de consulta (query strings).
 * @param options - Configuración adicional de idioma y comportamiento.
 * @returns Promesa que resuelve en los datos de la respuesta.
 * @throws Error si la respuesta HTTP no es exitosa (ej: 401, 404, 500).
 */
export const consultarTMDB = async <T = unknown>(
  endpoint: string,
  params: Record<string, string> = {},
  options: TMDBFetchOptions = {}
): Promise<T> => {
  const defaultLanguage = options.defaultLanguage || "es-ES"
  const includeDefaultLanguage = options.includeDefaultLanguage ?? true

  // Verificamos si el caller ya proporcionó un parámetro de lenguaje específico
  const hasExplicitLanguage = Object.prototype.hasOwnProperty.call(
    params,
    "language"
  )

  const normalizedParams = new URLSearchParams()

  // Inyección automática de idioma si es necesario
  if (includeDefaultLanguage && !hasExplicitLanguage && defaultLanguage) {
    normalizedParams.set("language", defaultLanguage)
  }

  // Filtrado y normalización de parámetros (eliminación de vacíos/nulos)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    const nextValue = String(value).trim()
    if (!nextValue) continue
    normalizedParams.set(key, nextValue)
  }

  const url = `https://api.themoviedb.org/3/${endpoint}?${normalizedParams.toString()}`

  /** Configuración de la petición: Se utiliza Bearer Auth con la API Key del entorno */
  const opcionesRequest = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.API_KEY_TMDB}`,
    },
  }

  const respuesta = await fetch(url, opcionesRequest)

  if (!respuesta.ok) {
    // Mapeo semántico de errores para que la API responda con el status correcto
    if (respuesta.status === 404) {
      throw new NotFoundError(
        `Recurso no encontrado en TMDB (Endpoint: ${endpoint})`
      )
    }

    const error: any = new Error(
      `Error en bridge de TMDB [Estado: ${respuesta.status}] - Endpoint: ${endpoint}`
    )
    error.status = respuesta.status
    throw error
  }

  return respuesta.json() as T
}
