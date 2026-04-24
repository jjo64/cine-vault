/**
 * @file vault.ts
 * @description Esquemas de validación Zod para el módulo de Bóveda (Vault) y Vault Social.
 * Define las reglas de integridad para el almacenamiento personal de películas ("The Vault") 
 * y la creación de contenidos enriquecidos (reflexiones, ensayos y recomendaciones) 
 * asociados a las obras cinematográficas.
 */

import { z } from "zod"

/** Esquema para añadir una película a la Bóveda personal del usuario */
export const agregarVaultSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un número" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
  media_type: z.enum(["movie", "tv"]).optional().default("movie"),
})

/** Esquema para la eliminación de una película de la Bóveda mediante parámetros de ruta */
export const eliminarVaultParamsSchema = z.object({
  movie_id: z.coerce
    .number({ error: "movie_id debe ser un número" })
    .int("movie_id debe ser un entero")
    .positive("movie_id debe ser positivo"),
})

/** Categorías de contenido permitidas dentro del sistema Vault Social */
export const vaultSocialEntryTypeSchema = z.enum([
  "reflexion",    // Pensamientos personales sobre una obra
  "edit",         // Montajes o ediciones visuales
  "critica",      // Análisis técnico o artístico
  "recomendacion", // Sugerencia curada para la comunidad
])

/** Esquema para la consulta paginada del flujo social de la Bóveda */
export const listVaultSocialQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(30).optional().default(12),
})

/** Esquema para filtrar publicaciones sociales por el ID de un usuario específico */
export const vaultSocialUserParamsSchema = z.object({
  id_user: z.coerce.number().int().positive("El identificador del usuario es inválido"),
})

/** 
 * Esquema para la creación de una nueva publicación en Vault Social.
 * Permite adjuntar portadas personalizadas, etiquetas de duración y 
 * vincular opcionalmente la entrada a una película del catálogo.
 */
export const createVaultSocialEntrySchema = z.object({
  movie_id: z.coerce.number().int().positive().optional(),
  media_type: z.enum(["movie", "tv"]).optional().default("movie"),
  entry_type: vaultSocialEntryTypeSchema,
  title: z
    .string({ error: "title debe ser un texto" })
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(180, "El título no puede superar los 180 caracteres"),
  content: z
    .string({ error: "content debe ser un texto" })
    .trim()
    .min(10, "El contenido debe tener al menos 10 caracteres")
    .max(5000, "El contenido no puede superar los 5000 caracteres"),
  cover_url: z
    .string({ error: "cover_url debe ser un texto" })
    .trim()
    .max(500, "La URL de la portada es demasiado larga")
    .optional(),
  duration_label: z
    .string({ error: "duration_label debe ser un texto" })
    .trim()
    .max(32, "La etiqueta de duración es demasiado larga")
    .optional(),
  is_public: z.boolean().optional().default(true),
})

/** Esquema para identificar una entrada específica de Vault Social por su ID */
export const vaultSocialEntryIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("El identificador de la entrada es inválido"),
})

/** Esquema para la actualización parcial de una publicación social */
export const updateVaultSocialEntrySchema = z
  .object({
    movie_id: z.coerce.number().int().positive().optional(),
    media_type: z.enum(["movie", "tv"]).optional(),
    entry_type: vaultSocialEntryTypeSchema.optional(),
    title: z
      .string({ error: "title debe ser un texto" })
      .trim()
      .min(3, "Título demasiado corto")
      .max(180, "Título demasiado largo")
      .optional(),
    content: z
      .string({ error: "content debe ser un texto" })
      .trim()
      .min(10, "Contenido insuficiente")
      .max(5000, "Contenido demasiado largo")
      .optional(),
    cover_url: z
      .string({ error: "cover_url debe ser un texto" })
      .trim()
      .max(500)
      .optional(),
    duration_label: z.string().trim().max(32).optional(),
    is_public: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar la entrada",
  })

// Tipado exportado deducido
export type AgregarVaultDTO = z.infer<typeof agregarVaultSchema>
export type EliminarVaultParamsDTO = z.infer<typeof eliminarVaultParamsSchema>
export type ListVaultSocialQueryDTO = z.infer<typeof listVaultSocialQuerySchema>
export type CreateVaultSocialEntryDTO = z.infer<
  typeof createVaultSocialEntrySchema
>
export type UpdateVaultSocialEntryDTO = z.infer<
  typeof updateVaultSocialEntrySchema
>
