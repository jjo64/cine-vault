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
import { movieRefRepository } from "../repositories/MovieRefRepository.js"
import type {
  CrearResenaDTO,
  ActualizarResenaDTO,
  ReportarResenaDTO,
  CrearComentarioDTO,
  ActualizarComentarioDTO,
} from "../schemas/reviews.js"
import {
  ensureMovieRefId,
  findMovieRefIdByCandidate,
} from "./movieRef.services.js"
import { normalizeReviewPayload, MovieAggregate } from "../lib/reviews.utils.js"

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

  if (
    data.mode === "CRITICO" &&
    !canUseCriticalMode(usuario.membership, usuario.role)
  ) {
    throw new ForbiddenError("El modo crítico es exclusivo para miembros Pro")
  }

  const normalized = normalizeReviewPayload(data)
  const movieId = await ensureMovieRefId(data.movie_id)
  const existente = await reviewsRepository.findByUserAndMovie(userId, movieId)
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

  if (
    data.mode === "CRITICO" &&
    !canUseCriticalMode(usuario.membership, usuario.role)
  ) {
    throw new ForbiddenError("El modo crítico es exclusivo para miembros Pro")
  }

  const updated = await reviewsRepository.update(
    id,
    normalizeReviewPayload(data)
  )
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

// ---------------------------------------------------------------------------
// Helpers privados
// ---------------------------------------------------------------------------

const resolverMovieRefIdPorSlug = async (
  movieSlug: string
): Promise<number | null> => {
  const slug = movieSlug.trim().toLowerCase()
  const tmdbCandidate = Number(slug.split("-")[0])

  // 1. Buscar por tmdb_id si el slug empieza por número
  if (Number.isFinite(tmdbCandidate)) {
    const byTmdb = await movieRefRepository.findByTmdbId(tmdbCandidate)
    if (byTmdb) return byTmdb.id
  }

  // 2. Buscar por slug exacto
  const bySlug = await movieRefRepository.findBySlug(slug)
  if (bySlug) return bySlug.id

  // 3. Fallback: intentar crear/recuperar el ref vía TMDB API
  if (Number.isFinite(tmdbCandidate)) {
    return findMovieRefIdByCandidate(tmdbCandidate)
  }

  return null
}

export const obtenerResenaPorUsernameYMovieSlugService = async (
  username: string,
  movieSlug: string
) => {
  const usuario = await userRepository.findByUsername(username)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  const movieRefId = await resolverMovieRefIdPorSlug(movieSlug)
  if (!movieRefId) throw new NotFoundError("Película no encontrada")

  const review = await reviewsRepository.findDetailedByUserAndMovie(
    usuario.id,
    movieRefId
  )
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

const canUseCriticalMode = (
  membership?: string | null,
  role?: string | null
) => {
  const normalizedMembership = String(membership || "").toLowerCase()
  const normalizedRole = String(role || "").toLowerCase()
  return normalizedMembership === "pro" || normalizedRole === "admin"
}
