import { z } from "zod"

/* ==========================================================================
   SCHEMAS DE RESEÑAS — Validación de entrada con Zod
   --------------------------------------------------------------------------
   Cada schema se exporta junto a su tipo inferido (`z.infer`) para que
   los servicios consuman tipos seguros en lugar de `any` o `req.body` crudo.
   ========================================================================== */

const ratingStep = z.coerce
  .number({ error: "rating debe ser numérico" })
  .min(1, "El rating mínimo es 1")
  .max(5, "El rating máximo es 5")
  .refine((n) => Number.isFinite(n) && (n * 2) % 1 === 0, {
    message: "El rating debe avanzar de a 0.5",
  })

const reviewModeSchema = z.enum(["RAPIDO", "ESTANDAR", "CRITICO"])

const timestampSchema = z.object({
  minuto: z
    .string()
    .trim()
    .min(1, "El minuto no puede estar vacío")
    .max(16, "El minuto no puede superar 16 caracteres"),
  descripcion: z
    .string()
    .trim()
    .min(1, "La descripción del timestamp no puede estar vacía")
    .max(180, "La descripción del timestamp no puede superar 180 caracteres"),
})

const optionalDimensionRating = ratingStep.optional()

/** Crear una nueva reseña */
export const crearResenaSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un número" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
  content: z
    .string()
    .trim()
    .max(8000, "El contenido no puede superar 8000 caracteres")
    .optional(),
  rating: ratingStep.optional(),
  mode: reviewModeSchema.default("RAPIDO"),
  veredicto: z
    .string()
    .trim()
    .max(280, "El veredicto no puede superar 280 caracteres")
    .optional(),
  rating_direccion: optionalDimensionRating,
  rating_guion: optionalDimensionRating,
  rating_fotografia: optionalDimensionRating,
  rating_actuaciones: optionalDimensionRating,
  rating_banda_sonora: optionalDimensionRating,
  cita_dialogo: z
    .string()
    .trim()
    .max(500, "La cita no puede superar 500 caracteres")
    .optional(),
  cita_personaje: z
    .string()
    .trim()
    .max(120, "El personaje no puede superar 120 caracteres")
    .optional(),
  timestamps: z.array(timestampSchema).max(12, "No puedes agregar más de 12 timestamps").optional(),
  contiene_spoilers: z.boolean().optional(),
}).superRefine((data, ctx) => {
  const mode = data.mode || "RAPIDO"
  const content = (data.content || "").trim()

  if (mode === "RAPIDO") {
    if (!data.rating) {
      ctx.addIssue({ code: "custom", path: ["rating"], message: "En modo rápido el rating es obligatorio" })
    }
    if (!content) {
      ctx.addIssue({ code: "custom", path: ["content"], message: "En modo rápido debes dejar al menos una línea" })
    }
    if (content.length > 280) {
      ctx.addIssue({ code: "custom", path: ["content"], message: "En modo rápido el texto no puede superar 280 caracteres" })
    }
  }

  if (mode === "ESTANDAR" && !data.veredicto?.trim()) {
    ctx.addIssue({ code: "custom", path: ["veredicto"], message: "El veredicto es obligatorio en modo estándar" })
  }

  if (mode === "CRITICO" && content.length < 500) {
    ctx.addIssue({ code: "custom", path: ["content"], message: "El modo crítico requiere al menos 500 caracteres" })
  }
})

/** Actualizar una reseña existente (todos los campos opcionales, movie_id inmutable) */
export const actualizarResenaSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "El contenido no puede estar vacío")
      .max(8000, "El contenido no puede superar 8000 caracteres")
      .optional(),
    rating: ratingStep.optional(),
    mode: reviewModeSchema.optional(),
    veredicto: z.string().trim().max(280, "El veredicto no puede superar 280 caracteres").optional(),
    rating_direccion: optionalDimensionRating,
    rating_guion: optionalDimensionRating,
    rating_fotografia: optionalDimensionRating,
    rating_actuaciones: optionalDimensionRating,
    rating_banda_sonora: optionalDimensionRating,
    cita_dialogo: z.string().trim().max(500, "La cita no puede superar 500 caracteres").optional(),
    cita_personaje: z.string().trim().max(120, "El personaje no puede superar 120 caracteres").optional(),
    timestamps: z.array(timestampSchema).max(12, "No puedes agregar más de 12 timestamps").optional(),
    contiene_spoilers: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Debes proporcionar al menos content o rating para actualizar",
  })

/** Reportar una reseña */
export const reportarResenaSchema = z.object({
  reason: z
    .string()
    .min(5, "El motivo debe tener al menos 5 caracteres")
    .max(500, "El motivo no puede superar 500 caracteres"),
})

/** Comentar en una reseña */
export const crearComentarioSchema = z.object({
  content: z
    .string()
    .min(1, "El comentario no puede estar vacío")
    .max(1000, "El comentario no puede superar 1000 caracteres")
    .transform((s) => s.trim()),
})

export const actualizarComentarioSchema = z.object({
  content: z
    .string()
    .min(1, "El comentario no puede estar vacío")
    .max(1000, "El comentario no puede superar 1000 caracteres")
    .transform((s) => s.trim()),
})

// Tipos inferidos — exportar para usar en servicios y controladores
export type CrearResenaDTO = z.infer<typeof crearResenaSchema>
export type ActualizarResenaDTO = z.infer<typeof actualizarResenaSchema>
export type ReportarResenaDTO = z.infer<typeof reportarResenaSchema>
export type CrearComentarioDTO = z.infer<typeof crearComentarioSchema>
export type ActualizarComentarioDTO = z.infer<typeof actualizarComentarioSchema>
