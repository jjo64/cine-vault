/**
 * @file AuthTokenRepository.ts
 * @description Repositorio especializado en la gestión de secretos temporales y tokens de flujo.
 * Centraliza la persistencia de tokens para verificación de correo electrónico, 
 * restablecimiento de contraseñas y otros mecanismos de seguridad temporal.
 * Implementa una interfaz contractual para facilitar el desacoplamiento y el testing unitario.
 */

import { auth_tokens, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

/** Contrato para el repositorio de tokens de autenticación */
export interface IAuthTokenRepository {
  /** Registra un nuevo token asociado a una identidad de usuario */
  create(data: Prisma.auth_tokensCreateInput): Promise<auth_tokens>
  /** Localiza el primer registro que cumpla con los criterios de seguridad */
  findFirst(where: Prisma.auth_tokensWhereInput): Promise<auth_tokens | null>
  /** Realiza limpiezas masivas o invalidaciones de secretos */
  deleteMany(where: Prisma.auth_tokensWhereInput): Promise<number>
}

/**
 * Repositorio de Tokens de Autenticación
 * Encapsula el acceso de bajo nivel a la tabla auth_tokens.
 */
export class AuthTokenRepository implements IAuthTokenRepository {
  /**
   * Persiste un nuevo token de flujo (ej: código de registro).
   * 
   * @param data - Configuración del token y relación con el usuario.
   * @returns El registro del token creado.
   */
  async create(data: Prisma.auth_tokensCreateInput): Promise<auth_tokens> {
    return prisma.auth_tokens.create({ data })
  }

  /**
   * Busca un token específico basado en filtros complejos (token, tipo, exp.).
   * 
   * @param where - Filtros de búsqueda (Prisma Where Input).
   * @returns El token localizado o null si no se encuentra.
   */
  async findFirst(
    where: Prisma.auth_tokensWhereInput
  ): Promise<auth_tokens | null> {
    return prisma.auth_tokens.findFirst({ where })
  }

  /**
   * Elimina registros de tokens. 
   * Útil para invalidar sesiones previas tras un cambio de password exitoso.
   * 
   * @param where - Criterios de eliminación.
   * @returns Cantidad de registros afectados.
   */
  async deleteMany(where: Prisma.auth_tokensWhereInput): Promise<number> {
    const result = await prisma.auth_tokens.deleteMany({ where })
    return result.count
  }
}

/** Instancia exportada para su inyección en servicios */
export const authTokenRepository = new AuthTokenRepository()
