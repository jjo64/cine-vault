import { NotFoundError, ValidationError } from "../errors/AppErrors.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { arcosRepository } from "../repositories/ArcosRepository.js"
import {
  ActualizarArcoDTO,
  CrearArcoDTO,
  ModerarArcoDTO,
} from "../schemas/arcos.js"
import { ensureMovieRefId } from "./movieRef.services.js"

type ArcoFallback = {
  id: number
  created_by_user_id: number
  reviewed_by_user_id: number | null
  slug: string
  title: string
  description: string
  poster_url: string | null
  level: string
  moderation_status: "approved"
  review_note: string | null
  cinevault_badge: string | null
  official: boolean
  reviewed_at: string | null
  created_at: string
  updated_at: string
  films: number
  usersCompleted: number
}

const ARCOS_FALLBACK: ArcoFallback[] = [
  {
    id: 1,
    created_by_user_id: 1,
    reviewed_by_user_id: 1,
    slug: "tarkovsky-tiempo-materia",
    title: "Tarkovsky: el tiempo como materia",
    description:
      "Ruta de formacion centrada en la filmografia de Tarkovsky y su evolucion estetica.",
    poster_url: null,
    level: "AVANZADO",
    moderation_status: "approved",
    review_note: null,
    cinevault_badge: "Recomendado por CineVault",
    official: true,
    reviewed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    films: 7,
    usersCompleted: 0,
  },
]

const parseCount = (value: bigint | number | null | undefined) =>
  Number(value ?? 0)

type ArcoModerationStatus = "pending_review" | "approved" | "rejected" | "archived"

const mapArcoSummary = (row: {
  id: number
  created_by_user_id: number
  reviewed_by_user_id: number | null
  slug: string
  title: string
  description: string | null
  poster_url: string | null
  level: string
  moderation_status: "draft" | "pending_review" | "approved" | "rejected" | "archived"
  review_note: string | null
  cinevault_badge: string | null
  is_official: number
  reviewed_at: Date | null
  created_at: Date
  updated_at: Date
  film_count: bigint
  engaged_users: bigint
}) => ({
  id: row.id,
  created_by_user_id: row.created_by_user_id,
  reviewed_by_user_id: row.reviewed_by_user_id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  poster_url: row.poster_url,
  level: row.level,
  moderation_status: row.moderation_status,
  review_note: row.review_note,
  cinevault_badge: row.cinevault_badge,
  official: Boolean(row.is_official),
  reviewed_at: row.reviewed_at?.toISOString() ?? null,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
  films: parseCount(row.film_count),
  usersCompleted: parseCount(row.engaged_users),
})

const normalizeSlugPart = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

const generateArcoSlugBase = (title: string) => {
  const base = normalizeSlugPart(title)
  if (!base) return `arco-${Date.now()}`
  return base.slice(0, 100)
}

const buildUniqueArcoSlug = async (title: string) => {
  const base = generateArcoSlugBase(title)
  let candidate = base
  let attempt = 1

  // Avoid collisions with deterministic suffixes.
  while (await arcosRepository.existsSlug(candidate)) {
    candidate = `${base}-${attempt}`.slice(0, 120)
    attempt += 1
  }

  return candidate
}

const normalizeMovies = async (
  movies: Array<{ movie_id: number; note?: string; is_optional: boolean }>
) => {
  const normalized: Array<{
    movie_id: number
    order_index: number
    note: string | null
    is_optional: boolean
  }> = []
  const seenMovieIds = new Set<number>()

  for (const [index, movie] of movies.entries()) {
    const movieRefId = await ensureMovieRefId(movie.movie_id)
    if (seenMovieIds.has(movieRefId)) {
      throw new ValidationError("No se permiten peliculas repetidas dentro del mismo arco")
    }

    seenMovieIds.add(movieRefId)
    normalized.push({
      movie_id: movieRefId,
      order_index: index + 1,
      note: movie.note?.trim() || null,
      is_optional: Boolean(movie.is_optional),
    })
  }

  if (normalized.length < 2) {
    throw new ValidationError("Un arco debe tener al menos 2 peliculas")
  }

  return normalized
}

