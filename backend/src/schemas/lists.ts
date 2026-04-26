/**
 * @file lists.ts
 * @description Esquemas de validación Zod para el módulo de Listas Personalizadas.
 * Define las reglas para la creación de colecciones, su visibilidad (pública/privada)
 * y la gestión de películas dentro de cada lista.
 */

import { z } from "zod"

/** Esquema para la creación de una nueva lista de películas personalizada */
export const createListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre de la lista es requerido")
    .max(120, "El nombre no puede superar los 120 caracteres"),
  description: z
    .string()
    .trim()
    .max(400, "La descripción no puede superar los 400 caracteres")
    .optional()
    .nullable(),
  is_public: z.boolean().optional().default(true),
})

/** Esquema para la actualización parcial de los metadatos de una lista */
export const updateListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre no puede estar vacío")
    .max(120, "El nombre es demasiado largo")
    .optional(),
  description: z
    .string()
    .trim()
    .max(400, "La descripción es demasiado larga")
    .optional()
    .nullable(),
  is_public: z.boolean().optional(),
})

/** Esquema para validar la adición de una película individual a una lista */
export const addMovieToListSchema = z.object({
  movie_id: z.number().int().positive("Identificador de película inválido"),
})

/** Esquema para la consulta paginada de listas públicas en la plataforma */
export const listPublicListsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
})

/** Esquema para identificar una lista específica mediante su ID en la URL */
export const listIdParamsSchema = z.object({
  id: z.preprocess((val) => {
    if (typeof val === "string") {
      const parts = val.split("-");
      const num = parseInt(parts[0], 10);
      return isNaN(num) ? val : num;
    }
    return val;
  }, z.coerce.number().int().positive("ID de lista inválido")),
})

/** Esquema compuesto para identificar un elemento específico (película) dentro de una lista */
export const listItemParamsSchema = z.object({
  id: z.preprocess((val) => {
    if (typeof val === "string") {
      const parts = val.split("-");
      const num = parseInt(parts[0], 10);
      return isNaN(num) ? val : num;
    }
    return val;
  }, z.coerce.number().int().positive("ID de lista inválido")),
  movie_id: z.coerce
    .number()
    .int()
    .positive("Identificador de película inválido"),
})

// Tipado exportado deducido de los esquemas para uso en controladores
export type CreateListDTO = z.infer<typeof createListSchema>
export type UpdateListDTO = z.infer<typeof updateListSchema>
export type AddMovieToListDTO = z.infer<typeof addMovieToListSchema>
export type ListPublicListsQueryDTO = z.infer<typeof listPublicListsQuerySchema>
