/**
 * @file ReviewsRepository.ts
 * @description Repositorio central de la capa social y crítica de CineVault.
 * Gestiona el ciclo de vida completo de las reseñas de la comunidad, desde calificaciones 
 * granulares (guion, dirección, etc.) hasta interacciones secundarias como hilos de 
 * comentarios y reacciones. Implementa lógica de denormalización atómica para 
 * optimizar la lectura de métricas de popularidad y mecanismos de resiliencia 
 * para la evolución del esquema de base de datos.
 */

import { Prisma, reviews, review_likes, reports, review_comments, reports_reason } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import type { CrearResenaDTO, ActualizarResenaDTO } from "../schemas/reviews.js"

// --- Configuraciones de Proyección y Seguridad ---

/** 
 * Conjunto de campos optimizados para la carga de listas masivas. 
 * Excluye relaciones pesadas para mejorar el throughput de la API.
 */
const REVIEW_SELECT_BASE = {
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
  users: {
    select: {
      id: true,
      username: true,
      avatar_url: true,
    },
  },
} as const

/** Proyección estándar que incluye el discriminador de tipo de medio */
const REVIEW_SELECT = {
  ...REVIEW_SELECT_BASE,
  media_type: true,
} as const

/** 
 * Proyección profunda para la vista de hilo de discusión. 
 * Hidrata el autor, la película vinculada y el árbol de comentarios.
 */
const REVIEW_THREAD_SELECT_BASE = {
  ...REVIEW_SELECT_BASE,
  users: {
    select: { id: true, username: true, avatar_url: true },
  },
  movies_ref: {
    select: { id: true, tmdb_id: true, slug: true },
  },
  review_comments: {
    orderBy: { created_at: "asc" as const },
    include: {
      users: {
        select: { id: true, username: true, avatar_url: true },
      },
    },
  },
} as const

const REVIEW_THREAD_SELECT = {
  ...REVIEW_THREAD_SELECT_BASE,
  media_type: true,
} as const

/** 
 * Guardia de resiliencia frente a migraciones pendientes. 
 * Detecta si la columna 'media_type' existe en el esquema actual.
 */
const isMissingMediaTypeColumn = (error: unknown) => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022"
  ) {
    return true
  }

  const msg = String((error as Error)?.message || "").toLowerCase()
  return msg.includes("media_type") && msg.includes("column")
}

// --- Interfaces de Agregación y Negocio ---

/** Métricas consolidadas de recepción de una obra */
export interface MovieReviewsAggregate {
  movie_id: number
  review_count: number
  avg_rating: number | null
  likes_total: number
}

/** 
 * Contrato de acceso a datos para el ecosistema de reseñas. 
 * Define la orquestación técnica de las críticas y la interacción social.
 */
export interface IReviewsRepository {
  /** Recupera el historial crítico de un autor */
  findByUserId(userId: number): Promise<Partial<reviews>[]>
  /** Obtiene el foro de discusión sobre una película */
  findByMovieId(movieId: number): Promise<Partial<reviews>[]>
  /** Localiza la opinión previa de un usuario sobre una obra */
  findByUserAndMovie(userId: number, movieId: number): Promise<reviews | null>
  /** Localiza una reseña por su ID único */
  findById(id: number): Promise<reviews | null>
  /** Calcula el impacto social (Rating/Likes) de una película */
  aggregateByMovie(movieId: number): Promise<MovieReviewsAggregate>
  /** Persiste una nueva crítica en el sistema */
  create(userId: number, data: ReviewCreateData): Promise<reviews>
  /** Actualiza los metadatos o el contenido de una crítica */
  update(id: number, data: ReviewUpdateData): Promise<reviews>
  /** Elimina una reseña y sus dependencias sociales */
  delete(id: number): Promise<void>
  