const parseModerationStatus = (status?: string): ArcoModerationStatus => {
  if (status === "approved" || status === "rejected" || status === "archived") {
    return status
  }
  return "pending_review"
}

export const obtenerArcosService = async () => {
  try {
    const rows = await arcosRepository.listPublicArcos()
    return rows.map(mapArcoSummary)
  } catch {
    return ARCOS_FALLBACK
  }
}

const buildArcoDetail = async (arcoId: number, userId?: number) => {
  const movies = await arcosRepository.listArcoMovies(arcoId)
  const progressIds = userId
    ? await arcosRepository.listUserProgressMovieIds(userId, arcoId)
    : []

  const watchedSet = new Set(progressIds.map((item) => item.movie_id))

  const moviesDetailed = await Promise.all(
    movies.map(async (movie) => {
      const tmdbId = movie.tmdb_id
      if (!tmdbId) {
        return {
          movie_id: movie.movie_id,
          tmdb_id: null,
          order: movie.order_index,
          optional: Boolean(movie.is_optional),
          note: movie.note,
          watched: watchedSet.has(movie.movie_id),
          movie_info: null,
        }
      }

      try {
        const data = (await consultarTMDB(`movie/${tmdbId}`)) as {
          title?: string
          poster_path?: string
          release_date?: string
        }

        return {
          movie_id: movie.movie_id,
          tmdb_id: tmdbId,
          order: movie.order_index,
          optional: Boolean(movie.is_optional),
          note: movie.note,
          watched: watchedSet.has(movie.movie_id),
          movie_info: {
            title: data.title || "Sin titulo",
            poster_path: data.poster_path || "",
            release_date: data.release_date || "",
          },
        }
      } catch {
        return {
          movie_id: movie.movie_id,
          tmdb_id: tmdbId,
          order: movie.order_index,
          optional: Boolean(movie.is_optional),
          note: movie.note,
          watched: watchedSet.has(movie.movie_id),
          movie_info: null,
        }
      }
    })
  )

  const completedCount = moviesDetailed.filter((movie) => movie.watched).length
  const totalCount = moviesDetailed.length

  return {
    progress: {
      completed: completedCount,
      total: totalCount,
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    },
    movies: moviesDetailed,
  }
}

export const obtenerArcoByIdService = async (arcoId: number, userId?: number) => {
  try {
    const arco = await arcosRepository.findPublicArcoById(arcoId)
    if (!arco) throw new NotFoundError("Arco no encontrado")

    const detail = await buildArcoDetail(arcoId, userId)

    return {
      ...mapArcoSummary(arco),
      ...detail,
    }
  } catch {
    const fallback = ARCOS_FALLBACK.find((item) => item.id === arcoId)
    if (!fallback) throw new NotFoundError("Arco no encontrado")

    return {
      ...fallback,
      progress: {
        completed: 0,
        total: fallback.films,
        percentage: 0,
      },
      movies: [],
    }
  }
}

export const marcarProgresoArcoService = async (
  userId: number,
  arcoId: number,
  movieIdCandidate: number
) => {
  const movieId = await ensureMovieRefId(movieIdCandidate)

  const arco = await arcosRepository.findPublicArcoById(arcoId)
  if (!arco) throw new NotFoundError("Arco no encontrado")

  const belongs = await arcosRepository.hasMovieInArco(arcoId, movieId)
  if (!belongs) {
    throw new NotFoundError("La pelicula no pertenece a este arco")
  }

  await arcosRepository.createProgress(userId, arcoId, movieId)

  return {
    message: "Progreso actualizado",
    arco_id: arcoId,
    movie_id: movieId,
  }
}

export const obtenerMisArcosService = async (userId: number) => {
  const rows = await arcosRepository.listArcosByOwner(userId)
  return rows.map(mapArcoSummary)
}

