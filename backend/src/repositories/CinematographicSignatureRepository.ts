/**
 * @file CinematographicSignatureRepository.ts
 * @description Repositorio encargado de gestionar la "Firma Cinematográfica" (Identidad Cinéfila).
 * Persiste los pilares narrativos que definen el gusto del usuario: películas clave,
 * directores fundamentales, escenas inolvidables y momentos de inflexión.
 * Implementa una lógica de actualización atómica (Upsert) para sincronizar el perfil.
 */

import { prisma } from "../lib/prisma.js"
import type { ActualizarFirmaDTO } from "../schemas/profile.js"

/**
 * Estructura de datos que representa la identidad cinematográfica en la base de datos.
 * Cada campo se compone de un título/nombre y un detalle explicativo.
 */
export interface FirmaRow {
  /** Relación 1:1 con el usuario */
  user_id: number
  /** La película que marcó un antes y un después */
  pivotal_film: string | null
  pivotal_film_detail: string | null
  /** El director o directora que formó su visión del cine */
  formative_director: string | null
  formative_director_detail: string | null
  /** Fragmento visual o diálogo que permanece en la memoria */
  unforgettable_scene: string | null
  unforgettable_scene_detail: string | null
  /** Época o evento que despertó su pasión por el séptimo arte */
  cinema_turning_year: string | null
  cinema_turning_year_detail: string | null
  created_at?: Date | null
  updated_at?: Date | null
}

/**
 * Fábrica de firmas neutrales.
 * Se utiliza para inicializar perfiles que aún no han definido su identidad.
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
 * Repositorio de Firma Cinematográfica
 * Provee la interfaz de persistencia para la capa de perfiles sociales.
 */
export const cinematographicSignatureRepository = {
  /**
   * Recupera la firma de identidad vinculada a una cuenta.
   * Si el usuario no ha completado su firma, devuelve una estructura con valores nulos
   * para mantener la consistencia en el frontend.
   *
   * @param userId - ID único del usuario.
   */
  async findByUserId(userId: number): Promise<FirmaRow> {
    const record = await prisma.cinematographic_signature.findUnique({
      where: { user_id: userId },
    })
    return record ?? FIRMA_VACIA(userId)
  },

  /**
   * Persiste o actualiza la configuración de identidad cinematográfica.
   *
   * @param userId - Propietario de la firma.
   * @param data - DTO con los campos validados de la firma.
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
