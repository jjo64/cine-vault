/**
 * @file AuthTokenRepository.ts
 * @description Repositorio para la gestión de tokens de autenticación y verificación (email, reset password).
 * Implementa una interfaz para facilitar el testing y desacoplamiento.
 */

import { auth_tokens, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

export interface IAuthTokenRepository {
  create(data: Prisma.auth_tokensCreateInput): Promise<auth_tokens>
  findFirst(where: Prisma.auth_tokensWhereInput): Promise<auth_tokens | null>
  deleteMany(where: Prisma.auth_tokensWhereInput): Promise<number>
}

/**
 * Clase AuthTokenRepository
 * Encapsula el acceso a la tabla auth_tokens de Prisma.
 */
export class AuthTokenRepository implements IAuthTokenRepository {
  /**
   * Crea un nuevo registro de token asociado a un usuario.
   */
  async create(data: Prisma.auth_tokensCreateInput): Promise<auth_tokens> {
    return prisma.auth_tokens.create({ data })
  }

  /**
   * Busca el primer token que coincida con los criterios (ej: token y tipo).
   */
  async findFirst(
    where: Prisma.auth_tokensWhereInput
  ): Promise<auth_tokens | null> {
    return prisma.auth_tokens.findFirst({ where })
  }

  /**
   * Elimina múltiples tokens (limpieza o invalidación).
   */
  async deleteMany(where: Prisma.auth_tokensWhereInput): Promise<number> {
    const result = await prisma.auth_tokens.deleteMany({ where })
    return result.count
  }
}

export const authTokenRepository = new AuthTokenRepository()
