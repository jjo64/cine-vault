/**
 * @file directors.ts
 * @description Esquemas de validación Zod para el módulo de Directores.
 * Gestiona la integridad de las peticiones relacionadas con el análisis profundo (autopsias)
 * de cineastas y su filmografía.
 */

import { z } from "zod"

/**
 * Esquema para validar el acceso al análisis descriptivo de un director.
 * Requiere el ID único proporcionado habitualmente por TMDB o el sistema interno.
 */
export const directorAutopsyParamsSchema = z.object({
  id: z.coerce
    .number({ error: "El ID del director debe ser un número" })
    .int("El ID del director debe ser un entero")
    .positive("El ID del director debe ser mayor a cero"),
})

// Tipado exportado deducido
export type DirectorAutopsyParamsDTO = z.infer<
  typeof directorAutopsyParamsSchema
>
