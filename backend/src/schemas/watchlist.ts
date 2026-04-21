/**
 * @file watchlist.ts
 * @description Esquemas de validación Zod para la gestión de la Watchlist (Películas pendientes).
 * Define las reglas de integridad para la adición y eliminación de obras en la lista 
 * de seguimiento del usuario.
 */

import { z } from "zod"

/** 
 * Esquema para la adición de una película a la Watchlist.
 * Valida que el identificador de la obra sea un número entero positivo.
 */
export const agregarWatchlistSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un número" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
})

/** 
 * Esquema para la eliminación de una película de la Watchlist.
 * Se espera el identificador de la obra en el cuerpo de la petición.
 */
export const eliminarWatchlistSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un número" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
})

// Tipado exportado deducido de los esquemas
export type AgregarWatchlistDTO = z.infer<typeof agregarWatchlistSchema>
export type EliminarWatchlistDTO = z.infer<typeof eliminarWatchlistSchema>
