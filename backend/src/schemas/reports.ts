/**
 * @file reports.ts
 * @description Esquemas de validación Zod para el sistema de Reportes y Denuncias.
 * Define las reglas de integridad para el listado administrativo de reportes, 
 * el filtrado por estado y la resolución por parte del equipo de moderación.
 */

import { z } from "zod"

/** 
 * Esquema para la consulta administrativa de reportes.
 * Permite paginación y filtrado por estado de resolución o ID de reseña específica.
 */
export const listReportsQuerySchema = z.object({
  status: z
    .enum(["pending", "resolved", "rejected", "all"])
    .optional()
    .default("pending"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  review_id: z.coerce.number().int().positive().optional(),
})

/** Esquema para validar el acceso a un reporte específico mediante su ID */
export const reportIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("El identificador del reporte es inválido"),
})

/** 
 * Esquema para la resolución de un reporte por un moderador.
 * Requiere el nuevo estado y permite adjuntar una nota técnica sobre la decisión tomada.
 */
export const moderateReportSchema = z.object({
  status: z.enum(["resolved", "rejected"]),
  resolution_note: z
    .string({ error: "La nota de resolución debe ser una cadena de texto" })
    .trim()
    .max(500, "La nota de resolución no puede superar los 500 caracteres")
    .optional(),
})

// Tipado exportado deducido de los esquemas para uso en servicios de moderación
export type ListReportsQueryDTO = z.infer<typeof listReportsQuerySchema>
export type ModerateReportDTO = z.infer<typeof moderateReportSchema>
