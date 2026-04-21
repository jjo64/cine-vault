/**
 * @file ReportsRepository.ts
 * @description Capa de persistencia para el sistema de moderación y auditoría de contenidos.
 * Gestiona el flujo de denuncias (Report/Abuse) sobre reseñas y comentarios. 
 * Utiliza SQL nativo (Prisma.sql) para realizar proyecciones complejas que integran 
 * metadatos de denunciantes, sujetos denunciados y moderadores en una sola operación de lectura.
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

/** Ciclo de vida administrativo de una denuncia */
export type ReportStatus = "pending" | "resolved" | "rejected"

/** 
 * Estructura enriquecida de un reporte para el Panel de Moderación. 
 * Combina la traza de la denuncia con identidades de usuario y contenido sujeto a revisión.
 */
export type ReportRow = {
  id: number
  /** Usuario que emite la queja */
  reporter_id: number | null
  /** Referencia a la reseña denunciada */
  review_id: number | null
  /** Explicación detallada del motivo de la denuncia */
  reason: string | null
  status: ReportStatus
  created_at: Date
  /** Marca temporal de la resolución administrativa */
  resolved_at: Date | null
  /** Moderador que tomó la decisión final */
  resolved_by_user_id: number | null
  /** Nota justificativa de la resolución */
  resolution_note: string | null
  
  // Metadatos de Red (JOINS)
  reporter_username: string | null
  reporter_avatar_url: string | null
  review_owner_id: number | null
  review_owner_username: string | null
  review_content: string | null
}

/** 
 * Fragmento SQL base para las consultas de supervisión. 
 * Optimiza la recuperación de identidades cruzadas mediante un triple JOIN.
 */
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

/**
 * Repositorio de Reportes
 * Orquestra el motor de auditoría técnica y social de la plataforma.
 */
export class ReportsRepository {
  /**
   * Genera dinámicamente predicados SQL basados en los filtros de moderación activos.
   * 
   * @param status - Estado del flujo deseado o 'all' para vista global.
   * @param reviewId - Filtro opcional para agrupar denuncias sobre una misma obra.
   */
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

  /**
   * Lista y pagina las incidencias reportadas.
   * Proporciona los metadatos necesarios para que el staff de CineVault pueda 
   * tomar decisiones de moderación informadas.
   */
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

  /**
   * Recupera la trazabilidad completa de un reporte individual.
   */
  async getReportById(reportId: number) {
    const rows = await prisma.$queryRaw<ReportRow[]>(Prisma.sql`
      ${REPORTS_BASE_SELECT}
      WHERE r.id = ${reportId}
      LIMIT 1
    `)

    return rows[0] ?? null
  }

  /**
   * Registra una resolución administrativa.
   * 
   * @param input - Datos de la resolución, incluyendo el moderador y la nota técnica.
   */
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

  /**
   * Obtiene la distribución estadística del estado de la moderación global.
   * Útil para KPIs de salud de la comunidad.
   */
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

/** Instancia exportada del repositorio de moderación */
export const reportsRepository = new ReportsRepository()
