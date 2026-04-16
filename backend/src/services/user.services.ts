/**
 * @file user.services.ts
 * @description Capa de servicios para la gestión de Identidad, Perfiles y Relaciones Sociales.
 * Implementa la lógica de negocio para la personalización del perfil, el motor de 
 * seguimiento (social graph), la búsqueda de miembros y la gestión de la "Firma Cinematográfica".
 */

import { Prisma } from "@prisma/client"
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/AppErrors.js"
import { userRepository } from "../repositories/UserRepository.js"
import { userProfileRepository } from "../repositories/userProfileRepository.js"
import { emitirNotificacionService } from "./notifications.services.js"

// --- Tipos y Constantes ---

/**
 * Representa la estructura de datos permitida para actualizaciones parciales del perfil.
 */
type ActualizarPerfil = {
  username?: string
  avatar_url?: string
  bio?: string
}

/**
 * Estructura por defecto para usuarios que aún no han configurado su Firma Cinematográfica.
 */
const EMPTY_SIGNATURE = {
  pivotal_film: null,
  pivotal_film_detail: null,
  formative_director: null,
  formative_director_detail: null,
  unforgettable_scene: null,
  unforgettable_scene_detail: null,
  cinema_turning_year: null,
  cinema_turning_year_detail: null,
}

// --- Servicios de Gestión de Perfil ---

/**
 * Actualiza los datos biográficos y de identidad del usuario.
 * Realiza validaciones de integridad en el nombre de usuario (longitud) y bio.
 * 
 * @param idUsuario ID del usuario autenticado.
 * @param datos Fragmento de datos a actualizar.
 * @throws ValidationError si los datos no cumplen los requisitos de formato.
 * @throws ConflictError si el nuevo username ya está registrado en el sistema.
 */
export const actualizarPerfilService = async (
  idUsuario: number,
  datos: { username?: string; avatar_url?: string; bio?: string }
) => {
  const datosActualizar: ActualizarPerfil = {}

  if (datos.username !== undefined) {
    if (
      typeof datos.username !== "string" ||
      datos.username.trim().length < 3
    ) {
      throw new ValidationError("Nombre de usuario inválido (mínimo 3 caracteres)")
    }
    datosActualizar.username = datos.username.trim()
  }

  if (datos.avatar_url !== undefined) {
    if (typeof datos.avatar_url !== "string") {
      throw new ValidationError("La URL del avatar no es válida")
    }
    datosActualizar.avatar_url = datos.avatar_url
  }

  if (datos.bio !== undefined) {
    if (typeof datos.bio !== "string" || datos.bio.length > 280) {
      throw new ValidationError("La biografía excede el límite de 280 caracteres")
    }
    datosActualizar.bio = datos.bio
  }

  if (Object.keys(datosActualizar).length === 0) {
    throw new ValidationError("No se proporcionaron cambios para actualizar")
  }

  try {
    await userProfileRepository.update(idUsuario, datosActualizar)
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError("El nombre de usuario ya está siendo utilizado por otro miembro")
    }
    throw error
  }
}

// --- Servicios de Relaciones Sociales (Followers/Following) ---

/**
 * Establece una relación de seguimiento entre dos usuarios.
 * Evita que un usuario se siga a sí mismo o duplique seguimientos existentes.
 */
export const seguirUsuarioService = async (
  idUsuario: number,
  idUsuarioSeguir: number
) => {
  if (idUsuario === idUsuarioSeguir) {
    throw new ValidationError("No puedes seguir tu propia cuenta")
  }

  try {
    await userProfileRepository.createFollow(idUsuario, idUsuarioSeguir)

    // Emisión de notificación social si el seguimiento es genuino
    if (idUsuario !== idUsuarioSeguir) {
      await emitirNotificacionService({
        user_id: idUsuarioSeguir,
        sender_id: idUsuario,
        type: "follow",
      }).catch((err: unknown) => {
        console.error(
          "[Notificaciones] Fallo al emitir notificación de seguimiento:",
          err
        )
      })
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError("Ya te encuentras siguiendo a este usuario")
    }
    throw error
  }
}

