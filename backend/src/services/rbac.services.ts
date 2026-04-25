/**
 * @file rbac.services.ts
 * @description Capa de servicios para la administración (RBAC) en CineVault.
 * Encapsula la lógica privilegiada para moderación, gestión de contenidos oficiales
 * y auditoría del sistema.
 */

import { prisma } from "../lib/prisma.js"
import { news_category, reports_status, users_role } from "@prisma/client"
import { emitirNotificacion } from "../controllers/NotificationsController.js"

/**
 * ---------------------------------------------------------------------------
 * MODERACIÓN DE CONTENIDO
 * ---------------------------------------------------------------------------
 */

export const deleteReviewAdmin = async (id: number) => {
  return await prisma.reviews.delete({ where: { id } })
}

/**
 * ---------------------------------------------------------------------------
 * GESTIÓN DE NOTICIAS
 * ---------------------------------------------------------------------------
 */

export const createNews = async (data: {
  title: string
  content: string
  category?: news_category
}) => {
  return await prisma.news.create({ data })
}

export const updateNews = async (id: number, data: any) => {
  return await prisma.news.update({
    where: { id },
    data,
  })
}

export const deleteNews = async (id: number) => {
  return await prisma.news.delete({ where: { id } })
}

/**
 * ---------------------------------------------------------------------------
 * GESTIÓN DE REPORTES
 * ---------------------------------------------------------------------------
 */

export const getReportsAdmin = async () => {
  return await prisma.reports.findMany({
    include: { users: true, reviews: true },
    orderBy: { created_at: "desc" },
  })
}

export const resolveReportAdmin = async (
  id: number,
  status: reports_status,
  adminId: number
) => {
  const reporte = await prisma.reports.update({
    where: { id },
    data: { status },
    include: { users: true },
  })

  // Notificar al reportero si se resolvió satisfactoriamente
  if (status === "resolved" && reporte.reporter_id) {
    await emitirNotificacion({
      user_id: reporte.reporter_id,
      sender_id: adminId,
      type: "report_resolved",
    })
  }

  return reporte
}

/**
 * ---------------------------------------------------------------------------
 * ADMINISTRACIÓN DE USUARIOS
 * ---------------------------------------------------------------------------
 */

export const changeUserRole = async (id: number, role: users_role) => {
  return await prisma.users.update({
    where: { id },
    data: { role },
    select: { id: true, username: true, role: true },
  })
}

export const getUserActivityLog = async (limit: number = 100) => {
  return await prisma.user_activity.findMany({
    include: { users: { select: { id: true, username: true } } },
    orderBy: { created_at: "desc" },
    take: limit,
  })
}

/**
 * ---------------------------------------------------------------------------
 * AUDITORÍA FINANCIERA
 * ---------------------------------------------------------------------------
 */

export const getPaymentsLog = async () => {
  return await prisma.payments.findMany({
    include: { users: { select: { id: true, username: true, email: true } } },
    orderBy: { created_at: "desc" },
  })
}
