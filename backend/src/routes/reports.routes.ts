/**
 * @file reports.routes.ts
 * @description Panel de control para la moderación de contenido.
 * Permite a los administradores y moderadores visualizar denuncias de usuarios
 * y aplicar acciones correctivas (moderación) sobre el contenido reportado.
 */

import { Router } from "express"
import { PERMISOS } from "../config/permisos.js"
import {
  getReportById,
  getReports,
  moderateReport,
} from "../controllers/ReportsController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { verificarPermiso } from "../middlewares/rbac.middleware.js"
import {
  validarBody,
  validarParams,
  validarQuery,
} from "../middlewares/validation.middleware.js"
import {
  listReportsQuerySchema,
  moderateReportSchema,
  reportIdParamsSchema,
} from "../schemas/reports.js"

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Herramientas de moderación administrativa
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: ADMINISTRACIÓN (Consulta)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Listar todas las denuncias pendientes o resueltas
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_REPORTES),
  validarQuery(listReportsQuerySchema),
  manejadorAsincrono(getReports)
)

/**
 * Obtener detalle de una denuncia específica mediante su ID.
 */
router.get(
  "/:id",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_REPORTES),
  validarParams(reportIdParamsSchema),
  manejadorAsincrono(getReportById)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: MODERACIÓN (Acción)
 * ---------------------------------------------------------------------------
 */

/**
 * Aplicar acciones de moderación (Aprobar, Rechazar, Banear) sobre un reporte.
 */
router.patch(
  "/:id/moderation",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_REPORTES),
  validarParams(reportIdParamsSchema),
  validarBody(moderateReportSchema),
  manejadorAsincrono(moderateReport)
)

export default router
