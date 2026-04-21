/**
 * @file favorites.ts
 * @description Esquemas de validación Zod para la gestión de Películas Favoritas.
 * Define las reglas para la adición, eliminación y ordenamiento (ranking) 
 * de las obras más destacadas del perfil de un usuario.
 */

import { z } from "zod"

/** 
 * Esquema para añadir una película a la lista de favoritos.
 * Permite asignar opcionalmente una posición (rank) para mostrar en el perfil.
 */
export const agregarFavoritoSchema = z.object({
  movieId: z.coerce
    .number({ error: "movieId debe ser un número" })
    .int("movieId debe ser un entero")
    .positive("movieId debe ser positivo"),
  rank_position: z.coerce
    .number()
    .int("La posición en el ranking debe ser un número entero")
    .positive("La posición en el ranking debe ser positiva")
    .nullable()
    .optional(),
})

/** Esquema para validar el acceso a los favoritos de un usuario mediante su ID */
export const userIdParamsFavSchema = z.object({
  userId: z.coerce.number().int().positive("El identificador del usuario debe ser mayor a cero"),
})

/** Esquema para validar operaciones sobre una película específica dentro de favoritos */
export const movieIdParamsFavSchema = z.object({
  movieId: z.coerce.number().int().positive("El identificador de la película debe ser mayor a cero"),
})

// Tipado exportado deducido
export type UserIdParamsFavDTO = z.infer<typeof userIdParamsFavSchema>
export type MovieIdParamsFavDTO = z.infer<typeof movieIdParamsFavSchema>
export type AgregarFavoritoDTO = z.infer<typeof agregarFavoritoSchema>
