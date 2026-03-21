import cloudinary from "../config/claudinary.config.js"
import { Prisma } from "@prisma/client"
import { settingsRepository } from "../repositories/SettingsRepository.js"
import { userRepository } from "../repositories/UserRepository.js"
import { hashearContrasena, compararContrasena } from "../lib/crypto.js"
import { prisma } from "../lib/prisma.js"
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors/AppErrors.js"
import type {
  ActualizarPerfilDTO,
  ActualizarAuthDTO,
  ActualizarAvatarDTO,
} from "../schemas/settings.js"
import type {
  ActualizarFirmaDTO,
  ActualizarGaleriaCuradaDTO,
} from "../schemas/profile.js"

/* ==========================================================================
   SETTINGS SERVICE
   --------------------------------------------------------------------------
   Lógica de negocio para configuración de cuenta: perfil, contraseña, avatar
   y eliminación de cuenta. Antes esta lógica estaba mezclada en el Controller
   con inline interfaces, bcrypt directo y queries de Prisma sin servicio.

   Decisiones:
   - hashearContrasena / compararContrasena: reutiliza las mismas funciones de
     crypto.ts que usa auth.services.ts (sin duplicar lógica de bcrypt).
   - Cloudinary se invoca aquí (capa de servicio) porque es I/O externo con
     lógica de negocio (validación de formato/tamaño).
   ========================================================================== */

const FORMATOS_AVATAR_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"]
const TAMANIO_MAXIMO_BYTES = 5 * 1024 * 1024 // 5 MB

export const actualizarPerfilService = async (
  userId: number,
  data: ActualizarPerfilDTO
) => {
  await settingsRepository.updateProfile(userId, data)
}

export const actualizarAuthService = async (
  userId: number,
  data: ActualizarAuthDTO
) => {
  const usuario = await userRepository.findById(userId)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  const passwordValida = await compararContrasena(
    data.password_actual,
    usuario.password
  )
  if (!passwordValida)
    throw new UnauthorizedError("Contraseña actual incorrecta")

  const hashedPassword = await hashearContrasena(data.password_nueva)
  await settingsRepository.updatePassword(userId, hashedPassword)
}

export const actualizarAvatarService = async (
  userId: number,
  data: ActualizarAvatarDTO
) => {
  // Validar formato MIME embebido en el base64
  const match = data.avatar.match(/^data:(.+);base64,/)
  if (!match || !FORMATOS_AVATAR_PERMITIDOS.includes(match[1])) {
    throw new ValidationError("Formato no permitido. Usa JPG, PNG o WEBP")
  }

  // Validar tamaño: las cadenas base64 tienen ~4/3 del tamaño original
  const tamanoBytes = (data.avatar.length * 3) / 4
  if (tamanoBytes > TAMANIO_MAXIMO_BYTES) {
    throw new ValidationError("La imagen no puede superar los 5MB")
  }

  const resultado = await cloudinary.uploader.upload(data.avatar, {
    folder: "cinevault/avatars",
    public_id: `user_${userId}`,
    overwrite: true,
  })

  await settingsRepository.updateAvatar(userId, resultado.secure_url)

  return resultado.secure_url
}

export const eliminarCuentaService = async (userId: number) => {
  const usuario = await userRepository.findById(userId)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")
  // La eliminación en cascada de Prisma (onDelete: Cascade) limpia el resto
  await userRepository.update(userId, {})
  // Prisma no tiene un método delete en IUserRepository, lo extendemos aquí
  // a través del repositorio base usando la instancia de la clase
  const { prisma } = await import("../lib/prisma.js")
  await prisma.users.delete({ where: { id: userId } })
}

