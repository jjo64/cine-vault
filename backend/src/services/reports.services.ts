import { NotFoundError, ValidationError } from "../errors/AppErrors.js"
import {
  ReportRow,
  reportsRepository,
} from "../repositories/ReportsRepository.js"
import { ListReportsQueryDTO, ModerateReportDTO } from "../schemas/reports.js"

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

export const getReportDetailService = async (reportId: number) => {
  const report = await reportsRepository.getReportById(reportId)
  if (!report) throw new NotFoundError("Reporte no encontrado")
  return mapReport(report)
}

export const moderateReportService = async (
  reviewerId: number,
  reportId: number,
  data: ModerateReportDTO
) => {
  const report = await reportsRepository.getReportById(reportId)
  if (!report) throw new NotFoundError("Reporte no encontrado")

  if (report.status !== "pending") {
    throw new ValidationError(
      "Solo se pueden moderar reportes en estado pending"
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
