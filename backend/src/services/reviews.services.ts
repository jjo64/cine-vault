/**
 * @file reviews.services.ts
 * @description Capa de servicios para la gestión de Críticas, Interacciones Sociales y Moderación.
 * Orquestas el ciclo de vida de las reseñas (creación, edición, borrado), el motor de 
 * interacciones (likes, comentarios), la lógica de reputación (modo crítico) y la 
 * orquestación de notificaciones en tiempo real.
 */

import { reviewsRepository } from "../repositories/ReviewsRepository.js"
import { emitirNotificacionService } from "./notifications.services.js"
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
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

// --- Constantes de Caché ---

const movieReviewsKey = (movieId: number) => `reviews:movie:${movieId}`
const movieAggregateKey = (movieId: number) => `movie:agg:${movieId}`

// --- Funciones de Utilidad Interna ---

/**
 * Valida si el identificador es un número finito.
 */
const asegurarId = (id: number) => {
  if (!Number.isFinite(id)) throw new ValidationError("Id de reseña inválido")
  return id
}

/**
 * Gestiona la invalidación masiva de claves de caché ante mutaciones de reseñas.
 */
const invalidateResenaCache = async (movieId: number) => {
  await invalidateKeys([movieReviewsKey(movieId), movieAggregateKey(movieId)])
}

/**
 * Determina si un usuario tiene privilegios para usar el "Modo Crítico" (Pro/Admin).
 */
const canUseCriticalMode = (
  membership?: string | null,
  role?: string | null
) => {
  const normalizedMembership = String(membership || "").toLowerCase()
  const normalizedRole = String(role || "").toLowerCase()
  return normalizedMembership === "pro" || normalizedRole === "admin"
}

/**
 * Resuelve una película a partir de un slug (ej: "123-interstellar") o identificador.
 */
const resolverMovieRefIdPorSlug = async (
  movieSlug: string
): Promise<number | null> => {
  const slug = movieSlug.trim().toLowerCase()
  const tmdbCandidate = Number(slug.split("-")[0])

  // 1. Priorizar resolución por ID de TMDB si el slug lo contiene
  if (Number.isFinite(tmdbCandidate)) {
    const byTmdb = await movieRefRepository.findByTmdbId(tmdbCandidate)
    if (byTmdb) return byTmdb.id
  }

  // 2. Intentar resolución por slug textual exacto
  const bySlug = await movieRefRepository.findBySlug(slug)
  if (bySlug) return bySlug.id

  // 3. Fallback: creación/recuperación perezosa vía TMDB API
  if (Number.isFinite(tmdbCandidate)) {
    return findMovieRefIdByCandidate(tmdbCandidate)
  }

  return null
}

/**
 * Calcula métricas agregadas de una película combinando datos de reseñas y diarios.
 */
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

// --- Servicios de Reseñas ---

/**
 * Recupera todas las reseñas publicadas por un usuario específico.
 */
export const obtenerResenasPorUsuarioService = async (userId: number) => {
  const rows = await reviewsRepository.findByUserId(userId)
  return rows.map((row) => ({
    ...row,
    tmdb_id: row.movies_ref?.tmdb_id ?? null,
  }))
}

/**
 * Recupera las reseñas de una película, empleando una capa de caché de Redis.
 */
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

/**
 * Orquestas la creación de una reseña, validando permisos y unicidad (máximo una reseña por película/usuario).
 */
export const crearResenaService = async (userId: number, data: CrearResenaDTO) => {
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
  if (existente) {
    throw new ConflictError("Ya tienes una reseña para esta película")
  }

  const resena = await reviewsRepository.create(userId, {
    ...normalized,
    movie_id: movieId,
  })

  await invalidateResenaCache(movieId)
  return resena
}

/**
 * Actualiza una reseña existente verificando la propiedad del autor.
 */
