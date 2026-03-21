import { z } from "zod"

/* ==========================================================================
   SCHEMAS DE VAULT — Validacion de entrada con Zod
   ========================================================================== */

export const agregarVaultSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un numero" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
})

export const eliminarVaultParamsSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un numero" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
})

export type AgregarVaultDTO = z.infer<typeof agregarVaultSchema>
export type EliminarVaultParamsDTO = z.infer<typeof eliminarVaultParamsSchema>
