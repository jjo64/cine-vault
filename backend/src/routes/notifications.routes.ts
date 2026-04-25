/**
 * @file notifications.routes.ts
 * @description Definición de rutas para el sistema de Notificaciones.
 * Permite gestionar el flujo de alertas sociales (likes, follows, comentarios)
 * y mantener al usuario actualizado sobre la actividad de su red.
 */

import { Router } from "express"
import {
  getNotifications,
  getPending,
  getUnreadCount,
  marcarComoLeida,
  marcarTodasComoLeidas,
} from "../controllers/NotificationsController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { validarParams } from "../middlewares/validation.middleware.js"
import { idParamSchema } from "../schemas/common.js"

/**
 * @swagger
 * tags:
 *   name: Notificaciones
 *   description: Gestión de alertas sociales en tiempo real
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: CONSULTA DE ALERTAS
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Obtener listado histórico de notificaciones
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", middlewareAutenticacion, manejadorAsincrono(getNotifications))

/**
 * @swagger
 * /notifications/unread:
 *   get:
 *     summary: Obtener contador de notificaciones pendientes de lectura
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/unread",
  middlewareAutenticacion,
  manejadorAsincrono(getUnreadCount)
)

/**
 * Recupera notificaciones críticas pendientes de procesamiento.
 */
router.get("/pending", middlewareAutenticacion, manejadorAsincrono(getPending))

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN DE ESTADOS (Lectura)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Marcar todo el historial como leído
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/read-all",
  middlewareAutenticacion,
  manejadorAsincrono(marcarTodasComoLeidas)
)

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Marcar una notificación específica como leída
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:id/read",
  middlewareAutenticacion,
  validarParams(idParamSchema),
  manejadorAsincrono(marcarComoLeida)
)

export default router
