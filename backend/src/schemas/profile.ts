import { z } from "zod"

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
    { message: "Debes enviar al menos un campo de firma" }
  )

export const curatedGalleryItemSchema = z.object({
  movie_id: z.coerce.number().int().positive("movie_id debe ser positivo"),
  order_index: z.coerce.number().int().min(1, "order_index debe iniciar en 1"),
  note: z
    .string()
    .max(255, "La nota no puede superar 255 caracteres")
    .optional()
    .nullable(),
})

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
    { message: "order_index no puede repetirse" }
  )

export type ActualizarFirmaDTO = z.infer<typeof actualizarFirmaSchema>
export type CuratedGalleryItemDTO = z.infer<typeof curatedGalleryItemSchema>
export type ActualizarGaleriaCuradaDTO = z.infer<
  typeof actualizarGaleriaCuradaSchema
>
