/**
 * @file feed.ts
 * @description Esquemas de validación Zod para el Feed de Actividad y Recomendaciones.
 * Gestiona la integridad de las peticiones para la obtención del feed paginado 
 * y las interacciones sociales (likes, bookmarks, compartir) sobre sus elementos.
 */

import { z } from "zod"

/** Esquema para la consulta paginada del feed principal */
export const feedQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(30).optional().default(10),
})

/** Tipos de elementos permitidos dentro del flujo del feed */
export const feedItemTypeSchema = z.enum([
  "review",    // Nueva reseña de un usuario
  "vault",     // Película añadida a la Bóveda
  "watchlist", // Película añadida a "Por ver"
  "discovery", // Recomendación algorítmica
  "tonight",   // Sugerencia diaria
  "list",      // Nueva lista curada
  "quote",     // Cita destacada de director
])

/** 
 * Referencia compuesta para identificar un ítem de forma unívoca.
 * Formato esperado: tipo_item-id_numérico (ej: "review-123").
 */
const itemRefSchema = z
  .string({ error: "item_ref debe ser un texto" })
  .trim()
  .regex(/^[a-z_]+-\d+$/, "El campo item_ref debe seguir el patrón 'tipo-id'")

/** 
 * Esquema base para cualquier acción social sobre un elemento del feed.
 * Requiere identificar el ítem mediante su referencia compuesta o su tipo+id.
 */
export const feedActionSchema = z
  .object({
    item_ref: itemRefSchema.optional(),
    item_type: feedItemTypeSchema.optional(),
    item_id: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (payload) =>
      Boolean(payload.item_ref) ||
      (Boolean(payload.item_type) && Boolean(payload.item_id)),
    {
      message: "Debe proporcionar 'item_ref' o la combinación de 'item_type' e 'item_id'",
    }
  )

/** Esquema para la acción de dar/quitar 'Like' */
export const feedLikeActionSchema = feedActionSchema.extend({
  active: z.boolean().optional().default(true),
})

/** Esquema para guardar un ítem en marcadores personales */
export const feedBookmarkActionSchema = feedActionSchema.extend({
  active: z.boolean().optional().default(true),
})

/** Esquema para ocultar un elemento del feed (no volver a mostrarlo) */
export const feedHideActionSchema = feedActionSchema.extend({
  active: z.boolean().optional().default(true),
})

/** Esquema para registrar la acción de compartir un ítem en redes externas */
export const feedShareActionSchema = feedActionSchema.extend({
  channel: z
    .string({ error: "channel debe ser un texto" })
    .trim()
    .max(64, "El nombre del canal no puede superar los 64 caracteres")
    .optional(),
})

// Tipado exportado deducido de los esquemas para uso en la capa de Aplicación
export type FeedQueryDTO = z.infer<typeof feedQuerySchema>
export type FeedActionDTO = z.infer<typeof feedActionSchema>
export type FeedLikeActionDTO = z.infer<typeof feedLikeActionSchema>
export type FeedBookmarkActionDTO = z.infer<typeof feedBookmarkActionSchema>
export type FeedHideActionDTO = z.infer<typeof feedHideActionSchema>
export type FeedShareActionDTO = z.infer<typeof feedShareActionSchema>
