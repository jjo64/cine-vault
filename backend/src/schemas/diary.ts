import { z } from "zod"

/* ==========================================================================
   SCHEMAS DE DIARIO — Validación de entrada con Zod
   ========================================================================== */

/** Crear una entrada en el diario de visionado */
export const crearEntradaDiarioSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un número" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
  watched_date: z
    .string()
    .date({ message: "watched_date debe ser YYYY-MM-DD" })
    .optional(),
  notes: z
    .string()
    .max(1000, "Las notas no pueden superar 1000 caracteres")
    .optional(),
})

export const diaryUserParamsSchema = z.object({
  id_user: z.coerce.number().int().positive("id_user debe ser positivo"),
})

export const diaryIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("id debe ser positivo"),
})

export type DiaryUserParamsDTO = z.infer<typeof diaryUserParamsSchema>
export type DiaryIdParamsDTO = z.infer<typeof diaryIdParamsSchema>
export type CrearEntradaDiarioDTO = z.infer<typeof crearEntradaDiarioSchema>