export const obtenerMiArcoByIdService = async (userId: number, arcoId: number) => {
  const arco = await arcosRepository.findArcoByIdForOwner(arcoId, userId)
  if (!arco) throw new NotFoundError("Arco no encontrado")

  const detail = await buildArcoDetail(arcoId, userId)

  return {
    ...mapArcoSummary(arco),
    ...detail,
  }
}

export const crearArcoBorradorService = async (userId: number, data: CrearArcoDTO) => {
  const slug = await buildUniqueArcoSlug(data.title)
  const movies = await normalizeMovies(data.movies)

  const arcoId = await arcosRepository.createArcoDraft({
    created_by_user_id: userId,
    slug,
    title: data.title.trim(),
    description: data.description.trim(),
    poster_url: data.poster_url.trim(),
    level: data.level,
  })

  if (!arcoId) {
    throw new ValidationError("No se pudo crear el arco")
  }

  await arcosRepository.replaceArcoMovies(arcoId, movies)
  return obtenerMiArcoByIdService(userId, arcoId)
}

export const actualizarArcoBorradorService = async (
  userId: number,
  arcoId: number,
  data: ActualizarArcoDTO
) => {
  const arco = await arcosRepository.findArcoByIdForOwner(arcoId, userId)
  if (!arco) throw new NotFoundError("Arco no encontrado")

  if (arco.moderation_status !== "draft" && arco.moderation_status !== "rejected") {
    throw new ValidationError("Solo se pueden editar arcos en estado draft o rejected")
  }

  await arcosRepository.updateArcoDraft(arcoId, userId, {
    title: data.title?.trim() ?? null,
    description: data.description?.trim() ?? null,
    poster_url: data.poster_url?.trim() ?? null,
    level: data.level ?? null,
  })

  if (data.movies) {
    const movies = await normalizeMovies(data.movies)
    await arcosRepository.replaceArcoMovies(arcoId, movies)
  }

  return obtenerMiArcoByIdService(userId, arcoId)
}

export const enviarArcoRevisionService = async (userId: number, arcoId: number) => {
  const arco = await arcosRepository.findArcoByIdForOwner(arcoId, userId)
  if (!arco) throw new NotFoundError("Arco no encontrado")

  if (arco.moderation_status !== "draft" && arco.moderation_status !== "rejected") {
    throw new ValidationError("Solo se pueden enviar a revision arcos en estado draft o rejected")
  }

  const totalMovies = await arcosRepository.countArcoMovies(arcoId)
  if (totalMovies < 2) {
    throw new ValidationError("Un arco debe tener al menos 2 peliculas para enviarse a revision")
  }

  await arcosRepository.sendArcoToReview(arcoId, userId)
  return obtenerMiArcoByIdService(userId, arcoId)
}

export const obtenerArcosModeracionService = async (status?: string) => {
  const parsedStatus = parseModerationStatus(status)
  const rows = await arcosRepository.listArcosByModerationStatus(parsedStatus)
  return rows.map(mapArcoSummary)
}

export const moderarArcoService = async (
  reviewerId: number,
  arcoId: number,
  data: ModerarArcoDTO
) => {
  const arco = await arcosRepository.findArcoByIdForModeration(arcoId)
  if (!arco) throw new NotFoundError("Arco no encontrado")

  if (arco.moderation_status !== "pending_review") {
    throw new ValidationError("Solo se pueden moderar arcos en estado pending_review")
  }

  const isApproved = data.status === "approved"
  const cinevaultBadge = isApproved
    ? (data.cinevault_badge?.trim() || "Recomendado por CineVault")
    : null

  await arcosRepository.moderateArco(arcoId, {
    status: data.status,
    review_note: data.review_note?.trim() || null,
    cinevault_badge: cinevaultBadge,
    reviewed_by_user_id: reviewerId,
    is_official: isApproved,
  })

  const updated = await arcosRepository.findArcoByIdForModeration(arcoId)
  if (!updated) throw new NotFoundError("Arco no encontrado")

  return mapArcoSummary(updated)
}
