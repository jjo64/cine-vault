/**
 * @file rbac.routes.ts
 * @description Rutas de Administración y Control de Acceso Basado en Roles (RBAC).
 * Centraliza las operaciones privilegiadas como moderación de contenido, 
 * gestión de noticias, reportes y ajuste de roles de usuario.
 * 
 * @note Este archivo contiene actualmente lógica distribuida que será 
 * delegada a RbacController y RbacService en la Fase 5 para mayor cohesión.
 */

import { Request, Router } from "express"
import { PERMISOS } from "../config/permisos.js"
import { emitirNotificacion } from "../controllers/NotificationsController.js"
import { prisma } from "../lib/prisma.js"
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
 *     security:
 *       - bearerAuth: []
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
  manejadorAsincrono(async (req, res) => {
    await prisma.reviews.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: "Reseña eliminada correctamente" })
  })
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
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/news",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_NOTICIAS),
  manejadorAsincrono(async (req, res) => {
    const { title, content, category } = req.body
    const noticia = await prisma.news.create({
      data: { title, content, category },
    })
    res.status(201).json(noticia)
  })
)

/**
 * @swagger
 * /rbac/news/{id}:
 *   patch:
 *     summary: Editar noticia existente
 *     tags: [Admin-RBAC]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Eliminar noticia
 *     tags: [Admin-RBAC]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/news/:id",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_NOTICIAS),
  manejadorAsincrono(async (req, res) => {
    const noticia = await prisma.news.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    })
    res.json(noticia)
  })
)

router.delete(
  "/news/:id",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_NOTICIAS),
  manejadorAsincrono(async (req, res) => {
    await prisma.news.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: "Noticia eliminada correctamente" })
  })
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
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/reports",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_REPORTES),
  manejadorAsincrono(async (req, res) => {
    const reportes = await prisma.reports.findMany({
      include: { users: true, reviews: true },
      orderBy: { created_at: "desc" },
    })
    res.json(reportes)
  })
)

/**
 * @swagger
 * /rbac/reports/{id}:
 *   patch:
 *     summary: Resolver o rechazar un reporte
 *     tags: [Admin-RBAC]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/reports/:id",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_REPORTES),
  manejadorAsincrono(async (req, res) => {
    const { status } = req.body
    const reporte = await prisma.reports.update({
      where: { id: Number(req.params.id) },
      data: { status },
      include: { users: true },
    })

    if (status === "resolved" && reporte.reporter_id) {
      await emitirNotificacion({
        user_id: reporte.reporter_id,
        sender_id: req.user!.user_id,
        type: "report_resolved",
      })
    }

    res.json(reporte)
  })
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: ADMINISTRACIÓN DE USUARIOS
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /rbac/users/{id}/role:
 *   patch:
 *     summary: Cambiar el rango/rol de un usuario
 *     tags: [Admin-RBAC]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/users/:id/role",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.CAMBIAR_ROL_USUARIOS),
  manejadorAsincrono(async (req, res) => {
    const { role } = req.body
    const usuario = await prisma.users.update({
      where: { id: Number(req.params.id) },
      data: { role },
      select: { id: true, username: true, role: true },
    })
    res.json(usuario)
  })
)

/**
 * @swagger
 * /rbac/users/activity:
 *   get:
 *     summary: Monitor de actividad global de usuarios
 *     tags: [Admin-RBAC]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/users/activity",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_ACTIVIDAD_USUARIOS),
  manejadorAsincrono(async (req, res) => {
    const actividad = await prisma.user_activity.findMany({
      include: { users: { select: { id: true, username: true } } },
      orderBy: { created_at: "desc" },
      take: 100,
    })
    res.json(actividad)
  })
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: AUDITORÍA FINANCIERA
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /rbac/payments:
 *   get:
 *     summary: Listar transacciones de membresía
 *     tags: [Admin-RBAC]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/payments",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.VER_PAGOS),
  manejadorAsincrono(async (req, res) => {
    const pagos = await prisma.payments.findMany({
      include: { users: { select: { id: true, username: true, email: true } } },
      orderBy: { created_at: "desc" },
    })
    res.json(pagos)
  })
)

export default router
