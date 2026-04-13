import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import type { ActualizarFirmaDTO } from "../schemas/profile.js"

/* ==========================================================================
   CINEMATOGRAPHIC SIGNATURE REPOSITORY
   --------------------------------------------------------------------------
   Queries raw justificadas: MariaDB ON DUPLICATE KEY UPDATE no tiene
   equivalente en Prisma sin dos roundtrips. El SELECT es un JOIN futuro-proof.
   ========================================================================== */

type FirmaRow = Record<string, string | number | null>

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
    const rows = await prisma.$queryRaw<FirmaRow[]>(Prisma.sql`
      SELECT
        user_id,
        pivotal_film,
        pivotal_film_detail,
        formative_director,
        formative_director_detail,
        unforgettable_scene,
        unforgettable_scene_detail,
        cinema_turning_year,
        cinema_turning_year_detail
      FROM cinematographic_signature
      WHERE user_id = ${userId}
      LIMIT 1
    `)
    return rows[0] ?? FIRMA_VACIA(userId)
  },

  async upsert(userId: number, data: ActualizarFirmaDTO): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO cinematographic_signature (
        user_id,
        pivotal_film, pivotal_film_detail,
        formative_director, formative_director_detail,
        unforgettable_scene, unforgettable_scene_detail,
        cinema_turning_year, cinema_turning_year_detail
      ) VALUES (
        ${userId},
        ${data.pivotal_film ?? null}, ${data.pivotal_film_detail ?? null},
        ${data.formative_director ?? null}, ${data.formative_director_detail ?? null},
        ${data.unforgettable_scene ?? null}, ${data.unforgettable_scene_detail ?? null},
        ${data.cinema_turning_year ?? null}, ${data.cinema_turning_year_detail ?? null}
      )
      ON DUPLICATE KEY UPDATE
        pivotal_film            = COALESCE(${data.pivotal_film ?? null}, pivotal_film),
        pivotal_film_detail     = COALESCE(${data.pivotal_film_detail ?? null}, pivotal_film_detail),
        formative_director      = COALESCE(${data.formative_director ?? null}, formative_director),
        formative_director_detail = COALESCE(${data.formative_director_detail ?? null}, formative_director_detail),
        unforgettable_scene     = COALESCE(${data.unforgettable_scene ?? null}, unforgettable_scene),
        unforgettable_scene_detail = COALESCE(${data.unforgettable_scene_detail ?? null}, unforgettable_scene_detail),
        cinema_turning_year     = COALESCE(${data.cinema_turning_year ?? null}, cinema_turning_year),
        cinema_turning_year_detail = COALESCE(${data.cinema_turning_year_detail ?? null}, cinema_turning_year_detail)
    `)
  },
}
