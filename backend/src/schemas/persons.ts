/**
 * @file persons.ts
 * @description Esquemas de validación Zod para el seguimiento de personas de la industria.
 */

import { z } from "zod"

/**
 * Esquema para seguir a una persona.
 */
export const followPersonSchema = z.object({
  tmdb_id: z.coerce.number().int().positive("El ID de TMDB debe ser un número positivo"),
  name: z.string().min(1, "El nombre es requerido"),
  profile_path: z.string().nullable().optional()
})

/**
 * Parámetros para dejar de seguir.
 */
export const unfollowParamsSchema = z.object({
  tmdbId: z.coerce.number().int().positive("El ID de TMDB debe ser un número positivo")
})

export type FollowPersonDTO = z.infer<typeof followPersonSchema>
export type UnfollowParamsDTO = z.infer<typeof unfollowParamsSchema>
