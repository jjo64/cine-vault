/**
 * @file rbac.routes.ts
 * @description Rutas de Administración y Control de Acceso Basado en Roles (RBAC).
 * Centraliza las operaciones privilegiadas como moderación de contenido, 
 * gestión de noticias, reportes y ajuste de roles de usuario.
 * 
 * @note Las peticiones son delegadas a RbacController tras validar permisos.
 */

import { Request, Router } from "express"
import { PERMISOS } from "../config/permisos.js"
import { prisma } from "../lib/prisma.js"
import {
  changeUserRole,
  createNews,
  deleteNews,
  deleteReviewAdmin,
  getPaymentsLog,
  getReports,
  getUserActivityLog,
  resolveReport,
  updateNews,
} from "../controllers/RbacController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  verificarPermiso,
  verificarPropietarioOPermiso,
} from "../middlewares/rbac.middleware.js"

/**
 * @swagger
 * tags:
 *   name: Admin-RBAC
 *   description: Operaciones administrativas restringidas por rol
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: MODERACIÓN DE CONTENIDO (Reviews)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /rbac/reviews/{id}:
 *   delete:
 *     summary: Eliminar reseña (Propietario o Admin)
 *     tags: [Admin-RBAC]
 */
router.delete(
  "/reviews/:id",
  middlewareAutenticacion,
  verificarPropietarioOPermiso(
    PERMISOS.BORRAR_REVIEWS_AJENAS,
    async (req: Request) => {
      const review = await prisma.reviews.findUnique({
        where: { id: Number(req.params.id) },
        select: { user_id: true },
      })
      return review?.user_id ?? null
    }
  ),
  manejadorAsincrono(deleteReviewAdmin)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN DE NOTICIAS
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /rbac/news:
 *   post:
 *     summary: Crear nueva noticia oficial
 *     tags: [Admin-RBAC]
 */
router.post(
  "/news",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_NOTICIAS),
  manejadorAsincrono(createNews)
)

/**
 * @swagger
 * /rbac/news/{id}:
 *   patch:
 *     summary: Editar noticia existente
 *     tags: [Admin-RBAC]
 *   delete:
 *     summary: Eliminar noticia
 *     tags: [Admin-RBAC]
 */
router.patch(
  "/news/:id",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_NOTICIAS),
  manejadorAsincrono(updateNews)
)

router.delete(
  "/news/:id",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_NOTICIAS),
  manejadorAsincrono(deleteNews)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN DE REPORTES
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /rbac/reports:
 *   get:
 *     summary: Listar reportes de la comunidad
 *     tags: [Admin-RBAC]
 */
router.get(
  "/reports",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_REPORTES),
  manejadorAsincrono(getReports)
)

/**
 * @swagger
 * /rbac/reports/{id}:
 *   patch:
 *     summary: Resolver o rechazar un reporte
 *     tags: [Admin-RBAC]
 */
router.patch(
  "/reports/:id",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_REPORTES),
  manejadorAsincrono(resolveReport)
)

/**
 * ---------------------------------------------------------------------------
 * ADMINISTRACIÓN DE USUARIOS
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /rbac/users/{id}/role:
 *   patch:
 *     summary: Cambiar el rango/rol de un usuario
 *     tags: [Admin-RBAC]
 */
router.patch(
  "/users/:id/role",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.CAMBIAR_ROL_USUARIOS),
  manejadorAsincrono(changeUserRole)
)

/**
 * @swagger
 * /rbac/users/activity:
 *   get:
 *     summary: Monitor de actividad global de usuarios
 *     tags: [Admin-RBAC]
 */
router.get(
  "/users/activity",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_ACTIVIDAD_USUARIOS),
  manejadorAsincrono(getUserActivityLog)
)

/**
 * ---------------------------------------------------------------------------
 * AUDITORÍA FINANCIERA
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /rbac/payments:
 *   get:
 *     summary: Listar transacciones de membresía
 *     tags: [Admin-RBAC]
 */
router.get(
  "/payments",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_PAGOS),
  manejadorAsincrono(getPaymentsLog)
)

export default router
