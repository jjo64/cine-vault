/**
 * @file ReviewsRepository.ts
 * @description Repositorio central para la gestión de reseñas, críticas largas, 
 * reacciones (likes), comentarios y reportes de contenido. 
 * Implementa una abstracción completa sobre Prisma para garantizar la integridad 
 * de la red social de CineVault.
 */

import { reviews, review_likes, reports, review_comments } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import type { CrearResenaDTO, ActualizarResenaDTO } from "../schemas/reviews.js"

// --- Configuración de Proyección ---

/**
 * Campos seleccionados por defecto para proteger datos sensibles y optimizar la carga 
 * de listas de reseñas.
 */
const REVIEW_SELECT = {
  id: true,
  user_id: true,
  movie_id: true,
  mode: true,
  content: true,
  rating: true,
  veredicto: true,
  rating_direccion: true,
  rating_guion: true,
  rating_fotografia: true,
  rating_actuaciones: true,
  rating_banda_sonora: true,
  cita_dialogo: true,
  cita_personaje: true,
  timestamps: true,
  contiene_spoilers: true,
  es_critica_larga: true,
  tiempo_lectura_min: true,
  likes: true,
  created_at: true,
  movies_ref: {
    select: {
      tmdb_id: true,
    },
  },
} as const

// --- Tipos de Agregación ---

export interface MovieReviewsAggregate {
  movie_id: number
  review_count: number
  avg_rating: number | null
  likes_total: number
}

/**
 * Interfaz que define el contrato de datos para el sistema de reseñas.
 */
export interface IReviewsRepository {
  findByUserId(userId: number): Promise<Partial<reviews>[]>
  findByMovieId(movieId: number): Promise<Partial<reviews>[]>
  findByUserAndMovie(userId: number, movieId: number): Promise<reviews | null>
  findById(id: number): Promise<reviews | null>
  aggregateByMovie(movieId: number): Promise<MovieReviewsAggregate>
  create(userId: number, data: ReviewCreateData): Promise<reviews>
  update(id: number, data: ReviewUpdateData): Promise<reviews>
  delete(id: number): Promise<void>
  
  // Interacciones (Likes)
  findLike(userId: number, reviewId: number): Promise<review_likes | null>
  addLikeTransaction(
    userId: number,
    reviewId: number
  ): Promise<{ like: review_likes; review: reviews }>
  removeLikeTransaction(
    userId: number,
    reviewId: number
  ): Promise<{ like: review_likes; review: reviews }>
  
  // Moderación (Reportes)
  createReport(
    reporterId: number,
    reviewId: number,
    reason: string
  ): Promise<reports>
  
  // Social (Comentarios)
  findCommentsByReviewId(reviewId: number): Promise<review_comments[]>
  findCommentById(id: number): Promise<review_comments | null>
  createComment(
    reviewId: number,
    userId: number,
    content: string
  ): Promise<review_comments>
  updateComment(id: number, content: string): Promise<review_comments>
  deleteComment(id: number): Promise<void>
}

type ReviewCreateData = CrearResenaDTO & {
  es_critica_larga?: boolean
  tiempo_lectura_min?: number | null
}

type ReviewUpdateData = ActualizarResenaDTO & {
  es_critica_larga?: boolean
  tiempo_lectura_min?: number | null
}

/**
 * Clase ReviewsRepository
 * Implementa la persistencia para el sistema de críticas y comunidad.
 */
export class ReviewsRepository implements IReviewsRepository {
  /**
   * Recupera las reseñas de un usuario ordenadas por fecha de creación.
   */
  async findByUserId(userId: number) {
    return prisma.reviews.findMany({
      where: { user_id: userId },
      select: REVIEW_SELECT,
      orderBy: { created_at: "desc" },
    })
  }

  /**
   * Recupera todas las reseñas asociadas a una película específica.
   */
  async findByMovieId(movieId: number) {
    return prisma.reviews.findMany({
      where: { movie_id: movieId },
      select: REVIEW_SELECT,
      orderBy: { created_at: "desc" },
    })
  }

  /**
   * Busca la reseña de un usuario para una película (para validación de duplicados).
   */
  async findByUserAndMovie(userId: number, movieId: number) {
    return prisma.reviews.findFirst({
      where: { user_id: userId, movie_id: movieId },
    })
  }

  /**
   * Busca una reseña por su ID interno.
   */
  async findById(id: number) {
    return prisma.reviews.findUnique({ where: { id } })
  }

  /**
   * Obtiene una vista detallada de una reseña incluyendo comentarios hidratados.
   */
  async findDetailedByUserAndMovie(userId: number, movieRefId: number) {
    return prisma.reviews.findFirst({
      where: {
        user_id: userId,
        movie_id: movieRefId,
      },
      orderBy: { created_at: "desc" },
      include: {
        users: {
          select: { id: true, username: true, avatar_url: true },
        },
        movies_ref: {
          select: { id: true, tmdb_id: true, slug: true },
        },
        review_comments: {
          orderBy: { created_at: "asc" },
          include: {
            users: {
              select: { id: true, username: true, avatar_url: true },
            },
          },
        },
      },
    })
  }

  /**
   * Calcula estadísticas agregadas (conteo, nota media, likes) para una película.
   */
  async aggregateByMovie(movieId: number) {
    const aggregate = await prisma.reviews.aggregate({
      where: { movie_id: movieId },
      _count: { id: true },
      _avg: { rating: true },
      _sum: { likes: true },
    })

    return {
      movie_id: movieId,
      review_count: aggregate._count.id,
      avg_rating: aggregate._avg.rating ? Number(aggregate._avg.rating) : null,
      likes_total: aggregate._sum.likes ?? 0,
    }
  }

