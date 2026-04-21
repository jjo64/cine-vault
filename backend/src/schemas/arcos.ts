/**
 * @file arcos.ts
 * @description Esquemas de validación Zod para el módulo de Arcos Cinematográficos.
 * Define las reglas de integridad para la creación, edición, moderación y seguimiento 
 * del progreso en las rutas educativas y temáticas de la plataforma.
 */

import { z } from "zod"

/** Esquema para validar IDs recibidos como parámetros de ruta */
export const arcoIdParamsSchema = z.object({
  id: z.coerce
    .number({ error: "id debe ser un número" })
    .int("id debe ser un entero")
    .positive("id debe ser positivo"),
})

/** Esquema para el registro de progreso individual en una película del arco */
export const marcarProgresoArcoSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un número" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
})

/** Niveles de complejidad disponibles para la clasificación de arcos */
const arcoLevelSchema = z.enum(["INICIACION", "INTERMEDIO", "AVANZADO"])

/** Esquema interno para los ítems de película dentro de un arco */
const arcoMovieInputSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un número" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
  note: z
    .string({ error: "note debe ser un texto" })
    .trim()
    .max(600, "La nota no puede superar los 600 caracteres")
    .optional(),
  is_optional: z.boolean().optional().default(false),
})

/** Esquema para la creación de un nuevo arco cinematográfico */
export const crearArcoSchema = z.object({
  title: z
    .string({ error: "title debe ser un texto" })
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(180, "El título no puede superar los 180 caracteres"),
  description: z
    .string({ error: "description debe ser un texto" })
    .trim()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(4000, "La descripción no puede superar los 4000 caracteres"),
  poster_url: z
    .string({ error: "poster_url debe ser un texto" })
    .trim()
    .min(3, "La URL del póster es requerida"),
  level: arcoLevelSchema.default("INTERMEDIO"),
  movies: z
    .array(arcoMovieInputSchema, { error: "movies debe ser un arreglo" })
    .min(2, "Un arco debe tener al menos 2 películas")
    .max(80, "Un arco no puede superar las 80 películas"),
})

/** Esquema para la actualización parcial de un arco */
export const actualizarArcoSchema = z
  .object({
    title: z
      .string({ error: "title debe ser un texto" })
      .trim()
      .min(3, "El título debe tener al menos 3 caracteres")
      .max(180, "El título no puede superar los 180 caracteres")
      .optional(),
    description: z
      .string({ error: "description debe ser un texto" })
      .trim()
      .min(10, "La descripción debe tener al menos 10 caracteres")
      .max(4000, "La descripción no puede superar los 4000 caracteres")
      .optional(),
    poster_url: z
      .string({ error: "poster_url debe ser un texto" })
      .trim()
      .min(3, "La URL del póster no puede estar vacía")
      .optional(),
    level: arcoLevelSchema.optional(),
    movies: z
      .array(arcoMovieInputSchema, { error: "movies debe ser un arreglo" })
      .min(2, "Un arco debe tener al menos 2 películas")
      .max(80, "Un arco no puede superar las 80 películas")
      .optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  })

/** Esquema administrativo para la moderación (aprobación/rechazo) de arcos */
export const moderarArcoSchema = z.object({
  status: z.enum(["approved", "rejected", "archived"]),
  review_note: z
    .string({ error: "review_note debe ser un texto" })
    .trim()
    .max(500, "La nota de revisión no puede superar los 500 caracteres")
    .optional(),
  cinevault_badge: z
    .string({ error: "cinevault_badge debe ser un texto" })
    .trim()
    .max(120, "El texto del badge no puede superar los 120 caracteres")
    .optional(),
})

/** Filtros permitidos para el listado administrativo de arcos */
export const listArcosModeracionQuerySchema = z.object({
  status: z
    .enum(["pending_review", "approved", "rejected", "archived"])
    .default("pending_review")
    .optional(),
})

// Tipado exportado deducido de los esquemas
export type ArcoIdParamsDTO = z.infer<typeof arcoIdParamsSchema>
export type MarcarProgresoArcoDTO = z.infer<typeof marcarProgresoArcoSchema>
export type CrearArcoDTO = z.infer<typeof crearArcoSchema>
export type ActualizarArcoDTO = z.infer<typeof actualizarArcoSchema>
export type ModerarArcoDTO = z.infer<typeof moderarArcoSchema>
export type ListArcosModeracionQueryDTO = z.infer<
  typeof listArcosModeracionQuerySchema
>
