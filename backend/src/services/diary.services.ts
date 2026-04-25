/**
 * @file diary.services.ts
 * @description Capa de servicios para la gestión del "Diario de Visionado" (Letterboxd-style).
 * Implementa la lógica de registro cronológico de películas, validación de duplicados
 * diarios y orquestación de caché para optimizar la carga del feed personal.
 */

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors/AppErrors.js"
import { getCache, invalidateKeys, setCache } from "../lib/cache.js"
import { diaryRepository } from "../repositories/DiaryRepository.js"
import type { CrearEntradaDiarioDTO } from "../schemas/diary.js"
import { ensureMovieRefId } from "./movieRef.services.js"
import { ReviewMediaType } from "@prisma/client"
import { standardizeToMidnight } from "../utils/date.utils.js"
import { checkAndAwardAutomaticBadges } from "./badges.services.js"

// --- Constantes de Caché ---

const diarioCacheKey = (userId: number) => `diary:feed:v2:${userId}`
const movieAggregateKey = (movieId: number) => `movie:agg:${movieId}`

// --- Funciones de Utilidad y Apoyo ---

/**
 * Normaliza una fecha ISO o retorna la fecha actual sin componentes de tiempo.
 */
const normalizarFecha = (iso?: string) => standardizeToMidnight(iso)

/**
 * Gestiona la invalidación de claves de caché ante mutaciones en el diario.
 */
const invalidateCacheForDiary = async (userId: number, movieId: number) => {
  await invalidateKeys([diarioCacheKey(userId), movieAggregateKey(movieId)])
}

/**
 * Implementa la regla de negocio de evitar múltiples registros de la misma
 * película por el mismo usuario en el mismo día natural.
 */
const crearDiarioUnicoPorDia = async (
  userId: number,
  data: CrearEntradaDiarioDTO
) => {
  const mediaType =
    (data.media_type as ReviewMediaType) || ReviewMediaType.movie
  const movieId = await ensureMovieRefId(data.movie_id, mediaType)
  const watchedDate = normalizarFecha(data.watched_date)

  const existente = await diaryRepository.findByUserMovieDate(
    userId,
    movieId,
    watchedDate
  )

  if (existente) {
    throw new ConflictError("Ya registraste esta película en ese día")
  }

  const entry = await diaryRepository.create(userId, {
    ...data,
    movie_id: movieId,
    media_type: mediaType,
    watched_date: watchedDate.toISOString().slice(0, 10),
  })

  await invalidateCacheForDiary(userId, movieId)

  // Gamificación: Verificar si el usuario ha ganado insignias tras este registro
  checkAndAwardAutomaticBadges(userId).catch((err) => {
    console.error(
      "[Gamificación] Error al procesar insignias post-diario:",
      err
    )
  })

  return entry
}

// --- Servicios Principales ---

/**
 * Recupera el historial cronológico del usuario, empleando una capa de caché de Redis.
 */
export const obtenerDiarioService = async (userId: number) => {
  const cacheKey = diarioCacheKey(userId)
  const cached =
    await getCache<
      Awaited<ReturnType<typeof diaryRepository.buildRichResponse>>
    >(cacheKey)

  if (cached) return cached

  const diario = await diaryRepository.buildRichResponse(userId)
  if (!diario) throw new NotFoundError("No se encontraron entradas de diario")

  await setCache(cacheKey, diario)
  return diario
}

/**
 * Crea una nueva entrada en el diario del usuario.
 */
export const crearEntradaDiarioService = (
  userId: number,
  data: CrearEntradaDiarioDTO
) => crearDiarioUnicoPorDia(userId, data)

/**
 * Elimina una entrada del diario, validando la propiedad y limpiando la caché asociada.
 */
export const eliminarEntradaDiarioService = async (
  userId: number,
  entradaId: number
) => {
  const entrada = await diaryRepository.findById(entradaId)
  if (!entrada) throw new NotFoundError("Entrada no encontrada")

  if (entrada.user_id !== userId) {
    throw new ForbiddenError("No tienes permiso para eliminar esta entrada")
  }

  await invalidateCacheForDiary(userId, entrada.movie_id)
  await diaryRepository.delete(entradaId)
}

/**
 * Recupera el registro cronológico basado en múltiples sesiones.
 */
export const obtenerSesionesDiarioService = async (userId: number) => {
  return await diaryRepository.findSessionsByUserId(userId)
}

/**
 * Crea una sesión que contiene múltiples películas
 */
export const crearSesionDiarioService = async (userId: number, data: any) => {
  // Asegurar que las referencias de película existen
  const resolvedEntries = await Promise.all(
    data.entries.map(async (entry: any) => {
      const tmdbId =
        typeof entry === "number" ? entry : entry.tmdbId || entry.movie_id
      const mediaType =
        typeof entry === "object"
          ? entry.mediaType || entry.media_type || "movie"
          : "movie"
      const movieRefId = await ensureMovieRefId(tmdbId, mediaType)
      return {
        movie_id: movieRefId,
        media_type: mediaType,
      }
    })
  )

  const created = await diaryRepository.createSession(userId, {
    ...data,
    entries: resolvedEntries,
  })

  // Limpiar cachés relevantes (feed, historial)
  await invalidateKeys([diarioCacheKey(userId)])
  return created
}
