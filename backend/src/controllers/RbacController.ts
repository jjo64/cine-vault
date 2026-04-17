/**
 * @file RbacController.ts
 * @description Controlador para operaciones administrativas (RBAC).
 * Intermediario entre las rutas privilegiadas y la lógica de negocio de administración.
 */

import { Request, Response } from "express"
import * as RbacService from "../services/rbac.services.js"

/**
 * ---------------------------------------------------------------------------
 * MODERACIÓN
 * ---------------------------------------------------------------------------
 */

export const deleteReviewAdmin = async (req: Request, res: Response) => {
  await RbacService.deleteReviewAdmin(Number(req.params.id))
  res.json({ message: "Reseña eliminada correctamente" })
}

/**
 * ---------------------------------------------------------------------------
 * NOTICIAS
 * ---------------------------------------------------------------------------
 */

export const createNews = async (req: Request, res: Response) => {
  const noticia = await RbacService.createNews(req.body)
  res.status(201).json(noticia)
}

export const updateNews = async (req: Request, res: Response) => {
  const noticia = await RbacService.updateNews(Number(req.params.id), req.body)
  res.json(noticia)
}

export const deleteNews = async (req: Request, res: Response) => {
  await RbacService.deleteNews(Number(req.params.id))
  res.json({ message: "Noticia eliminada correctamente" })
}

/**
 * ---------------------------------------------------------------------------
 * REPORTES
 * ---------------------------------------------------------------------------
 */

export const getReports = async (_req: Request, res: Response) => {
  const reportes = await RbacService.getReportsAdmin()
  res.json(reportes)
}

export const resolveReport = async (req: Request, res: Response) => {
  const { status } = req.body
  const reporte = await RbacService.resolveReportAdmin(
    Number(req.params.id),
    status,
    req.user!.user_id
  )
  res.json(reporte)
}

/**
 * ---------------------------------------------------------------------------
 * USUARIOS Y AUDITORÍA
 * ---------------------------------------------------------------------------
 */

export const changeUserRole = async (req: Request, res: Response) => {
  const { role } = req.body
  const usuario = await RbacService.changeUserRole(Number(req.params.id), role)
  res.json(usuario)
}

export const getUserActivityLog = async (req: Request, res: Response) => {
  const limit = Number(req.query.limit || 100)
  const actividad = await RbacService.getUserActivityLog(limit)
  res.json(actividad)
}

export const getPaymentsLog = async (_req: Request, res: Response) => {
  const pagos = await RbacService.getPaymentsLog()
  res.json(pagos)
}
