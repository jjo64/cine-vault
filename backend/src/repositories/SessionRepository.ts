/**
 * @file SessionRepository.ts
 * @description Repositorio para la gestión de sesiones de usuario persistentes. 
 * Implementa el control de dispositivos conectados, validación de hashes de sesión 
 * y mecanismos de cierre de sesión remoto (único o masivo).
 */

import { sessions, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

// --- Interfaces de Contrato ---

/**
 * Interfaz ISessionRepository
 * Define las operaciones críticas para la seguridad de sesión.
 */
export interface ISessionRepository {
  create(data: Prisma.sessionsCreateInput): Promise<sessions>
  findByHashAndId(id: string, tokenHash: string): Promise<sessions | null>
  deleteById(id: string): Promise<void>
  deleteManyByUser(userId: number): Promise<number>
  deleteManyByUserExcept(userId: number, keepSessionId: string): Promise<number>
  findByUser(
    userId: number
  ): Promise<
    Pick<
      sessions,
      "id" | "user_agent" | "ip_address" | "created_at" | "expires_at"
    >[]
  >
  findById(id: string): Promise<sessions | null>
}

/**
 * Clase SessionRepository
 * Gestiona el ciclo de vida de las sesiones en la base de datos.
 */
export class SessionRepository implements ISessionRepository {
  /**
   * Registra una nueva sesión vinculada a un usuario, agente de usuario e IP.
   */
  async create(data: Prisma.sessionsCreateInput): Promise<sessions> {
    return prisma.sessions.create({ data })
  }

  /**
   * Verifica la validez de una sesión comparando el ID y el hash del token.
   * Punto crítico para la seguridad de autenticación.
   */
  async findByHashAndId(
    id: string,
    tokenHash: string
  ): Promise<sessions | null> {
    return prisma.sessions.findFirst({ where: { id, token_hash: tokenHash } })
  }

  /**
   * Elimina una sesión específica.
   */
  async deleteById(id: string): Promise<void> {
    await prisma.sessions.delete({ where: { id } }).catch(() => null)
  }

  /**
   * Cierra todas las sesiones abiertas de un usuario (ej. tras cambio de contraseña).
   * @returns El número de sesiones eliminadas.
   */
  async deleteManyByUser(userId: number): Promise<number> {
    const result = await prisma.sessions.deleteMany({
      where: { user_id: userId },
    })
    return result.count
  }

  /**
   * Cierra todas las sesiones de un usuario excepto la sesión actual indicada.
   */
  async deleteManyByUserExcept(
    userId: number,
    keepSessionId: string
  ): Promise<number> {
    const result = await prisma.sessions.deleteMany({
      where: { user_id: userId, NOT: { id: keepSessionId } },
    })
    return result.count
  }

  /**
   * Lista las sesiones activas de un usuario para la gestión de dispositivos.
   */
  async findByUser(userId: number) {
    return prisma.sessions.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        user_agent: true,
        ip_address: true,
        created_at: true,
        expires_at: true,
      },
      orderBy: { created_at: "desc" },
    })
  }

  /**
   * Recupera una sesión por su ID único.
   */
  async findById(id: string): Promise<sessions | null> {
    return prisma.sessions.findUnique({ where: { id } })
  }
}

export const sessionRepository = new SessionRepository()