export const obtenerFirmaCinematograficaService = async (userId: number) => {
  try {
    const rows = await prisma.$queryRaw<Array<Record<string, string | number | null>>>(Prisma.sql`
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

    const row = rows[0]
    if (!row) {
      return {
        user_id: userId,
        pivotal_film: null,
        pivotal_film_detail: null,
        formative_director: null,
        formative_director_detail: null,
        unforgettable_scene: null,
        unforgettable_scene_detail: null,
        cinema_turning_year: null,
        cinema_turning_year_detail: null,
      }
    }

    return row
  } catch {
    return {
      user_id: userId,
      pivotal_film: null,
      pivotal_film_detail: null,
      formative_director: null,
      formative_director_detail: null,
      unforgettable_scene: null,
      unforgettable_scene_detail: null,
      cinema_turning_year: null,
      cinema_turning_year_detail: null,
    }
  }
}

export const actualizarFirmaCinematograficaService = async (
  userId: number,
  data: ActualizarFirmaDTO
) => {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO cinematographic_signature (
      user_id,
      pivotal_film,
      pivotal_film_detail,
      formative_director,
      formative_director_detail,
      unforgettable_scene,
      unforgettable_scene_detail,
      cinema_turning_year,
      cinema_turning_year_detail
    ) VALUES (
      ${userId},
      ${data.pivotal_film ?? null},
      ${data.pivotal_film_detail ?? null},
      ${data.formative_director ?? null},
      ${data.formative_director_detail ?? null},
      ${data.unforgettable_scene ?? null},
      ${data.unforgettable_scene_detail ?? null},
      ${data.cinema_turning_year ?? null},
      ${data.cinema_turning_year_detail ?? null}
    )
    ON DUPLICATE KEY UPDATE
      pivotal_film = COALESCE(${data.pivotal_film ?? null}, pivotal_film),
      pivotal_film_detail = COALESCE(${data.pivotal_film_detail ?? null}, pivotal_film_detail),
      formative_director = COALESCE(${data.formative_director ?? null}, formative_director),
      formative_director_detail = COALESCE(${data.formative_director_detail ?? null}, formative_director_detail),
      unforgettable_scene = COALESCE(${data.unforgettable_scene ?? null}, unforgettable_scene),
      unforgettable_scene_detail = COALESCE(${data.unforgettable_scene_detail ?? null}, unforgettable_scene_detail),
      cinema_turning_year = COALESCE(${data.cinema_turning_year ?? null}, cinema_turning_year),
      cinema_turning_year_detail = COALESCE(${data.cinema_turning_year_detail ?? null}, cinema_turning_year_detail)
  `)

  return obtenerFirmaCinematograficaService(userId)
}

export const obtenerGaleriaCuradaService = async (userId: number) => {
  try {
    const items = await prisma.$queryRaw<Array<Record<string, string | number | null>>>(Prisma.sql`
      SELECT
        cgi.movie_id,
        cgi.order_index,
        cgi.note,
        mr.tmdb_id
      FROM curated_gallery_items cgi
      INNER JOIN movies_ref mr ON mr.id = cgi.movie_id
      WHERE cgi.user_id = ${userId}
      ORDER BY cgi.order_index ASC
    `)

    return { items }
  } catch {
    return { items: [] }
  }
}

export const actualizarGaleriaCuradaService = async (
  userId: number,
  data: ActualizarGaleriaCuradaDTO
) => {
  const movieIds = data.items.map((item) => item.movie_id)
  const existingMovies = await prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`
    SELECT id
    FROM movies_ref
    WHERE id IN (${Prisma.join(movieIds)})
  `)

  if (existingMovies.length !== movieIds.length) {
    throw new ValidationError("Una o más películas no existen en movies_ref")
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      DELETE FROM curated_gallery_items
      WHERE user_id = ${userId}
    `)

    for (const item of data.items) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO curated_gallery_items (user_id, movie_id, order_index, note)
        VALUES (${userId}, ${item.movie_id}, ${item.order_index}, ${item.note ?? null})
      `)
    }
  })

  return obtenerGaleriaCuradaService(userId)
}
