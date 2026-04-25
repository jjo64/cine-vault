/**
 * @file reviews.ts
 * @description Motor de validación Zod para el sistema de Reseñas y Crítica Cinematográfica.
 * Define la lógica de integridad para los tres modos de reseña (Rápido, Estándar y Crítico),
 * asegurando que los contenidos cumplan con los requisitos mínimos de extensión y
 * profundidad exigidos por la plataforma.
 */

import { z } from "zod"

/** Validador de rating: numérico entre 1 y 5, con saltos de 0.5 */
const ratingStep = z.coerce
  .number({ error: "El rating debe ser un valor numérico" })
  .min(1, "La calificación mínima es 1 estrella")
  .max(5, "La calificación máxima es 5 estrellas")
  .refine((n) => Number.isFinite(n) && (n * 2) % 1 === 0, {
    message: "La calificación debe progresar en incrementos de 0.5",
  })

/** Modos de reseña que alteran los requisitos de validación */
const reviewModeSchema = z.enum(["RAPIDO", "ESTANDAR", "CRITICO"])
const reviewMediaTypeSchema = z.enum(["movie", "tv"])

/** Esquema para puntos clave de tiempo (Timestamps) en la obra */
const timestampSchema = z.object({
  minuto: z
    .string()
    .trim()
    .min(1, "El indicador de tiempo es requerido")
    .max(16, "El indicador de tiempo es demasiado largo"),
  descripcion: z
    .string()
    .trim()
    .min(1, "La descripción del momento es requerida")
    .max(180, "La descripción del momento no puede superar los 180 caracteres"),
})

const optionalDimensionRating = ratingStep.optional()

/**
 * Esquema para la creación de una nueva reseña.
 * Incluye lógica de validación condicional (superRefine) según el modo elegido.
 */
export const crearResenaSchema = z
  .object({
    movie_id: z.coerce
      .number({ error: "movie_id debe ser un número" })
      .int("movie_id debe ser un entero")
      .positive("movie_id debe ser positivo"),
    media_type: reviewMediaTypeSchema.default("movie"),
    content: z
      .string()
      .trim()
      .max(
        8000,
        "El contenido de la reseña no puede superar los 8000 caracteres"
      )
      .optional(),
    rating: ratingStep.optional(),
    mode: reviewModeSchema.default("RAPIDO"),
    veredicto: z
      .string()
      .trim()
      .max(280, "El veredicto breve no puede superar los 280 caracteres")
      .optional(),

    // Ratings granulares (Dimensiones técnicas)
    rating_direccion: optionalDimensionRating,
    rating_guion: optionalDimensionRating,
    rating_fotografia: optionalDimensionRating,
    rating_actuaciones: optionalDimensionRating,
    rating_banda_sonora: optionalDimensionRating,

    cita_dialogo: z
      .string()
      .trim()
      .max(500, "La cita textual no puede superar los 500 caracteres")
      .optional(),
    cita_personaje: z
      .string()
      .trim()
      .max(120, "El nombre del personaje no puede superar los 120 caracteres")
      .optional(),

    timestamps: z
      .array(timestampSchema)
      .max(12, "Se permite un máximo de 12 momentos destacados (timestamps)")
      .optional(),
    contiene_spoilers: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    const mode = data.mode || "RAPIDO"
    const content = (data.content || "").trim()

    // Reglas Modo RÁPIDO: Enfoque micro-blogging
    if (mode === "RAPIDO") {
      if (!data.rating) {
        ctx.addIssue({
          code: "custom",
          path: ["rating"],
          message: "En el modo 'Rápido', la calificación es obligatoria",
        })
      }
      if (!content) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Debe incluir al menos una reflexión breve en modo 'Rápido'",
        })
      }
      if (content.length > 280) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "En modo 'Rápido', el contenido se limita a 280 caracteres",
        })
      }
    }

    // Reglas Modo ESTÁNDAR: Enfoque reseña tradicional
    if (mode === "ESTANDAR" && !data.veredicto?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["veredicto"],
        message: "El modo 'Estándar' requiere un veredicto sintético final",
      })
    }

    // Reglas Modo CRÍTICO: Enfoque ensayo cinematográfico
    if (mode === "CRITICO" && content.length < 500) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message:
          "El análisis en modo 'Crítico' exige una extensión mínima de 500 caracteres",
      })
    }
  })

/**
 * Esquema para la actualización parcial de una reseña.
 * Permite modificar cualquier metadato excepto el identificador de la obra (movie_id).
 */
export const actualizarResenaSchema = z
  .object({
    media_type: reviewMediaTypeSchema.optional(),
    content: z
      .string()
      .trim()
      .min(1, "El contenido de la reseña no puede estar vacío")
      .max(8000, "Límite de 8000 caracteres excedido")
      .optional(),
    rating: ratingStep.optional(),
    mode: reviewModeSchema.optional(),
    veredicto: z
      .string()
      .trim()
      .max(280, "Veredicto demasiado largo")
      .optional(),
    rating_direccion: optionalDimensionRating,
    rating_guion: optionalDimensionRating,
    rating_fotografia: optionalDimensionRating,
    rating_actuaciones: optionalDimensionRating,
    rating_banda_sonora: optionalDimensionRating,
    cita_dialogo: z.string().trim().max(500).optional(),
    cita_personaje: z.string().trim().max(120).optional(),
    timestamps: z.array(timestampSchema).max(12).optional(),
    contiene_spoilers: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message:
      "Debe proporcionar al menos un campo (contenido o calificación) para actualizar",
  })

/** Esquema para la denuncia de contenido inapropiado en una reseña */
export const reportarResenaSchema = z.object({
  reason: z
    .string()
    .min(5, "El motivo de la denuncia debe tener al menos 5 caracteres")
    .max(500, "El motivo no puede exceder los 500 caracteres"),
})

/** Esquema para la creación de comentarios en el hilo de una reseña */
export const crearComentarioSchema = z.object({
  content: z
    .string()
    .min(1, "El comentario no puede estar vacío")
    .max(1000, "El comentario no puede superar los 1000 caracteres")
    .transform((s) => s.trim()),
})

/** Esquema para la edición de un comentario existente */
export const actualizarComentarioSchema = z.object({
  content: z
    .string()
    .min(1, "El contenido del comentario es requerido")
    .max(1000, "Máximo 1000 caracteres permitidos")
    .transform((s) => s.trim()),
})

const idPositivo = z.coerce.number().int().positive()

// Esquemas de parámetros de ruta (Path Params) específicos de reseñas
export const reviewIdParamsSchema = z.object({ reviewId: idPositivo })
export const movieIdParamsSchema = z.object({ movieId: idPositivo })
export const userIdParamsSchema = z.object({ userId: idPositivo })
export const commentParamsSchema = z.object({
  reviewId: idPositivo,
  commentId: idPositivo,
})
export const commentIdParamsSchema = z.object({ commentId: idPositivo })
export const usernameMovieSlugParamsSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  movieSlug: z.string().min(1, "El slug de la película es requerido"),
})

// Exportación de tipos DTO para su uso en toda la arquitectura
export type CrearResenaDTO = z.infer<typeof crearResenaSchema>
export type ActualizarResenaDTO = z.infer<typeof actualizarResenaSchema>
export type ReportarResenaDTO = z.infer<typeof reportarResenaSchema>
export type CrearComentarioDTO = z.infer<typeof crearComentarioSchema>
export type ActualizarComentarioDTO = z.infer<typeof actualizarComentarioSchema>