  // --- Mecanismos de Reacción (Likes) ---
  findLike(userId: number, reviewId: number): Promise<review_likes | null>
  addLikeTransaction(
    userId: number,
    reviewId: number
  ): Promise<{ like: review_likes; review: reviews }>
  removeLikeTransaction(
    userId: number,
    reviewId: number
  ): Promise<{ like: review_likes; review: reviews }>
  
  // --- Moderación Preventiva ---
  createReport(
    reporterId: number,
    reviewId: number,
    reason: string
  ): Promise<reports>
  
  // --- Capa de Discusión (Comentarios) ---
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

export type ReviewCreateData = CrearResenaDTO & {
  es_critica_larga?: boolean
  tiempo_lectura_min?: number | null
}

export type ReviewUpdateData = ActualizarResenaDTO & {
  es_critica_larga?: boolean
  tiempo_lectura_min?: number | null
}

/**
 * Repositorio de Reseñas
 * Implementación robusta que orquestra la persistencia de la voz de la comunidad.
 */
export class ReviewsRepository implements IReviewsRepository {
  /**
   * Obtiene la cronología de reseñas de un perfil.
   * Dispone de lógica de retro-compatibilidad para el campo 'media_type'.
   */
  async findByUserId(userId: number) {
    try {
      return await prisma.reviews.findMany({
        where: { user_id: userId },
        select: REVIEW_SELECT,
        orderBy: { created_at: "desc" },
      })
    } catch (error) {
      if (!isMissingMediaTypeColumn(error)) throw error

      const rows = await prisma.reviews.findMany({
        where: { user_id: userId },
        select: REVIEW_SELECT_BASE,
        orderBy: { created_at: "desc" },
      })
      return rows.map((row) => ({ ...row, media_type: "movie" as const }))
    }
  }

  /**
   * Recupera la galería de críticas sobre una obra cinematográfica.
   */
  async findByMovieId(movieId: number) {
    try {
      return await prisma.reviews.findMany({
        where: { movie_id: movieId },
        select: REVIEW_SELECT,
        orderBy: { created_at: "desc" },
      })
    } catch (error) {
      if (!isMissingMediaTypeColumn(error)) throw error

      const rows = await prisma.reviews.findMany({
        where: { movie_id: movieId },
        select: REVIEW_SELECT_BASE,
        orderBy: { created_at: "desc" },
      })
      return rows.map((row) => ({ ...row, media_type: "movie" as const }))
    }
  }

  /**
   * Identifica si un usuario posee una participación previa sobre una película.
   */
  async findByUserAndMovie(userId: number, movieId: number) {
    return prisma.reviews.findFirst({
      where: { user_id: userId, movie_id: movieId },
    })
  }

  /**
   * Recupera una reseña por identificador técnico.
   */
  async findById(id: number) {
    try {
      return await prisma.reviews.findUnique({
        where: { id },
        select: REVIEW_THREAD_SELECT,
      }) as any
    } catch (error) {
      if (!isMissingMediaTypeColumn(error)) throw error

      return prisma.reviews.findUnique({
        where: { id },
        select: REVIEW_THREAD_SELECT_BASE,
      }) as any
    }
  }

  /**
   * Obtiene la vista "Thread" detallada de una reseña.
   * Hidrata todo el contexto social: autoría, metadatos TMDB y feed de comentarios.
   */
  async findDetailedByUserAndMovie(userId: number, movieRefId: number) {
    try {
      return await prisma.reviews.findFirst({
        where: {
          user_id: userId,
          movie_id: movieRefId,
        },
        orderBy: { created_at: "desc" },
        select: REVIEW_THREAD_SELECT,
      })
    } catch (error) {
      if (!isMissingMediaTypeColumn(error)) throw error

      const review = await prisma.reviews.findFirst({
        where: {
          user_id: userId,
          movie_id: movieRefId,
        },
        orderBy: { created_at: "desc" },
        select: REVIEW_THREAD_SELECT_BASE,
      })

      if (!review) return null
      return { ...review, media_type: "movie" as const }
    }
  }

