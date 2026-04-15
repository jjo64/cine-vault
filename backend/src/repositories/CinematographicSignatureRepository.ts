import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import type { ActualizarFirmaDTO } from "../schemas/profile.js"

/* ==========================================================================
   CINEMATOGRAPHIC SIGNATURE REPOSITORY
   --------------------------------------------------------------------------
   Queries raw justificadas: MariaDB ON DUPLICATE KEY UPDATE no tiene
   equivalente en Prisma sin dos roundtrips. El SELECT es un JOIN futuro-proof.
   ========================================================================== */

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

export const cinematographicSignatureRepository = {
  async findByUserId(userId: number): Promise<FirmaRow> {
    const record = await prisma.cinematographic_signature.findUnique({
      where: { user_id: userId },
    })
    return record ?? FIRMA_VACIA(userId)
  },

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