  /**
   * Registra una nueva reseña con todos sus campos técnicos opcionales.
   */
  async create(userId: number, data: ReviewCreateData) {
    return prisma.reviews.create({
      data: {
        user_id: userId,
        movie_id: data.movie_id,
        content: data.content,
        rating: data.rating,
        mode: data.mode,
        veredicto: data.veredicto,
        rating_direccion: data.rating_direccion,
        rating_guion: data.rating_guion,
        rating_fotografia: data.rating_fotografia,
        rating_actuaciones: data.rating_actuaciones,
        rating_banda_sonora: data.rating_banda_sonora,
        cita_dialogo: data.cita_dialogo,
        cita_personaje: data.cita_personaje,
        timestamps: data.timestamps,
        contiene_spoilers: data.contiene_spoilers,
        es_critica_larga: data.es_critica_larga,
        tiempo_lectura_min: data.tiempo_lectura_min,
      },
    })
  }

  /**
   * Actualiza parcialmente los campos de una reseña existente.
   */
  async update(id: number, data: ReviewUpdateData) {
    return prisma.reviews.update({
      where: { id },
      data: {
        ...(data.content !== undefined && { content: data.content }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.mode !== undefined && { mode: data.mode }),
        ...(data.veredicto !== undefined && { veredicto: data.veredicto }),
        ...(data.rating_direccion !== undefined && {
          rating_direccion: data.rating_direccion,
        }),
        ...(data.rating_guion !== undefined && {
          rating_guion: data.rating_guion,
        }),
        ...(data.rating_fotografia !== undefined && {
          rating_fotografia: data.rating_fotografia,
        }),
        ...(data.rating_actuaciones !== undefined && {
          rating_actuaciones: data.rating_actuaciones,
        }),
        ...(data.rating_banda_sonora !== undefined && {
          rating_banda_sonora: data.rating_banda_sonora,
        }),
        ...(data.cita_dialogo !== undefined && {
          cita_dialogo: data.cita_dialogo,
        }),
        ...(data.cita_personaje !== undefined && {
          cita_personaje: data.cita_personaje,
        }),
        ...(data.timestamps !== undefined && { timestamps: data.timestamps }),
        ...(data.contiene_spoilers !== undefined && {
          contiene_spoilers: data.contiene_spoilers,
        }),
        ...(data.es_critica_larga !== undefined && {
          es_critica_larga: data.es_critica_larga,
        }),
        ...(data.tiempo_lectura_min !== undefined && {
          tiempo_lectura_min: data.tiempo_lectura_min,
        }),
      },
    })
  }

  /**
   * Elimina una reseña físicamente del sistema.
   */
  async delete(id: number) {
    await prisma.reviews.delete({ where: { id } })
  }

  // ---- Gestión de Interacciones (Likes) ----

  /**
   * Verifica si un usuario ha dado like a una reseña.
   */
  async findLike(userId: number, reviewId: number) {
    return prisma.review_likes.findUnique({
      where: { user_id_review_id: { user_id: userId, review_id: reviewId } },
    })
  }

  /**
   * Ejecuta una transacción para registrar un like e incrementar el contador denormalizado.
   */
  async addLikeTransaction(userId: number, reviewId: number) {
    const [like, review] = await prisma.$transaction([
      prisma.review_likes.create({
        data: { user_id: userId, review_id: reviewId },
      }),
      prisma.reviews.update({
        where: { id: reviewId },
        data: { likes: { increment: 1 } },
      }),
    ])
    return { like, review }
  }

  /**
   * Ejecuta una transacción para eliminar un like y decrementar el contador denormalizado.
   */
  async removeLikeTransaction(userId: number, reviewId: number) {
    const [like, review] = await prisma.$transaction([
      prisma.review_likes.delete({
        where: {
          user_id_review_id: { user_id: userId, review_id: reviewId },
        },
      }),
      prisma.reviews.update({
        where: { id: reviewId },
        data: { likes: { decrement: 1 } },
      }),
    ])
    return { like, review }
  }

  // ---- Sistema de Reportes ----

  /**
   * Crea una denuncia sobre una reseña para que sea revisada por moderadores.
   */
  async createReport(reporterId: number, reviewId: number, reason: string) {
    return prisma.reports.create({
      data: {
        reporter_id: reporterId,
        review_id: reviewId,
        reason,
        status: "pending",
      },
    })
  }

  // ---- Sistema de Comentarios ----

  /**
   * Lista cronológicamente todos los comentarios de una reseña.
   */
  async findCommentsByReviewId(reviewId: number) {
    return prisma.review_comments.findMany({
      where: { review_id: reviewId },
      include: {
        users: { select: { id: true, username: true, avatar_url: true } },
      },
      orderBy: { created_at: "asc" },
    })
  }

  /**
   * Recupera un comentario específico por su ID.
   */
  async findCommentById(id: number) {
    return prisma.review_comments.findUnique({ where: { id } })
  }

  /**
   * Crea un nuevo comentario en una reseña hidratando los datos del autor.
   */
  async createComment(reviewId: number, userId: number, content: string) {
    return prisma.review_comments.create({
      data: { review_id: reviewId, user_id: userId, content },
      include: {
        users: { select: { id: true, username: true, avatar_url: true } },
      },
    })
  }

  /**
   * Actualiza el contenido de un comentario.
   */
  async updateComment(id: number, content: string) {
    return prisma.review_comments.update({
      where: { id },
      data: { content },
    })
  }

  /**
   * Elimina un comentario de forma permanente.
   */
  async deleteComment(id: number) {
    await prisma.review_comments.delete({ where: { id } })
  }
}

export const reviewsRepository = new ReviewsRepository()