  /**
   * Genera el boletín estadístico de la recepción de una película.
   * Sumariza volumen de críticas, nota media y popularidad (likes).
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
   * Crea una nueva crítica persistiendo todos los parámetros de valoración granular.
   * Implementa redundancia defensiva para migraciones de esquema en curso.
   */
  async create(userId: number, data: ReviewCreateData) {
    try {
      return await prisma.reviews.create({
        data: {
          user_id: userId,
          movie_id: data.movie_id,
          media_type: data.media_type,
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
    } catch (error) {
      if (!isMissingMediaTypeColumn(error)) throw error

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
  }

  /**
   * Actualiza una crítica existente de forma parcial.
   */
  async update(id: number, data: ReviewUpdateData) {
    const updateData: Prisma.reviewsUpdateInput = {
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
      ...(data.timestamps !== undefined && { timestamps: data.timestamps as any }),
      ...(data.contiene_spoilers !== undefined && {
        contiene_spoilers: data.contiene_spoilers,
      }),
      ...(data.es_critica_larga !== undefined && {
        es_critica_larga: data.es_critica_larga,
      }),
      ...(data.tiempo_lectura_min !== undefined && {
        tiempo_lectura_min: data.tiempo_lectura_min,
      }),
    }

    try {
      return await prisma.reviews.update({
        where: { id },
        data: {
          ...updateData,
          ...(data.media_type !== undefined && { media_type: data.media_type }),
        },
      })
    } catch (error) {
      if (!isMissingMediaTypeColumn(error)) throw error

      return prisma.reviews.update({
        where: { id },
        data: updateData,
      })
    }
  }

  /**
   * Elimina una reseña y propaga la expiración de sus vinculaciones sociales.
   */
  async delete(id: number) {
    await prisma.reviews.delete({ where: { id } })
  }

  // ---- Gestión de Reacciones (Likes) ----

  /**
   * Verifica el estado de aceptación de una reseña por el espectador.
   */
  async findLike(userId: number, reviewId: number) {
    return prisma.review_likes.findUnique({
      where: { user_id_review_id: { user_id: userId, review_id: reviewId } },
    })
  }

  /**
   * Registra una reacción atómica.
   * Utiliza una transacción para sincronizar el registro individual con el 
   * contador denormalizado de popularidad de la reseña.
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
   * Elimina una reacción de forma atómica y decrementa la métrica de popularidad.
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

  // --- Motor de Denuncias Social ---

  /**
   * Canaliza una queja sobre una reseña hacia el flujo de moderación.
   */
  async createReport(reporterId: number, reviewId: number, reason: reports_reason) {
    return prisma.reports.create({
      data: {
        reporter_id: reporterId,
        review_id: reviewId,
        reason,
        status: "pending",
      },
    })
  }

  // --- Capa de Conversación (Comentarios) ---

  /**
   * Recupera el flujo dialéctico de una crítica.
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

  /** Localiza un aporte conversacional único */
  async findCommentById(id: number) {
    return prisma.review_comments.findUnique({ where: { id } })
  }

  /**
   * Inserta un nuevo aporte comentando una reseña.
   */
  async createComment(reviewId: number, userId: number, content: string) {
    return prisma.review_comments.create({
      data: { review_id: reviewId, user_id: userId, content },
      include: {
        users: { select: { id: true, username: true, avatar_url: true } },
      },
    })
  }

  /** Edita el contenido de un comentario propio */
  async updateComment(id: number, content: string) {
    return prisma.review_comments.update({
      where: { id },
      data: { content },
    })
  }

  /** Elimina un comentario permanentemente */
  async deleteComment(id: number) {
    await prisma.review_comments.delete({ where: { id } })
  }
}

/** Instancia maestra del repositorio de reseñas */
export const reviewsRepository = new ReviewsRepository()
