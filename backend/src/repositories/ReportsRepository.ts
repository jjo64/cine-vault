import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

export type ReportStatus = "pending" | "resolved" | "rejected"

export type ReportRow = {
  id: number
  reporter_id: number | null
  review_id: number | null
  reason: string | null
  status: ReportStatus
  created_at: Date
  resolved_at: Date | null
  resolved_by_user_id: number | null
  resolution_note: string | null
  reporter_username: string | null
  reporter_avatar_url: string | null
  review_owner_id: number | null
  review_owner_username: string | null
  review_content: string | null
}

const REPORTS_BASE_SELECT = Prisma.sql`
  SELECT
    r.id,
    r.reporter_id,
    r.review_id,
    r.reason,
    r.status,
    r.created_at,
    r.resolved_at,
    r.resolved_by_user_id,
    r.resolution_note,
    reporter.username AS reporter_username,
    reporter.avatar_url AS reporter_avatar_url,
    review_owner.id AS review_owner_id,
    review_owner.username AS review_owner_username,
    rv.content AS review_content
  FROM reports r
  LEFT JOIN users reporter ON reporter.id = r.reporter_id
  LEFT JOIN reviews rv ON rv.id = r.review_id
  LEFT JOIN users review_owner ON review_owner.id = rv.user_id
`

export class ReportsRepository {
  private buildWhere(status: ReportStatus | "all", reviewId?: number) {
    const filters: Prisma.Sql[] = []

    if (status !== "all") {
      filters.push(Prisma.sql`r.status = ${status}`)
    }

    if (reviewId) {
      filters.push(Prisma.sql`r.review_id = ${reviewId}`)
    }

    if (!filters.length) return Prisma.empty
    return Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
  }

  async listReports(params: {
    status: ReportStatus | "all"
    page: number
    limit: number
    reviewId?: number
  }) {
    const offset = (params.page - 1) * params.limit
    const whereSql = this.buildWhere(params.status, params.reviewId)

    const [items, totals] = await Promise.all([
      prisma.$queryRaw<ReportRow[]>(Prisma.sql`
        ${REPORTS_BASE_SELECT}
        ${whereSql}
        ORDER BY r.created_at DESC
        LIMIT ${params.limit} OFFSET ${offset}
      `),
      prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*) AS total
        FROM reports r
        ${whereSql}
      `),
    ])

    const total = Number(totals[0]?.total ?? 0)

    return {
      page: params.page,
      limit: params.limit,
      total,
      has_more: offset + items.length < total,
      items,
    }
  }

  async getReportById(reportId: number) {
    const rows = await prisma.$queryRaw<ReportRow[]>(Prisma.sql`
      ${REPORTS_BASE_SELECT}
      WHERE r.id = ${reportId}
      LIMIT 1
    `)

    return rows[0] ?? null
  }

  async moderateReport(input: {
    reportId: number
    status: Exclude<ReportStatus, "pending">
    resolutionNote: string | null
    reviewerId: number
  }) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE reports
      SET
        status = ${input.status},
        resolution_note = ${input.resolutionNote},
        resolved_by_user_id = ${input.reviewerId},
        resolved_at = CURRENT_TIMESTAMP
      WHERE id = ${input.reportId}
    `)
  }

  async getReportsStats() {
    const rows = await prisma.$queryRaw<
      Array<{ status: ReportStatus; total: bigint }>
    >(Prisma.sql`
      SELECT status, COUNT(*) AS total
      FROM reports
      GROUP BY status
    `)

    const stats = {
      pending: 0,
      resolved: 0,
      rejected: 0,
    }

    for (const row of rows) {
      stats[row.status] = Number(row.total)
    }

    return stats
  }
}

export const reportsRepository = new ReportsRepository()
