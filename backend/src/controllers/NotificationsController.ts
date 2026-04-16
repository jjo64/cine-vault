/**
 * @file NotificationsController.ts
 * @description Controlador para el sistema de alertas y notificaciones en tiempo real.
 * Gestiona la entrega de notificaciones pendientes, el conteo de elementos no leídos 
 * y la actualización de estados de lectura para el usuario autenticado.
 */

import { Request, Response } from "express"
/** Re-exportación para compatibilidad con módulos existentes */
export { emitirNotificacionService as emitirNotificacion } from "../services/notifications.services.js"
import * as notifService from "../services/notifications.services.js"

/**
 * Recupera el historial de notificaciones del usuario autenticado.
 */
export const getNotifications = async (req: Request, res: Response) => {
  const notificaciones = await notifService.obtenerNotificacionesService(
    req.user!.user_id
  )
  res.json(notificaciones)
}

/**
 * Marca una notificación específica como leída.
 */
export const marcarComoLeida = async (req: Request, res: Response) => {
  await notifService.marcarComoLeidaService(
    req.user!.user_id,
    Number(req.params.id)
  )
  res.json({ message: "Notificación actualizada correctamente" })
}

/**
 * Marca todas las notificaciones pendientes del usuario como leídas.
 */
export const marcarTodasComoLeidas = async (req: Request, res: Response) => {
  await notifService.marcarTodasComoLeidasService(req.user!.user_id)
  res.json({ message: "Todas las notificaciones han sido marcadas como leídas" })
}

/**
 * Obtiene el número total de notificaciones pendientes de lectura.
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  const count = await notifService.contarNoLeidasService(req.user!.user_id)
  res.json({ count })
}

/**
 * Recupera las notificaciones pendientes de entrega (polling fallback).
 */
export const getPending = async (req: Request, res: Response) => {
  const pendientes = await notifService.entregarPendientesService(
    req.user!.user_id
  )
  res.json({ pending: pendientes })
}
