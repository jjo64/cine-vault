import { reviewsRepository } from "../repositories/ReviewsRepository.js"
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from "../errors/AppErrors.js"
import { invalidateKeys, getCache, setCache } from "../lib/cache.js"
import { diaryRepository } from "../repositories/DiaryRepository.js"
import { userRepository } from "../repositories/UserRepository.js"
import type {
  CrearResenaDTO,
  ActualizarResenaDTO,
  ReportarResenaDTO,
  CrearComentarioDTO,
  ActualizarComentarioDTO,
} from "../schemas/reviews.js"
import { ensureMovieRefId, findMovieRefIdByCandidate } from "./movieRef.services.js"
import { prisma } from "../lib/prisma.js"

/* ==========================================================================
   REVIEWS SERVICE
   --------------------------------------------------------------------------
   Contiene TODA la lógica de negocio de reseñas, likes, comentarios y
   reportes. Los controladores solo llaman estas funciones y devuelven res.
   Si algo falla, se lanza un AppError que el manejadorErrores captura.
   ========================================================================== */

// ---------------------------------------------------------------------------
// RESEÑAS
// ---------------------------------------------------------------------------

export const obtenerResenasPorUsuarioService = async (userId: number) => {
  const rows = await reviewsRepository.findByUserId(userId)
  return rows.map((row) => ({
    ...row,
    tmdb_id: row.movies_ref?.tmdb_id ?? null,
  }))
}

export const obtenerResenasPorPeliculaService = async (movieId: number) => {
  const resolvedMovieId = await findMovieRefIdByCandidate(movieId)
  if (!resolvedMovieId) return []

  const cacheKey = movieReviewsKey(resolvedMovieId)
  const cached =
    await getCache<Awaited<ReturnType<typeof reviewsRepository.findByMovieId>>>(
      cacheKey
    )
  if (cached) return cached

  const resenas = await reviewsRepository.findByMovieId(resolvedMovieId)
  await setCache(cacheKey, resenas)
  return resenas
}

export const crearResenaService = (userId: number, data: CrearResenaDTO) =>
  verificarYCrearResenaUnica(userId, data)

const verificarYCrearResenaUnica = async (
  userId: number,
  data: CrearResenaDTO
) => {
  const usuario = await userRepository.findById(userId)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  if (data.mode === "CRITICO" && !canUseCriticalMode(usuario.membership, usuario.role)) {
    throw new ForbiddenError("El modo crítico es exclusivo para miembros Pro")
  }

  const normalized = normalizeReviewPayload(data)
  const movieId = await ensureMovieRefId(data.movie_id)
  const existente = await reviewsRepository.findByUserAndMovie(
    userId,
    movieId
  )
  if (existente)
    throw new ConflictError("Ya tienes una reseña para esta película")
  const resena = await reviewsRepository.create(userId, {
    ...normalized,
    movie_id: movieId,
  })
  await invalidateResenaCache(movieId)
  return resena
}

export const actualizarResenaService = async (
  userId: number,
  reviewId: number,
  data: ActualizarResenaDTO
) => {
  const id = asegurarId(reviewId)
  const resena = await reviewsRepository.findById(reviewId)
  if (!resena) throw new NotFoundError("Reseña no encontrada")
  if (resena.user_id !== userId)
    throw new ForbiddenError("No tienes permiso para editar esta reseña")

  const usuario = await userRepository.findById(userId)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  if (data.mode === "CRITICO" && !canUseCriticalMode(usuario.membership, usuario.role)) {
    throw new ForbiddenError("El modo crítico es exclusivo para miembros Pro")
  }

  const updated = await reviewsRepository.update(id, normalizeReviewPayload(data))
  await invalidateResenaCache(resena.movie_id)
  return updated
}

export const eliminarResenaService = async (
  userId: number,
  reviewId: number
) => {
  const id = asegurarId(reviewId)
  const resena = await reviewsRepository.findById(id)
  if (!resena) throw new NotFoundError("Reseña no encontrada")
  if (resena.user_id !== userId)
    throw new ForbiddenError("No tienes permiso para eliminar esta reseña")
  await reviewsRepository.delete(id)
  await invalidateResenaCache(resena.movie_id)
}

export const reportarResenaService = async (
  userId: number,
  reviewId: number,
  data: ReportarResenaDTO
) => {
  const id = asegurarId(reviewId)
  const resena = await reviewsRepository.findById(id)
  if (!resena) throw new NotFoundError("Reseña no encontrada")
  return reviewsRepository.createReport(userId, id, data.reason)
}

// ---------------------------------------------------------------------------
// AGREGADOS
// ---------------------------------------------------------------------------

export const obtenerAgregadoPeliculaService = async (movieId: number) => {
  const cacheKey = movieAggregateKey(movieId)
  const cached = await getCache<MovieAggregate>(cacheKey)
  if (cached) return cached

  const aggregate = await buildMovieAggregate(movieId)
  await setCache(cacheKey, aggregate)
  return aggregate
}

// ---------------------------------------------------------------------------
// LIKES
// ---------------------------------------------------------------------------

