/**
 * @file UserRepository.ts
 * @description Repositorio maestro para la gestión de identidades y perfiles de usuario.
 * Centraliza la persistencia de credenciales, roles, membresías y estados de seguridad.
 * Implementa proyecciones seguras para garantizar que secretos críticos (como contraseñas
 * y semillas 2FA) nunca abandonen la capa de persistencia en consultas ordinarias,
 * salvaguardando la integridad de la base de usuarios.
 */

import { users, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

// --- Definiciones de Tipado de Seguridad ---

/**
 * Representación segurizada de la entidad de usuario.
 * Excluye explícitamente cualquier campo que pueda comprometer la cuenta si se expone.
 */
export type UserWithoutPassword = Omit<users, "password" | "two_factor_secret">

/** Alias para el contrato de creación de Prisma */
export type CreateUserInput = Prisma.usersCreateInput

/**
 * Interfaz IUserRepository
 * Define el contrato de servicios de datos para el motor de identidad.
 */
export interface IUserRepository {
  /** Localiza un usuario por su identificador primario */
  findById(id: number): Promise<users | null>
  /** Resuelve la identidad mediante el correo electrónico único */
  findByEmail(email: string): Promise<users | null>
  /** Localiza un perfil por su nombre de usuario único */
  findByUsername(username: string): Promise<users | null>
  /** Elimina un perfil y sus dependencias asociadas */
  deleteById(id: number): Promise<void>
  /** Persiste una nueva identidad en el sistema */
  create(data: CreateUserInput): Promise<users>
  /** Actualiza parcialmente los metadatos de un usuario */
  update(id: number, data: Partial<CreateUserInput>): Promise<users>
}

/**
 * Repositorio de Usuarios
 * Implementación centralizada sobre Prisma para la gestión de usuarios.
 */
export class UserRepository implements IUserRepository {
  /**
   * Recupera la entidad íntegra por ID (incluye credenciales para validación interna).
   */
  async findById(id: number): Promise<users | null> {
    return prisma.users.findUnique({ where: { id } })
  }

  /**
   * Resuelve la identidad por email. Utilizado principalmente en flujos de login.
   */
  async findByEmail(email: string): Promise<users | null> {
    return prisma.users.findUnique({ where: { email } })
  }

  /**
   * Localiza un perfil por username. Utilizado para resolución de perfiles sociales.
   */
  async findByUsername(username: string): Promise<users | null> {
    return prisma.users.findUnique({ where: { username } })
  }

  /**
   * Registra un nuevo hito de identidad en la plataforma.
   */
  async create(data: CreateUserInput): Promise<users> {
    return prisma.users.create({ data })
  }

  /**
   * Actualiza el estado de un usuario de forma parcial.
   */
  async update(id: number, data: Partial<CreateUserInput>): Promise<users> {
    return prisma.users.update({
      where: { id },
      data,
    })
  }

  /**
   * Genera una proyección segurizada para su transmisión a clientes o servicios externos.
   * Filtra campos de bajo nivel para cumplir con las políticas de privacidad y seguridad.
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
   * Recupera el catálogo global de usuarios para tareas administrativas.
   * Aplica una proyección limitada para optimizar el ancho de banda.
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
   * Ejecuta la eliminación física del registro de usuario.
   */
  async deleteById(id: number): Promise<void> {
    await prisma.users.delete({ where: { id } })
  }
}

/** Instancia única exportada del repositorio de identidad */
export const userRepository = new UserRepository()
