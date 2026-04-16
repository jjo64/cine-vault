/**
 * @file SettingsRepository.ts
 * @description Repositorio central para la gestión de preferencias y perfil de usuario. 
 * Encapsula las operaciones de actualización de identidad, biografía, credenciales (contraseñas) 
 * y activos visuales (avatares).
 */

import { users } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import type { ActualizarPerfilDTO } from "../schemas/settings.js"

// --- Interfaces de Contrato ---

/**
 * Interfaz ISettingsRepository
 * Define las operaciones de configuración de cuenta y perfil.
 */
export interface ISettingsRepository {
  findById(id: number): Promise<users | null>
  updateProfile(id: number, data: Partial<ActualizarPerfilDTO>): Promise<users>
  updatePassword(id: number, hashedPassword: string): Promise<void>
  updateAvatar(id: number, avatarUrl: string): Promise<void>
}

/**
 * Clase SettingsRepository
 * Implementa la persistencia para el módulo de ajustes de usuario.
 */
export class SettingsRepository implements ISettingsRepository {
  /**
   * Recupera el perfil completo del usuario por su ID.
   */
  async findById(id: number) {
    return prisma.users.findUnique({ where: { id } })
  }

  /**
   * Actualiza la información pública del perfil (nombre de usuario, email, biografía).
   */
  async updateProfile(id: number, data: Partial<ActualizarPerfilDTO>) {
    return prisma.users.update({
      where: { id },
      data: {
        ...(data.username && { username: data.username }),
        ...(data.email && { email: data.email }),
        ...(data.bio !== undefined && { bio: data.bio }),
      },
    })
  }

  /**
   * Actualiza la contraseña hasheada del usuario.
   */
  async updatePassword(id: number, hashedPassword: string) {
    await prisma.users.update({
      where: { id },
      data: { password: hashedPassword },
    })
  }

  /**
   * Actualiza la URL del avatar del usuario.
   */
  async updateAvatar(id: number, avatarUrl: string) {
    await prisma.users.update({
      where: { id },
      data: { avatar_url: avatarUrl },
    })
  }
}

export const settingsRepository = new SettingsRepository()
