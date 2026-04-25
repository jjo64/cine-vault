/**
 * @file diary.ts
 * @description Esquemas de validación Zod para el Diario de Visionado personal.
 * Define las reglas de integridad para registrar cuándo y bajo qué circunstancias 
 * un usuario ha visionado una obra cinematográfica.
 */

import { z } from "zod"

/** 
 * Esquema para la creación de una nueva entrada en el diario.
 * Permite capturar la película, la fecha de visionado y notas privadas opcionales.
 */
export const crearEntradaDiarioSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un número" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
  media_type: z.enum(["movie", "tv"]).optional().default("movie"),
  watched_date: z
    .string()
    .date({ message: "La fecha de visionado debe seguir el formato YYYY-MM-DD" })
    .optional(),
  notes: z
    .string()
    .max(1000, "Las notas personales no pueden superar los 1000 caracteres")
    .optional(),
})

/** Esquema para validar consultas filtradas por el ID de un usuario específico */
export const diaryUserParamsSchema = z.object({
  id_user: z.coerce.number().int().positive("El identificador del usuario debe ser mayor a cero"),
})

/** Esquema para validar el acceso o borrado de una entrada específica del diario por su ID */
export const diaryIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("El identificador de la entrada debe ser mayor a cero"),
})

// Tipado exportado deducido de los esquemas para uso en controladores
export type DiaryUserParamsDTO = z.infer<typeof diaryUserParamsSchema>
export type DiaryIdParamsDTO = z.infer<typeof diaryIdParamsSchema>
export type CrearEntradaDiarioDTO = z.infer<typeof crearEntradaDiarioSchema>
