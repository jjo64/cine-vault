/**
 * @file common.ts
 * @description Esquemas de validación Zod de propósito general y reutilizables.
 * Centraliza las reglas de integridad para parámetros comunes como identificadores
 * numéricos (IDs) y tokens de seguridad, promoviendo la consistencia en la API.
 */

import { z } from "zod"

/** Validador base para identificadores: debe ser un número entero, positivo y mayor a cero */
const idPositivo = z.coerce.number().int().positive()

/** Esquema estándar para parámetros de ruta con nombre 'id' */
export const idParamSchema = z.object({ id: idPositivo })

/** Esquema estándar para parámetros de ruta relacionados con el identificador de usuario */
export const userIdParamSchema = z.object({ userId: idPositivo })

/** Esquema estándar para parámetros de ruta relacionados con el identificador de película */
export const movieIdParamSchema = z.object({ movieId: idPositivo })

/** Variación del esquema de usuario utilizada en endpoints específicos de legado o integración */
export const idUserParamSchema = z.object({ id_user: idPositivo })

/** Variación del esquema de película utilizada para consistencia en payloads complejos */
export const movieIdAltParamSchema = z.object({ movie_id: idPositivo })

/** Esquema genérico para la validación de tokens recibidos por URL */
export const tokenParamSchema = z.object({
  token: z.string().min(1, "El token es requerido"),
})

// Definición de tipos exportados para su uso en controladores y servicios
export type IdParam = z.infer<typeof idParamSchema>
export type UserIdParam = z.infer<typeof userIdParamSchema>
export type MovieIdParam = z.infer<typeof movieIdParamSchema>
export type IdUserParam = z.infer<typeof idUserParamSchema>
export type MovieIdAltParam = z.infer<typeof movieIdAltParamSchema>
export type TokenParam = z.infer<typeof tokenParamSchema>
