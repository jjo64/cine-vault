import { z } from "zod"

export const listReportsQuerySchema = z.object({
  status: z.enum(["pending", "resolved", "rejected", "all"]).optional().default("pending"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  review_id: z.coerce.number().int().positive().optional(),
})

export const reportIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("ID de reporte invalido"),
})

export const moderateReportSchema = z.object({
  status: z.enum(["resolved", "rejected"]),
  resolution_note: z
    .string({ error: "resolution_note debe ser un texto" })
    .trim()
    .max(500, "resolution_note no puede superar 500 caracteres")
    .optional(),
})

export type ListReportsQueryDTO = z.infer<typeof listReportsQuerySchema>
export type ModerateReportDTO = z.infer<typeof moderateReportSchema>
