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
import { validarBody, validarParams, validarQuery } from "../middlewares/validation.middleware.js"
import {
  listReportsQuerySchema,
  moderateReportSchema,
  reportIdParamsSchema,
} from "../schemas/reports.js"

const router = Router()

router.get(
  "/",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_REPORTES),
  validarQuery(listReportsQuerySchema),
  manejadorAsincrono(getReports)
)

router.get(
  "/:id",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_REPORTES),
  validarParams(reportIdParamsSchema),
  manejadorAsincrono(getReportById)
)

router.patch(
  "/:id/moderation",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_REPORTES),
  validarParams(reportIdParamsSchema),
  validarBody(moderateReportSchema),
  manejadorAsincrono(moderateReport)
)

export default router