/**
 * Elimina una relación de seguimiento existente.
 */
export const dejarDeSeguirUsuarioService = async (
  idUsuario: number,
  idUsuarioDejar: number
) => {
  const eliminado = await userProfileRepository.deleteFollow(
    idUsuario,
    idUsuarioDejar
  )

  if (eliminado.count === 0) {
    throw new NotFoundError("No existe una relación de seguimiento previa con este usuario")
  }
}

/**
 * Recupera el listado de seguidores de un usuario, resolviendo identidades en una única consulta.
 */
export const obtenerSeguidoresService = async (id: number) => {
  const usuario = await userProfileRepository.findFollowers(id)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")
  
  return usuario.follows_follows_following_idTousers
    .map((f: any) => f.users_follows_follower_idTousers)
    .filter(Boolean)
}

/**
 * Recupera el listado de usuarios a los que sigue un individuo específico.
 */
export const obtenerSiguiendoService = async (id: number) => {
  const usuario = await userProfileRepository.findFollowing(id)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  return usuario.follows_follows_follower_idTousers
    .map((f: any) => f.users_follows_following_idTousers)
    .filter(Boolean)
}

// --- Servicios de Búsqueda y Recuperación de Datos ---

/**
 * Obtiene el catálogo completo de usuarios registrados (Uso Administrativo/General).
 */
export const obtenerUsuariosService = async () => {
  return userRepository.findAll()
}

/**
 * Recupera el perfil público de un usuario, incluyendo el estado de seguimiento 
 * relativo a un espectador (viewer).
 */
export const obtenerUsuarioPorIdService = async (
  id: number,
  viewerId: number | null = null
) => {
  const usuario = await userProfileRepository.findById(id)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  if (!viewerId || viewerId === id) {
    return { ...usuario, is_following: false }
  }

  const relacion = await userProfileRepository.findFollow(viewerId, id)
  return { ...usuario, is_following: Boolean(relacion) }
}

/**
 * Localiza a un usuario mediante su nombre de usuario único.
 */
export const obtenerUsuarioPorUsernameService = async (username: string) => {
  const normalized = username.trim()
  if (!normalized) throw new ValidationError("Se requiere un nombre de usuario válido")

  const usuario = await userProfileRepository.findByUsername(normalized)
  if (!usuario) throw new NotFoundError("Perfil no encontrado")
  return usuario
}

/**
 * Ejecuta una búsqueda de usuarios basada en coincidencia parcial de texto.
 */
export const buscarUsuariosService = async (query: string, limit = 12) => {
  const normalized = query.trim()
  if (!normalized) return []

  const take = Math.max(1, Math.min(30, Number.isFinite(limit) ? limit : 12))
  return userProfileRepository.search(normalized, take)
}

// --- Servicios de Curación Cinematográfica ---

/**
 * Obtiene la "Firma Cinematográfica" del usuario: hitos y preferencias personales.
 */
export const obtenerFirmaCinematograficaPublicaService = async (id: number) => {
  const user = await userProfileRepository.findById(id)
  if (!user) throw new NotFoundError("Usuario no encontrado")

  try {
    const rows = await userProfileRepository.findCinematographicSignature(id)
    return rows[0] ?? { user_id: id, ...EMPTY_SIGNATURE }
  } catch {
    return { user_id: id, ...EMPTY_SIGNATURE }
  }
}

/**
 * Obtiene los elementos destacados de la "Galería Curada" del perfil del usuario.
 */
export const obtenerGaleriaCuradaPublicaService = async (id: number) => {
  const user = await userProfileRepository.findById(id)
  if (!user) throw new NotFoundError("Usuario no encontrado")

  try {
    const items = await userProfileRepository.findCuratedGallery(id)
    return { items }
  } catch {
    return { items: [] }
  }
}
