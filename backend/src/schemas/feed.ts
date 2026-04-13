import { z } from "zod"

export const feedQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(30).optional().default(10),
})

export const feedItemTypeSchema = z.enum([
  "review",
  "vault",
  "watchlist",
  "discovery",
  "tonight",
  "list",
  "quote",
])

const itemRefSchema = z
  .string({ error: "item_ref debe ser un texto" })
  .trim()
  .regex(/^[a-z_]+-\d+$/, "item_ref debe tener el formato tipo-id")

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
      message: "Debe enviar item_ref o item_type + item_id",
    }
  )

export const feedLikeActionSchema = feedActionSchema.extend({
  active: z.boolean().optional().default(true),
})

export const feedBookmarkActionSchema = feedActionSchema.extend({
  active: z.boolean().optional().default(true),
})

export const feedHideActionSchema = feedActionSchema.extend({
  active: z.boolean().optional().default(true),
})

export const feedShareActionSchema = feedActionSchema.extend({
  channel: z
    .string({ error: "channel debe ser un texto" })
    .trim()
    .max(64, "channel no puede superar 64 caracteres")
    .optional(),
})

export type FeedQueryDTO = z.infer<typeof feedQuerySchema>
export type FeedActionDTO = z.infer<typeof feedActionSchema>
export type FeedLikeActionDTO = z.infer<typeof feedLikeActionSchema>
export type FeedBookmarkActionDTO = z.infer<typeof feedBookmarkActionSchema>
export type FeedHideActionDTO = z.infer<typeof feedHideActionSchema>
export type FeedShareActionDTO = z.infer<typeof feedShareActionSchema>
