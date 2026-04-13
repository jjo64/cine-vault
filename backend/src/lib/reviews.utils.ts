import type { CrearResenaDTO, ActualizarResenaDTO } from "../schemas/reviews.js"

export type MovieAggregate = {
  movie_id: number
  reviews_count: number
  avg_rating: number | null
  likes_total: number
  diary_entries: number
}

const maybeRoundHalf = (value: number | null | undefined) => {
  if (value === null || value === undefined) return undefined
  if (!Number.isFinite(value)) return undefined
  return Math.round(value * 2) / 2
}

const computeReadingTime = (content: string | undefined) => {
  const words = (content || "").trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return null
  return Math.max(1, Math.ceil(words / 200))
}

export const normalizeReviewPayload = (
  data: Partial<CrearResenaDTO> & Partial<ActualizarResenaDTO>
) => {
  const ratings = [
    maybeRoundHalf(data.rating_direccion),
    maybeRoundHalf(data.rating_guion),
    maybeRoundHalf(data.rating_fotografia),
    maybeRoundHalf(data.rating_actuaciones),
    maybeRoundHalf(data.rating_banda_sonora),
  ].filter((n): n is number => typeof n === "number")

  let rating = maybeRoundHalf(data.rating)
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
