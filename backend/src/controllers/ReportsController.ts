/**
 * @file ReportsController.ts
 * @description Controlador para el sistema de reportes y denuncias de la comunidad.
 * Permite a los administradores listar, consultar y procesar moderaciones sobre
 * contenido reportado por infracción de normas.
 */

import { Request, Response } from "express"
import type { z } from "zod"
import type {
  ListReportsQueryDTO,
  reportIdParamsSchema,
} from "../schemas/reports.js"
import {
  getReportDetailService,
  listReportsService,
  moderateReportService,
} from "../services/reports.services.js"

type ReportIdParams = z.infer<typeof reportIdParamsSchema>

/**
 * Obtiene el listado de todos los reportes registrados en la plataforma.
 */
export const getReports = async (req: Request, res: Response) => {
  const payload = await listReportsService(
    req.query as unknown as ListReportsQueryDTO
  )
  res.json(payload)
}

/**
 * Recupera el detalle completo y contexto de un reporte específico.
 */
export const getReportById = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ReportIdParams
  const payload = await getReportDetailService(id)
  res.json(payload)
}

/**
 * Registra la resolución de moderación (Aprobar/Desestimar) para un reporte.
 */
export const moderateReport = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as ReportIdParams
  const payload = await moderateReportService(req.user!.user_id, id, req.body)
  res.json(payload)
}
