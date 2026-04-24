/**
 * @file NotificationsRepository.ts
 * @description Repositorio encargado de la persistencia y gestión de alertas del sistema.
 * Registra y administra las notificaciones generadas por interacciones sociales 
 * (likes en reseñas, nuevos seguidores, menciones) y eventos de moderación, 
 * facilitando un historial cronológico y control de lectura para el usuario.
 */

import { notifications, notifications_type } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

/** 
 * Contrato de persistencia para el sistema de notificaciones.
 * Define las operaciones necesarias para el flujo de alertas desde su creación 
 * hasta su consumo por el usuario final.
 */
export interface INotificationsRepository {
  /**
   * Persiste una nueva alerta en el historial del usuario.
   * Incluye la asociación con el emisor del evento.
   */
  create(data: {
    user_id: number
    sender_id: number | null
    type: notifications_type
    metadata?: any
  }): Promise<notifications>

  /**
   * Recupera la cronología de alertas para la vista del centro de notificaciones.
   * 
   * @param userId - Destatario de las notificaciones.
   * @param limit - Umbral máximo de registros (Optimización de carga).
   */
  findByUserId(userId: number, limit?: number): Promise<notifications[]>

  /** Localiza una alerta única por su identificador primario */
  findById(id: number): Promise<notifications | null>

  /** Modifica el estado de una alerta a "leída" */
  markAsRead(id: number, userId: number): Promise<notifications | null>

  /** Realiza una transición de estado masiva (Clear all notifications) */
  markAllAsRead(userId: number): Promise<number>
}

/**
 * Repositorio de Notificaciones
 * Implementación basada en Prisma para el motor de alertas.
 */
export class NotificationsRepository implements INotificationsRepository {
  /**
   * Crea un registro de notificación enriquecido con metadatos del emisor.
   */
  async create(data: {
    user_id: number
    sender_id: number | null
    type: notifications_type
    metadata?: any
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
   * Lista las notificaciones más recientes, hidratadas con datos de identidad.
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
   * Recupera un registro único para auditoría o validaciones previas.
   */
  async findById(id: number) {
    return prisma.notifications.findUnique({ where: { id } })
  }

  /**
   * Actualiza el flag de lectura para una notificación específica.
   * Valida estrictamente la propiedad 'user_id' para prevenir manipulaciones cruzadas.
   */
  async markAsRead(id: number, userId: number) {
    return prisma.notifications.update({
      where: { id, user_id: userId },
      data: { read: true },
    })
  }

  /**
   * Ejecuta una operación de actualización masiva sobre todas las alertas 
   * pendientes del usuario.
   * 
   * @returns El número de notificaciones que han pasado a estado leído.
   */
  async markAllAsRead(userId: number) {
    const result = await prisma.notifications.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    })
    return result.count
  }
}

/** Instancia única de acceso al repositorio de alertas */
export const notificationsRepository = new NotificationsRepository()
