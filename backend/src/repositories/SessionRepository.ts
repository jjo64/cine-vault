/**
 * @file SessionRepository.ts
 * @description Repositorio encargado de la gestión de persistencia de sesiones activas.
 * Implementa el control de acceso basado en dispositivos, permitiendo la monitorización 
 * de metadatos (User Agent, IP) y la invalidación granular o masiva de tokens. 
 * Es el núcleo de la seguridad de sesiones persistentes en la plataforma.
 */

import { sessions, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

// --- Definición de Contrato de Seguridad ---

/**
 * Interfaz ISessionRepository
 * Define las operaciones críticas para salvaguardar la identidad del usuario.
 */
export interface ISessionRepository {
  /** Registra una nueva sesión tras una autenticación exitosa */
  create(data: Prisma.sessionsCreateInput): Promise<sessions>
  /** Valida la integridad de una sesión mediante su ID y el hash del secreto */
  findByHashAndId(id: string, tokenHash: string): Promise<sessions | null>
  /** Elimina una sesión específica (Logout) */
  deleteById(id: string): Promise<void>
  /** Invalida todas las sesiones de un usuario (Emergencia/Cambio Password) */
  deleteManyByUser(userId: number): Promise<number>
  /** Invalida sesiones en otros dispositivos manteniendo la actual */
  deleteManyByUserExcept(userId: number, keepSessionId: string): Promise<number>
  /** Lista el parque de dispositivos conectados para auditoría del usuario */
  findByUser(
    userId: number
  ): Promise<
    Pick<
      sessions,
      "id" | "user_agent" | "ip_address" | "created_at" | "expires_at"
    >[]
  >
  /** Localiza metadatos de una sesión por ID */
  findById(id: string): Promise<sessions | null>
}

/**
 * Repositorio de Sesiones
 * Implementación robusta sobre Prisma para el ciclo de vida de tokens de acceso.
 */
export class SessionRepository implements ISessionRepository {
  /**
   * Persiste una nueva sesión con metadatos de dispositivo.
   */
  async create(data: Prisma.sessionsCreateInput): Promise<sessions> {
    return prisma.sessions.create({ data })
  }

  /**
   * Punto de verificación de seguridad.
   * Compara el identificador de sesión con el hash del token persistido.
   * 
   * @param id - UUID de la sesión extraído del token o cookie.
   * @param tokenHash - Hash criptográfico del token secreto.
   */
  async findByHashAndId(
    id: string,
    tokenHash: string
  ): Promise<sessions | null> {
    return prisma.sessions.findFirst({ where: { id, token_hash: tokenHash } })
  }

  /**
   * Finaliza una sesión individual.
   */
  async deleteById(id: string): Promise<void> {
    await prisma.sessions.delete({ where: { id } }).catch(() => null)
  }

  /**
   * Realiza una purga completa de sesiones para un usuario.
   * Método fundamental para la seguridad proactiva tras eventos de riesgo.
   */
  async deleteManyByUser(userId: number): Promise<number> {
    const result = await prisma.sessions.deleteMany({
      where: { user_id: userId },
    })
    return result.count
  }

  /**
   * Permite al usuario cerrar sesión en todos sus dispositivos menos en el actual.
   * Útil para limpieza de dispositivos antiguos o desconocidos.
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
   * Recupera el historial de conexiones activas.
   * Proyecta campos limitados para evitar la exposición de secretos técnicos (hashes).
   */
  async findByUser(userId: number) {
    return prisma.sessions.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        /** Identificación del navegador/dispositivo */
        user_agent: true,
        /** Origen geográfico de la conexión */
        ip_address: true,
        created_at: true,
        expires_at: true,
      },
      orderBy: { created_at: "desc" },
    })
  }

  /**
   * Localiza una sesión por su identificador primario.
   */
  async findById(id: string): Promise<sessions | null> {
    return prisma.sessions.findUnique({ where: { id } })
  }
}

/** Instancia maestra del repositorio de sesiones */
export const sessionRepository = new SessionRepository()