export const actualizarResenaService = async (
  userId: number,
  reviewId: number,
  data: ActualizarResenaDTO
) => {
  const id = asegurarId(reviewId)
  const resena = await reviewsRepository.findById(reviewId)
  if (!resena) throw new NotFoundError("Reseña no encontrada")
  
  if (resena.user_id !== userId) {
    throw new ForbiddenError("No tienes permiso para editar esta reseña")
  }

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

/**
 * Elimina una reseña y limpia sus referencias de caché.
 */
export const eliminarResenaService = async (
  userId: number,
  reviewId: number
) => {
  const id = asegurarId(reviewId)
  const resena = await reviewsRepository.findById(id)
  if (!resena) throw new NotFoundError("Reseña no encontrada")
  
  if (resena.user_id !== userId) {
    throw new ForbiddenError("No tienes permiso para eliminar esta reseña")
  }

  await reviewsRepository.delete(id)
  await invalidateResenaCache(resena.movie_id)
}

/**
 * Permite a los usuarios marcar contenido inapropiado para revisión de moderadores.
 */
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

// --- Servicios de Métricas y Agregados ---

/**
 * Recupera el resumen estadístico de una película para su ficha técnica.
 */
export const obtenerAgregadoPeliculaService = async (movieId: number) => {
  const cacheKey = movieAggregateKey(movieId)
  const cached = await getCache<MovieAggregate>(cacheKey)
  if (cached) return cached

  const aggregate = await buildMovieAggregate(movieId)
  await setCache(cacheKey, aggregate)
  return aggregate
}

// --- Servicios de Interacción Social (Likes y Comentarios) ---

/**
 * Registra un "Like" y emite una notificación social en tiempo real al autor.
 */
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

  // Desacoplamiento de eventos secundarios hacia el motor de notificaciones
  if (review.user_id !== userId) {
    await emitirNotificacionService({
      user_id: review.user_id,
      sender_id: userId,
      type: "like",
    }).catch(err => {
      console.error("[Notificaciones] Fallo al emitir notificación de like:", err)
    })
  }

  return { like, review }
}

/**
 * Elimina la reacción de "Like" de una reseña.
 */
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

/**
 * Obtiene la conversación activa de una reseña.
 */
export const obtenerComentariosService = (reviewId: number) =>
  reviewsRepository.findCommentsByReviewId(asegurarId(reviewId))

/**
 * Registra un nuevo comentario en la reseña de otro usuario.
 */
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

  // Emisión de notificación social si el comentario no es del propio autor de la reseña
  if (resena.user_id !== userId) {
    await emitirNotificacionService({
      user_id: resena.user_id,
      sender_id: userId,
      type: "comment",
    }).catch((err) => {
      console.error(
        "[Notificaciones] Fallo al emitir notificación de comentario:",
        err
      )
    })
  }

  return { comentario, review: resena }
}

/**
 * Permite al autor editar su aportación en el hilo de comentarios.
 */
export const actualizarComentarioService = async (
  userId: number,
  commentId: number,
  data: ActualizarComentarioDTO
) => {
  const comentario = await reviewsRepository.findCommentById(commentId)
  if (!comentario) throw new NotFoundError("Comentario no encontrado")
  
  if (comentario.user_id !== userId) {
    throw new ForbiddenError("No tienes permiso para editar este comentario")
  }

  return reviewsRepository.updateComment(commentId, data.content)
}

/**
 * Elimina un comentario de forma permanente.
 */
export const eliminarComentarioService = async (
  userId: number,
  commentId: number
) => {
  const comentario = await reviewsRepository.findCommentById(commentId)
  if (!comentario) throw new NotFoundError("Comentario no encontrado")
  
  if (comentario.user_id !== userId) {
    throw new ForbiddenError("No tienes permiso para eliminar este comentario")
  }

  await reviewsRepository.deleteComment(commentId)
}

/**
 * Recupera una reseña específica a partir de su URL amigable (username/slug).
 */
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
