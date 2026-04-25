/**
 * @file profile.ts
 * @description Esquemas de validación Zod para la personalización estética y técnica del Perfil de Usuario.
 * Gestiona la integridad de los datos de la "Firma Cinematográfica" (preferencias artísticas profundas)
 * y la "Galería Curada" (selección manual de obras destacadas).
 */

import { z } from "zod"

/**
 * Esquema para la actualización de la Firma Cinematográfica.
 * Permite registrar hitos personales como la película pivotal, el director formativo,
 * escenas inolvidables y años clave en la historia del cine para el usuario.
 */
export const actualizarFirmaSchema = z
  .object({
    pivotal_film: z.string().max(255).optional().nullable(),
    pivotal_film_detail: z.string().max(255).optional().nullable(),
    formative_director: z.string().max(255).optional().nullable(),
    formative_director_detail: z.string().max(255).optional().nullable(),
    unforgettable_scene: z.string().max(255).optional().nullable(),
    unforgettable_scene_detail: z.string().max(255).optional().nullable(),
    cinema_turning_year: z.string().max(255).optional().nullable(),
    cinema_turning_year_detail: z.string().max(255).optional().nullable(),
  })
  .refine(
    (data) =>
      data.pivotal_film !== undefined ||
      data.pivotal_film_detail !== undefined ||
      data.formative_director !== undefined ||
      data.formative_director_detail !== undefined ||
      data.unforgettable_scene !== undefined ||
      data.unforgettable_scene_detail !== undefined ||
      data.cinema_turning_year !== undefined ||
      data.cinema_turning_year_detail !== undefined,
    {
      message:
        "Debe proporcionar al menos un campo de la firma para procesar la actualización",
    }
  )

/**
 * Esquema para un ítem individual dentro de la Galería Curada.
 * Incluye el identificador de la película, su posición visual y una nota editorial opcional.
 */
export const curatedGalleryItemSchema = z.object({
  movie_id: z.coerce
    .number()
    .int()
    .positive("El identificador de película debe ser un número positivo"),
  order_index: z.coerce
    .number()
    .int()
    .min(1, "La posición de orden debe iniciar en 1"),
  note: z
    .string()
    .max(255, "La nota editorial no puede superar los 255 caracteres")
    .optional()
    .nullable(),
})

/**
 * Esquema para la actualización masiva de la Galería Curada.
 * Garantiza que la selección tenga entre 1 y 12 elementos y que los índices de posición sean únicos.
 */
export const actualizarGaleriaCuradaSchema = z
  .object({
    items: z.array(curatedGalleryItemSchema).min(1).max(12),
  })
  .refine(
    (data) => {
      const indices = data.items.map((item) => item.order_index)
      const unique = new Set(indices)
      return unique.size === indices.length
    },
    {
      message:
        "Se detectaron posiciones de orden (order_index) duplicadas en la galería",
    }
  )

// Tipado exportado deducido de los esquemas para uso en la lógica de negocio
export type ActualizarFirmaDTO = z.infer<typeof actualizarFirmaSchema>
export type CuratedGalleryItemDTO = z.infer<typeof curatedGalleryItemSchema>
export type ActualizarGaleriaCuradaDTO = z.infer<
  typeof actualizarGaleriaCuradaSchema
>
