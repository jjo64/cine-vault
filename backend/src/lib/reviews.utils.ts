/**
 * @file reviews.utils.ts
 * @description Utilidades de procesamiento y normalización para el ecosistema de reseñas.
 * Contiene la lógica para el cálculo de promedios, redondeo de calificaciones
 * y estimación de tiempos de lectura para críticas largas.
 */

import type { CrearResenaDTO, ActualizarResenaDTO } from "../schemas/reviews.js"

/**
 * Representación agregada de las métricas de una película.
 */
export type MovieAggregate = {
  movie_id: number
  reviews_count: number
  avg_rating: number | null
  likes_total: number
  diary_entries: number
}

/**
 * Redondea un valor numérico al 0.5 más cercano.
 * Ejemplo: 3.2 -> 3 | 3.3 -> 3.5 | 3.7 -> 3.5 | 3.8 -> 4
 */
const maybeRoundHalf = (value: number | null | undefined) => {
  if (value === null || value === undefined) return undefined
  if (!Number.isFinite(value)) return undefined
  return Math.round(value * 2) / 2
}

/**
 * Evalúa el contenido de texto para estimar el tiempo de lectura en minutos.
 * Utiliza una métrica estándar de 200 palabras por minuto.
 */
const computeReadingTime = (content: string | undefined) => {
  const words = (content || "").trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return null
  return Math.max(1, Math.ceil(words / 200))
}

/**
 * Normaliza los datos de entrada de una reseña antes de su persistencia.
 * Calcula el rating global automáticamente si se proporcionan ratings detallados
 * pero falta el general.
 *
 * @param data - Datos parciales de creación o actualización de reseña.
 * @returns Payload normalizado y listo para Prisma.
 */
export const normalizeReviewPayload = (
  data: Partial<CrearResenaDTO> & Partial<ActualizarResenaDTO>
) => {
  // Recopilamos los ratings granulares para posible cálculo de promedio
  const ratings = [
    maybeRoundHalf(data.rating_direccion),
    maybeRoundHalf(data.rating_guion),
    maybeRoundHalf(data.rating_fotografia),
    maybeRoundHalf(data.rating_actuaciones),
    maybeRoundHalf(data.rating_banda_sonora),
  ].filter((n): n is number => typeof n === "number")

  let rating = maybeRoundHalf(data.rating)

  // Inteligencia de negocio: Si el usuario dio estrellas a apartados técnicos
  // pero no una nota general, la calculamos nosotros.
  if ((rating === undefined || rating === null) && ratings.length > 0) {
    const avg = ratings.reduce((acc, n) => acc + n, 0) / ratings.length
    rating = Math.round(avg * 2) / 2
  }

  const mode = data.mode || "RAPIDO"
  const content = data.content?.trim()

  return {
    ...data,
    content,
    rating,
    mode,
    es_critica_larga: mode === "CRITICO",
    tiempo_lectura_min: computeReadingTime(content),
    rating_direccion: maybeRoundHalf(data.rating_direccion),
    rating_guion: maybeRoundHalf(data.rating_guion),
    rating_fotografia: maybeRoundHalf(data.rating_fotografia),
    rating_actuaciones: maybeRoundHalf(data.rating_actuaciones),
    rating_banda_sonora: maybeRoundHalf(data.rating_banda_sonora),
  }
}
