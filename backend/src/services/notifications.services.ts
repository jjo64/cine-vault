/**
 * @file notifications.services.ts
 * @description Capa de servicios para el sistema de notificaciones en tiempo real de CineVault.
 * Gestiona la persistencia en base de datos, la emisión vía WebSockets (Socket.IO) 
 * y el encolado en Redis para entrega de notificaciones pendientes (offline).
 */

import type { notifications_type } from "@prisma/client"
import { io, usuariosConectados } from "../config/socketio.config.js"
import { redis } from "../lib/redis.js"
import { notificationsRepository } from "../repositories/NotificationsRepository.js"

// --- Constantes de Infraestructura ---

const queueKey = (userId: number) => `notif:queue:${userId}`

// --- Servicios de Emisión y Entrega ---

/**
 * Crea una notificación y orquestas su entrega inmediata o diferida.
 * Intenta emitir por Socket.IO; si el usuario no tiene conexión activa, 
 * encola la notificación en Redis para su posterior entrega.
 * 
 * @param params Objeto con el destinatario, remitente y tipo de notificación.
 * @returns La instancia de notificación creada y persistida.
 */
export const emitirNotificacionService = async ({
  user_id,
  sender_id,
  type,
  metadata,
}: {
  user_id: number
  sender_id: number | null
  type: notifications_type
  metadata?: any
}) => {
  const notificacion = await notificationsRepository.create({
    user_id,
    sender_id,
    type,
    metadata,
  })

  const socketId = usuariosConectados.get(user_id)
  
  if (socketId) {
    // Entrega inmediata por WebSockets
    io.to(socketId).emit("nueva_notificacion", notificacion)
  } else {
    // Almacenamiento temporal en Redis para entrega "push" al reconectar
    await redis.lpush(queueKey(user_id), JSON.stringify(notificacion))
    await redis.ltrim(queueKey(user_id), 0, 49) // Limitar a las últimas 50 notificaciones offline
  }

  return notificacion
}

/**
 * Recupera las notificaciones pendientes de entrega (offline) desde la cola de Redis.
 * Una vez entregadas, se eliminan de la cola temporal.
 */
export const entregarPendientesService = async (userId: number) => {
  const key = queueKey(userId)
  const pendientes = await redis.lrange(key, 0, -1)
  if (pendientes.length === 0) return []

  await redis.del(key)

  const parsed = pendientes.map((raw) => {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })

  return parsed.filter(Boolean)
}

// --- Servicios de Gestión de Estado ---

/**
 * Obtiene el historial de notificaciones persistidas de un usuario.
 */
export const obtenerNotificacionesService = (userId: number) =>
  notificationsRepository.findByUserId(userId)

/**
 * Marca una notificación específica como leída, validando la propiedad del usuario.
 */
export const marcarComoLeidaService = async (
  userId: number,
  notifId: number
) => {
  const notificacion = await notificationsRepository.markAsRead(notifId, userId)
  return notificacion
}

/**
 * Realiza una marca masiva de lectura para todas las notificaciones de un usuario.
 */
export const marcarTodasComoLeidasService = (userId: number) =>
  notificationsRepository.markAllAsRead(userId)

/**
 * Calcula el recuento total de notificaciones no leídas para indicadores de UI (badges).
 */
export const contarNoLeidasService = (userId: number) =>
  notificationsRepository
    .findByUserId(userId, 1000)
    .then((notifs) => notifs.filter((n) => !n.read).length)
