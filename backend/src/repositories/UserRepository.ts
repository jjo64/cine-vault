/**
 * @file UserRepository.ts
 * @description Repositorio central para la gestión de identidades de usuario.
 * Maneja la persistencia de perfiles, credenciales, roles y estados de verificación, 
 * asegurando la segregación de datos sensibles (como contraseñas) mediante proyecciones seguras.
 */

import { users, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

// --- Tipos de Utilidad ---

/**
 * Representa un usuario excluyendo campos críticos de seguridad (contraseñas y secretos 2FA).
 */
export type UserWithoutPassword = Omit<users, "password" | "two_factor_secret">

/**
 * Tipo base para la creación de nuevos usuarios según el esquema de Prisma.
 */
export type CreateUserInput = Prisma.usersCreateInput

/**
 * Interfaz IUserRepository
 * Define el contrato de acceso a datos para la gestión de usuarios.
 */
export interface IUserRepository {
  findById(id: number): Promise<users | null>
  findByEmail(email: string): Promise<users | null>
  findByUsername(username: string): Promise<users | null>
  deleteById(id: number): Promise<void>
  create(data: CreateUserInput): Promise<users>
  update(id: number, data: Partial<CreateUserInput>): Promise<users>
}

/**
 * Clase UserRepository
 * Implementación de la persistencia de usuarios siguiendo el patrón Singleton.
 */
export class UserRepository implements IUserRepository {
  /**
   * Busca un usuario por su clave primaria.
   */
  async findById(id: number): Promise<users | null> {
    return prisma.users.findUnique({ where: { id } })
  }

  /**
   * Localiza un usuario por su dirección de correo electrónico única.
   */
  async findByEmail(email: string): Promise<users | null> {
    return prisma.users.findUnique({ where: { email } })
  }

  /**
   * Localiza un usuario por su nombre de usuario único.
   */
  async findByUsername(username: string): Promise<users | null> {
    return prisma.users.findUnique({ where: { username } })
  }

  /**
   * Registra un nuevo perfil de usuario en el sistema.
   */
  async create(data: CreateUserInput): Promise<users> {
    return prisma.users.create({ data })
  }

  /**
   * Actualiza parcialmente la información de un perfil existente.
   */
  async update(id: number, data: Partial<CreateUserInput>): Promise<users> {
    return prisma.users.update({
      where: { id },
      data,
    })
  }

  /**
   * Obtiene un perfil segurizado (sin contraseñas) para su exposición en el frontend.
   */
  async getSafeProfile(id: number): Promise<UserWithoutPassword | null> {
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        membership: true,
        avatar_url: true,
        two_factor_enabled: true,
        is_verified: true,
      },
    })
    return user as UserWithoutPassword | null
  }

  /**
   * Lista todos los usuarios del sistema (proyección limitada de campos).
   */
  async findAll(): Promise<UserWithoutPassword[]> {
    return prisma.users.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar_url: true,
      },
    }) as Promise<UserWithoutPassword[]>
  }

  /**
   * Elimina un usuario por su ID de forma permanente.
   */
  async deleteById(id: number): Promise<void> {
    await prisma.users.delete({ where: { id } })
  }
}

export const userRepository = new UserRepository()