export const darLikeResenaService = async (
  userId: number,
  reviewId: number
) => {
  const id = asegurarId(reviewId)
  const likeExistente = await reviewsRepository.findLike(userId, id)
  if (likeExistente) throw new ConflictError("Ya has dado like a esta reseña")

  const { like, review } = await reviewsRepository.addLikeTransaction(
    userId,
    id
  )
  await invalidateResenaCache(review.movie_id)
  return { like, review }
}

export const quitarLikeResenaService = async (
  userId: number,
  reviewId: number
) => {
  const id = asegurarId(reviewId)
  const likeExistente = await reviewsRepository.findLike(userId, id)
  if (!likeExistente) throw new NotFoundError("No has dado like a esta reseña")
  const result = await reviewsRepository.removeLikeTransaction(userId, id)
  await invalidateResenaCache(result.review.movie_id)
  return result
}

// ---------------------------------------------------------------------------
// COMENTARIOS
// ---------------------------------------------------------------------------

export const obtenerComentariosService = (reviewId: number) =>
  reviewsRepository.findCommentsByReviewId(asegurarId(reviewId))

export const crearComentarioService = async (
  userId: number,
  reviewId: number,
  data: CrearComentarioDTO
) => {
  const id = asegurarId(reviewId)
  const resena = await reviewsRepository.findById(id)
  if (!resena) throw new NotFoundError("Reseña no encontrada")
  const comentario = await reviewsRepository.createComment(
    id,
    userId,
    data.content
  )
  // Devolvemos la review (para que el caller pueda emitir notificación)
  return { comentario, review: resena }
}

export const actualizarComentarioService = async (
  userId: number,
  commentId: number,
  data: ActualizarComentarioDTO
) => {
  const comentario = await reviewsRepository.findCommentById(commentId)
  if (!comentario) throw new NotFoundError("Comentario no encontrado")
  if (comentario.user_id !== userId)
    throw new ForbiddenError("No tienes permiso para editar este comentario")
  return reviewsRepository.updateComment(commentId, data.content)
}

export const eliminarComentarioService = async (
  userId: number,
  commentId: number
) => {
  const comentario = await reviewsRepository.findCommentById(commentId)
  if (!comentario) throw new NotFoundError("Comentario no encontrado")
  if (comentario.user_id !== userId)
    throw new ForbiddenError("No tienes permiso para eliminar este comentario")
  await reviewsRepository.deleteComment(commentId)
}

export const obtenerResenaPorUsernameYMovieSlugService = async (
  username: string,
  movieSlug: string
) => {
  const usuario = await userRepository.findByUsername(username)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  const slug = movieSlug.trim().toLowerCase()
  const tmdbCandidateRaw = slug.split("-")[0]
  const tmdbCandidate = Number(tmdbCandidateRaw)

  let movieRefId: number | null = null

  if (Number.isFinite(tmdbCandidate)) {
    const byTmdb = await prisma.movies_ref.findUnique({
      where: { tmdb_id: tmdbCandidate },
      select: { id: true },
    })
    movieRefId = byTmdb?.id ?? null
  }

  if (!movieRefId) {
    const bySlug = await prisma.movies_ref.findUnique({
      where: { slug },
      select: { id: true },
    })
    movieRefId = bySlug?.id ?? null
  }

  if (!movieRefId && Number.isFinite(tmdbCandidate)) {
    movieRefId = await findMovieRefIdByCandidate(tmdbCandidate)
  }

  if (!movieRefId) throw new NotFoundError("Película no encontrada")

  const review = await prisma.reviews.findFirst({
    where: {
      user_id: usuario.id,
      movie_id: movieRefId,
    },
    orderBy: { created_at: "desc" },
    include: {
      users: {
        select: {
          id: true,
          username: true,
          avatar_url: true,
        },
      },
      movies_ref: {
        select: {
          id: true,
          tmdb_id: true,
          slug: true,
        },
      },
      review_comments: {
        orderBy: { created_at: "asc" },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
            },
          },
        },
      },
    },
  })

  if (!review) throw new NotFoundError("Reseña no encontrada")

  return review
}

const asegurarId = (id: number) => {
  if (!Number.isFinite(id)) throw new ValidationError("Id de reseña inválido")
  return id
}

const movieReviewsKey = (movieId: number) => `reviews:movie:${movieId}`
const movieAggregateKey = (movieId: number) => `movie:agg:${movieId}`

const invalidateResenaCache = async (movieId: number) => {
  await invalidateKeys([movieReviewsKey(movieId), movieAggregateKey(movieId)])
}

const buildMovieAggregate = async (
  movieId: number
): Promise<MovieAggregate> => {
  const [reviewsAggregate, diaryCount] = await Promise.all([
    reviewsRepository.aggregateByMovie(movieId),
    diaryRepository.countByMovie(movieId),
  ])

  return {
    movie_id: movieId,
    reviews_count: reviewsAggregate.review_count,
    avg_rating: reviewsAggregate.avg_rating,
    likes_total: reviewsAggregate.likes_total,
    diary_entries: diaryCount,
  }
}

type MovieAggregate = {
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

const normalizeReviewPayload = (
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

const canUseCriticalMode = (membership?: string | null, role?: string | null) => {
  const normalizedMembership = String(membership || "").toLowerCase()
  const normalizedRole = String(role || "").toLowerCase()
  return normalizedMembership === "pro" || normalizedRole === "admin"
}
