/**
 * @file settings.services.ts
 * @description Capa de servicios para la configuración de cuentas y personalización avanzada.
 * Gestiona la seguridad (cambio de password), identidad visual (avatares vía Cloudinary), 
 * preferencias de perfil y la curación de contenido personal (firma y galería).
 */

import cloudinary from "../config/claudinary.config.js"
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../errors/AppErrors.js"
import { compararContrasena, hashearContrasena } from "../lib/crypto.js"
import { cinematographicSignatureRepository } from "../repositories/CinematographicSignatureRepository.js"
import { curatedGalleryRepository } from "../repositories/CuratedGalleryRepository.js"
import { settingsRepository } from "../repositories/SettingsRepository.js"
import { userRepository } from "../repositories/UserRepository.js"
import type {
  ActualizarFirmaDTO,
  ActualizarGaleriaCuradaDTO,
} from "../schemas/profile.js"
import type {
  ActualizarAuthDTO,
  ActualizarAvatarDTO,
  ActualizarPerfilDTO,
} from "../schemas/settings.js"

// --- Constantes de Configuración ---

const FORMATOS_AVATAR_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"]
const TAMANIO_MAXIMO_BYTES = 5 * 1024 * 1024 // 5 MB

// --- Servicios de Configuración de Perfil y Seguridad ---

/**
 * Actualiza los metadatos biográficos del perfil de usuario.
 */
export const actualizarPerfilService = async (
  userId: number,
  data: ActualizarPerfilDTO
) => {
  await settingsRepository.updateProfile(userId, data)
}

/**
 * Gestiona el cambio seguro de contraseña.
 * Valida la identidad del usuario mediante la verificación de la contraseña actual 
 * antes de proceder al cifrado y persistencia de la nueva clave.
 */
export const actualizarAuthService = async (
  userId: number,
  data: ActualizarAuthDTO
) => {
  const usuario = await settingsRepository.findById(userId)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")

  const passwordValida = await compararContrasena(
    data.password_actual,
    usuario.password
  )
  if (!passwordValida) {
    throw new UnauthorizedError("La contraseña actual proporcionada es incorrecta")
  }

  const hashedPassword = await hashearContrasena(data.password_nueva)
  await settingsRepository.updatePassword(userId, hashedPassword)
}

/**
 * Procesa la carga y actualización del avatar del usuario.
 * Realiza validaciones de seguridad sobre el formato MIME y tamaño del archivo 
 * antes de delegar el almacenamiento persistente a Cloudinary.
 * 
 * @param userId ID del usuario.
 * @param data Objeto con la imagen en formato base64.
 * @returns URL segura de la imagen alojada.
 */
export const actualizarAvatarService = async (
  userId: number,
  data: ActualizarAvatarDTO
) => {
  // Validación de firma MIME para evitar subidas de archivos maliciosos
  const match = data.avatar.match(/^data:(.+);base64,/)
  if (!match || !FORMATOS_AVATAR_PERMITIDOS.includes(match[1])) {
    throw new ValidationError("Formato de imagen no permitido. Utilice JPG, PNG o WEBP")
  }

  // Validación de peso: estimación del tamaño real desde base64 (~75% de la longitud de cadena)
  const tamanoBytes = (data.avatar.length * 3) / 4
  if (tamanoBytes > TAMANIO_MAXIMO_BYTES) {
    throw new ValidationError("La imagen excede el límite permitido de 5MB")
  }

  const resultado = await cloudinary.uploader.upload(data.avatar, {
    folder: "cinevault/avatars",
    public_id: `user_${userId}`,
    overwrite: true,
  })

  await settingsRepository.updateAvatar(userId, resultado.secure_url)
  return resultado.secure_url
}

/**
 * Ejecuta la eliminación definitiva de la cuenta de usuario y sus datos asociados.
 */
export const eliminarCuentaService = async (userId: number) => {
  const usuario = await settingsRepository.findById(userId)
  if (!usuario) throw new NotFoundError("Usuario no encontrado")
  
  await userRepository.deleteById(userId)
}

// --- Servicios de Firma Cinematográfica ---

/**
 * Recupera los hitos cinematográficos configurados por el usuario.
 */
export const obtenerFirmaCinematograficaService = async (userId: number) => {
  return cinematographicSignatureRepository.findByUserId(userId)
}

/**
 * Actualiza o crea la "Firma Cinematográfica" (hitos personales del usuario).
 */
export const actualizarFirmaCinematograficaService = async (
  userId: number,
  data: ActualizarFirmaDTO
) => {
  await cinematographicSignatureRepository.upsert(userId, data)
  return cinematographicSignatureRepository.findByUserId(userId)
}

// --- Servicios de Galería Curada ---

/**
 * Obtiene la colección de películas destacadas del usuario (Top List).
 */
export const obtenerGaleriaCuradaService = async (userId: number) => {
  const items = await curatedGalleryRepository.findByUserId(userId)
  return { items }
}

/**
 * Actualiza la galería curada, garantizando que todos los elementos existan en la 
 * base de datos de referencia (movies_ref) para mantener la integridad referencial.
 */
export const actualizarGaleriaCuradaService = async (
  userId: number,
  data: ActualizarGaleriaCuradaDTO
) => {
  const uniqueMovieIds = [...new Set(data.items.map((item) => item.movie_id))]
  const found = await curatedGalleryRepository.existMovieIds(uniqueMovieIds)

  if (found.length !== uniqueMovieIds.length) {
    throw new ValidationError("Una o más películas seleccionadas no están registradas en el sistema")
  }

  await curatedGalleryRepository.replace(userId, data)
  return obtenerGaleriaCuradaService(userId)
}
