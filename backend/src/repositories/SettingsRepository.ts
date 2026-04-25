/**
 * @file SettingsRepository.ts
 * @description Repositorio encargado de la gestión de la configuración personal y seguridad de la cuenta.
 * Centraliza las operaciones de edición de perfil, actualización de biografía, 
 * sincronización de credenciales de acceso y gestión de identificadores visuales (Avatares).
 * Es el punto de entrada para la personalización de la experiencia del usuario en CineVault.
 */

import { users } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import type { ActualizarPerfilDTO } from "../schemas/settings.js"

// --- Definición de Contrato de Configuración ---

/**
 * Interfaz ISettingsRepository
 * Define las operaciones permitidas para la modificación de la identidad del usuario.
 */
export interface ISettingsRepository {
  /** Localiza la entidad completa del usuario para procesos de edición */
  findById(id: number): Promise<users | null>
  /** Persiste cambios en la información pública del perfil */
  updateProfile(id: number, data: Partial<ActualizarPerfilDTO>): Promise<users>
  /** Actualiza la credencial de acceso (Hash de contraseña) */
  updatePassword(id: number, hashedPassword: string): Promise<void>
  /** Actualiza el recurso gráfico vinculado al usuario */
  updateAvatar(id: number, avatarUrl: string): Promise<void>
}

/**
 * Repositorio de Ajustes
 * Implementación sobre Prisma para la gestión del estado de cuenta del usuario.
 */
export class SettingsRepository implements ISettingsRepository {
  /**
   * Recupera el estado íntegro del usuario.
   */
  async findById(id: number) {
    return prisma.users.findUnique({ where: { id } })
  }

  /**
   * Realiza una actualización parcial de los datos de identidad.
   * Valida la presencia de campos antes de la persistencia para evitar sobreescrituras nulas.
   * 
   * @param id - Identificador del usuario.
   * @param data - Fragmento DTO con los campos a actualizar (username, email, bio).
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
   * Persiste una nueva contraseña en el sistema.
   * 
   * @param id - Usuario destino.
   * @param hashedPassword - Secreto ya procesado por el motor de hashing de la aplicación.
   */
  async updatePassword(id: number, hashedPassword: string) {
    await prisma.users.update({
      where: { id },
      data: { password: hashedPassword },
    })
  }

  /**
   * Actualiza la referencia al avatar del usuario.
   * 
   * @param id - Usuario destino.
   * @param avatarUrl - Dirección absoluta o relativa del nuevo recurso de imagen.
   */
  async updateAvatar(id: number, avatarUrl: string) {
    await prisma.users.update({
      where: { id },
      data: { avatar_url: avatarUrl },
    })
  }
}

/** Instancia maestra para la gestión de preferencias de usuario */
export const settingsRepository = new SettingsRepository()
