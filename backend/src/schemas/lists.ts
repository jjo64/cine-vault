import { z } from "zod"

export const createListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nombre requerido")
    .max(120, "Máximo 120 caracteres"),
  description: z
    .string()
    .trim()
    .max(400, "Máximo 400 caracteres")
    .optional()
    .nullable(),
  is_public: z.boolean().optional(),
})

export const updateListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nombre requerido")
    .max(120, "Máximo 120 caracteres")
    .optional(),
  description: z
    .string()
    .trim()
    .max(400, "Máximo 400 caracteres")
    .optional()
    .nullable(),
  is_public: z.boolean().optional(),
})

export const addMovieToListSchema = z.object({
  movie_id: z.number().int().positive("movie_id inválido"),
})

export const listPublicListsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(30).optional().default(12),
})

export const listIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID de lista inválido"),
})

export const listItemParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID de lista inválido"),
  movie_id: z.coerce.number().int().positive("movie_id inválido"),
})

export type CreateListDTO = z.infer<typeof createListSchema>
export type UpdateListDTO = z.infer<typeof updateListSchema>
export type AddMovieToListDTO = z.infer<typeof addMovieToListSchema>
export type ListPublicListsQueryDTO = z.infer<typeof listPublicListsQuerySchema>
