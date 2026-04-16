/**
 * @file reports.services.ts
 * @description Capa de servicios para el sistema de moderación y reportes de CineVault.
 * Permite a la administración listar incidentes, consultar detalles de infracciones 
 * y ejecutar acciones de moderación (resolución de reportes) sobre el contenido.
 */

import { NotFoundError, ValidationError } from "../errors/AppErrors.js"
import {
  ReportRow,
  reportsRepository,
} from "../repositories/ReportsRepository.js"
import { ListReportsQueryDTO, ModerateReportDTO } from "../schemas/reports.js"

// --- Funciones de Utilidad Interna ---

/**
 * Transforma una fila cruda de reporte de la base de datos a un objeto de dominio 
 * estructurado con metadatos de reportero y reseña.
 */
const mapReport = (row: ReportRow) => ({
  id: row.id,
  reporter_id: row.reporter_id,
  review_id: row.review_id,
  reason: row.reason,
  status: row.status,
  created_at: row.created_at.toISOString(),
  resolved_at: row.resolved_at?.toISOString() ?? null,
  resolved_by_user_id: row.resolved_by_user_id,
  resolution_note: row.resolution_note,
  reporter: row.reporter_id
    ? {
        id: row.reporter_id,
        username: row.reporter_username,
        avatar_url: row.reporter_avatar_url,
      }
    : null,
  review: row.review_id
    ? {
        id: row.review_id,
        owner_id: row.review_owner_id,
        owner_username: row.review_owner_username,
        content: row.review_content,
      }
    : null,
})

// --- Servicios Principales ---

/**
 * Recupera un listado paginado y filtrado de reportes para el panel de administración.
 * Incluye estadísticas generales de moderación.
 */
export const listReportsService = async (query: ListReportsQueryDTO) => {
  const status = query.status || "pending"
  const page = Number(query.page || 1)
  const limit = Number(query.limit || 20)

  const payload = await reportsRepository.listReports({
    status,
    page,
    limit,
    reviewId: query.review_id,
  })

  return {
    ...payload,
    items: payload.items.map((item) => mapReport(item)),
    stats: await reportsRepository.getReportsStats(),
  }
}

/**
 * Obtiene la información detallada de un reporte específico.
 */
export const getReportDetailService = async (reportId: number) => {
  const report = await reportsRepository.getReportById(reportId)
  if (!report) throw new NotFoundError("Reporte no encontrado")
  return mapReport(report)
}

/**
 * Ejecuta una acción de moderación sobre un reporte pendiente.
 * Valida que el reporte esté en estado 'pending' antes de aplicar la resolución.
 * 
 * @param reviewerId ID del moderador que resuelve el reporte.
 * @param reportId ID del reporte a moderar.
 * @param data Datos de la resolución (estado, nota explicativa).
 * @returns El reporte actualizado tras la moderación.
 */
export const moderateReportService = async (
  reviewerId: number,
  reportId: number,
  data: ModerateReportDTO
) => {
  const report = await reportsRepository.getReportById(reportId)
  if (!report) throw new NotFoundError("Reporte no encontrado")

  if (report.status !== "pending") {
    throw new ValidationError(
      "Solo se pueden moderar reportes en estado pendiente"
    )
  }

  await reportsRepository.moderateReport({
    reportId,
    reviewerId,
    status: data.status,
    resolutionNote: data.resolution_note?.trim() || null,
  })

  const updated = await reportsRepository.getReportById(reportId)
  if (!updated) throw new NotFoundError("Reporte no encontrado")

  return mapReport(updated)
}
