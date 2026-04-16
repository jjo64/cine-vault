/**
 * @file NotificationsRepository.ts
 * @description Repositorio para la gestión de notificaciones persistentes en el sistema.
 * Registra eventos como likes, nuevos seguidores o menciones, permitiendo el control 
 * de lectura por parte del usuario.
 */

import { notifications, notifications_type } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

/**
 * Interfaz INotificacionesRepository
 * Define el contrato de persistencia para el sistema de alertas del usuario.
 */
export interface INotificationsRepository {
  /**
   * Registra una nueva notificación en la base de datos.
   */
  create(data: {
    user_id: number
    sender_id: number
    type: notifications_type
  }): Promise<notifications>

  /**
   * Obtiene la cronología de notificaciones de un usuario.
   * @param userId - Usuario destino de las alertas.
   * @param limit - Cantidad máxima de registros a recuperar (default 50).
   */
  findByUserId(userId: number, limit?: number): Promise<notifications[]>

  /**
   * Recupera una notificación por su ID.
   */
  findById(id: number): Promise<notifications | null>

  /**
   * Marca una alerta específica como leída (valida propiedad).
   */
  markAsRead(id: number, userId: number): Promise<notifications | null>

  /**
   * Marca todas las alertas pendientes de un usuario como leídas.
   */
  markAllAsRead(userId: number): Promise<number>
}

/**
 * Clase NotificationsRepository
 * Implementa las operaciones de persistencia para notificaciones usando Prisma.
 */
export class NotificationsRepository implements INotificationsRepository {
  /**
   * Crea la notificación incluyendo metadatos del emisor (sender).
   */
  async create(data: {
    user_id: number
    sender_id: number
    type: notifications_type
  }) {
    return prisma.notifications.create({
      data,
      include: {
        sender: {
          select: { id: true, username: true, avatar_url: true },
        },
      },
    })
  }

  /**
   * Lista las notificaciones más recientes del usuario.
   */
  async findByUserId(userId: number, limit = 50) {
    return prisma.notifications.findMany({
      where: { user_id: userId },
      include: {
        sender: {
          select: { id: true, username: true, avatar_url: true },
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    })
  }

  /**
   * Localiza una notificación por su identificador primario.
   */
  async findById(id: number) {
    return prisma.notifications.findUnique({ where: { id } })
  }

  /**
   * Actualiza el estado de lectura de una única notificación.
   */
  async markAsRead(id: number, userId: number) {
    return prisma.notifications.update({
      where: { id, user_id: userId },
      data: { read: true },
    })
  }

  /**
   * Realiza una actualización masiva del estado de lectura para un usuario.
   */
  async markAllAsRead(userId: number) {
    const result = await prisma.notifications.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    })
    return result.count
  }
}

export const notificationsRepository = new NotificationsRepository()
