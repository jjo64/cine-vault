/**
 * @file CinematographicSignatureRepository.ts
 * @description Repositorio para la gestión de la "Firma Cinematográfica" del usuario (películas clave, directores formativos, etc.).
 * Utiliza operaciones de upsert para mantener la integridad del perfil único por usuario.
 */

import { prisma } from "../lib/prisma.js"
import type { ActualizarFirmaDTO } from "../schemas/profile.js"

/**
 * Estructura de datos que representa una fila de la firma cinematográfica.
 */
export interface FirmaRow {
  user_id: number
  pivotal_film: string | null
  pivotal_film_detail: string | null
  formative_director: string | null
  formative_director_detail: string | null
  unforgettable_scene: string | null
  unforgettable_scene_detail: string | null
  cinema_turning_year: string | null
  cinema_turning_year_detail: string | null
  created_at?: Date | null
  updated_at?: Date | null
}

/**
 * Helper para generar un objeto de firma vacío (valores nulos) para nuevos perfiles.
 */
const FIRMA_VACIA = (userId: number): FirmaRow => ({
  user_id: userId,
  pivotal_film: null,
  pivotal_film_detail: null,
  formative_director: null,
  formative_director_detail: null,
  unforgettable_scene: null,
  unforgettable_scene_detail: null,
  cinema_turning_year: null,
  cinema_turning_year_detail: null,
})

/**
 * Objeto cinematographicSignatureRepository
 * Provee métodos para leer y actualizar la firma de identidad del usuario.
 */
export const cinematographicSignatureRepository = {
  /**
   * Obtiene la firma de un usuario por su ID. Si no existe, devuelve una estructura vacía.
   */
  async findByUserId(userId: number): Promise<FirmaRow> {
    const record = await prisma.cinematographic_signature.findUnique({
      where: { user_id: userId },
    })
    return record ?? FIRMA_VACIA(userId)
  },

  /**
   * Crea o actualiza la firma del usuario (Upsert).
   * @param userId - ID del usuario propietario.
   * @param data - Datos de la firma provenientes del DTO.
   */
  async upsert(userId: number, data: ActualizarFirmaDTO): Promise<void> {
    await prisma.cinematographic_signature.upsert({
      where: { user_id: userId },
      update: {
        pivotal_film: data.pivotal_film ?? null,
        pivotal_film_detail: data.pivotal_film_detail ?? null,
        formative_director: data.formative_director ?? null,
        formative_director_detail: data.formative_director_detail ?? null,
        unforgettable_scene: data.unforgettable_scene ?? null,
        unforgettable_scene_detail: data.unforgettable_scene_detail ?? null,
        cinema_turning_year: data.cinema_turning_year ?? null,
        cinema_turning_year_detail: data.cinema_turning_year_detail ?? null,
      },
      create: {
        user_id: userId,
        pivotal_film: data.pivotal_film ?? null,
        pivotal_film_detail: data.pivotal_film_detail ?? null,
        formative_director: data.formative_director ?? null,
        formative_director_detail: data.formative_director_detail ?? null,
        unforgettable_scene: data.unforgettable_scene ?? null,
        unforgettable_scene_detail: data.unforgettable_scene_detail ?? null,
        cinema_turning_year: data.cinema_turning_year ?? null,
        cinema_turning_year_detail: data.cinema_turning_year_detail ?? null,
      },
    })
  },
}
