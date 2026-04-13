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

export const vaultSocialEntryTypeSchema = z.enum([
  "reflexion",
  "edit",
  "critica",
  "recomendacion",
])

export const listVaultSocialQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(30).optional().default(12),
})

export const vaultSocialUserParamsSchema = z.object({
  id_user: z.coerce.number().int().positive("id_user invalido"),
})

export const createVaultSocialEntrySchema = z.object({
  movie_id: z.coerce.number().int().positive().optional(),
  entry_type: vaultSocialEntryTypeSchema,
  title: z
    .string({ error: "title debe ser un texto" })
    .trim()
    .min(3, "title debe tener al menos 3 caracteres")
    .max(180, "title no puede superar 180 caracteres"),
  content: z
    .string({ error: "content debe ser un texto" })
    .trim()
    .min(10, "content debe tener al menos 10 caracteres")
    .max(5000, "content no puede superar 5000 caracteres"),
  cover_url: z
    .string({ error: "cover_url debe ser un texto" })
    .trim()
    .max(500, "cover_url no puede superar 500 caracteres")
    .optional(),
  duration_label: z
    .string({ error: "duration_label debe ser un texto" })
    .trim()
    .max(32, "duration_label no puede superar 32 caracteres")
    .optional(),
  is_public: z.boolean().optional().default(true),
})

export const vaultSocialEntryIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID de entrada invalido"),
})

export const updateVaultSocialEntrySchema = z
  .object({
    movie_id: z.coerce.number().int().positive().optional(),
    entry_type: vaultSocialEntryTypeSchema.optional(),
    title: z
      .string({ error: "title debe ser un texto" })
      .trim()
      .min(3, "title debe tener al menos 3 caracteres")
      .max(180, "title no puede superar 180 caracteres")
      .optional(),
    content: z
      .string({ error: "content debe ser un texto" })
      .trim()
      .min(10, "content debe tener al menos 10 caracteres")
      .max(5000, "content no puede superar 5000 caracteres")
      .optional(),
    cover_url: z
      .string({ error: "cover_url debe ser un texto" })
      .trim()
      .max(500, "cover_url no puede superar 500 caracteres")
      .optional(),
    duration_label: z
      .string({ error: "duration_label debe ser un texto" })
      .trim()
      .max(32, "duration_label no puede superar 32 caracteres")
      .optional(),
    is_public: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  })

export type AgregarVaultDTO = z.infer<typeof agregarVaultSchema>
export type EliminarVaultParamsDTO = z.infer<typeof eliminarVaultParamsSchema>
export type ListVaultSocialQueryDTO = z.infer<typeof listVaultSocialQuerySchema>
export type CreateVaultSocialEntryDTO = z.infer<
  typeof createVaultSocialEntrySchema
>
export type UpdateVaultSocialEntryDTO = z.infer<
  typeof updateVaultSocialEntrySchema
>
