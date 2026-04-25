/**
 * @file SettingsController.ts
 * @description Controlador para la gestión de preferencias y personalización de cuenta.
 * Permite a los usuarios actualizar su perfil biográfico, credenciales de acceso,
 * avatares y elementos decorativos como la "Firma Cinematográfica" y la "Galería Curada".
 */

import { Response } from "express"
import type { SolicitudAutenticada } from "../middlewares/auth.middlewares.js"
import * as settingsService from "../services/settings.services.js"

/**
 * Actualiza la información biográfica y pública del perfil del usuario.
 */
export const actualizarPerfil = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  await settingsService.actualizarPerfilService(req.user!.user_id, req.body)
  res.json({ message: "Perfil actualizado correctamente" })
}

/**
 * Gestiona el cambio de credenciales de autenticación (contraseña).
 */
export const actualizarAuth = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  await settingsService.actualizarAuthService(req.user!.user_id, req.body)
  res.json({ message: "Contraseña actualizada correctamente" })
}

/**
 * Sube y actualiza la imagen de avatar del usuario.
 */
export const actualizarAvatar = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const avatarUrl = await settingsService.actualizarAvatarService(
    req.user!.user_id,
    req.body
  )
  res.json({
    message: "Avatar actualizado correctamente",
    avatar_url: avatarUrl,
  })
}

/**
 * Elimina de forma definitiva la cuenta del usuario y todos sus datos asociados.
 */
export const eliminarCuenta = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  await settingsService.eliminarCuentaService(req.user!.user_id)
  res.json({ message: "Cuenta eliminada correctamente" })
}

/**
 * Recupera la firma cinematográfica personalizada del usuario.
 */
export const obtenerFirmaCinematograficaController = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const userId = req.user!.user_id
  const firma = await settingsService.obtenerFirmaCinematograficaService(userId)

  return res.json({
    ok: true,
    data: firma,
  })
}

/**
 * Actualiza o crea la firma cinematográfica (lemas, estilo) del usuario.
 */
export const actualizarFirmaCinematograficaController = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const userId = req.user!.user_id
  const firma = await settingsService.actualizarFirmaCinematograficaService(
    userId,
    req.body
  )

  return res.json({
    ok: true,
    message: "Firma cinematográfica actualizada",
    data: firma,
  })
}

/**
 * Obtiene la galería de pósters curada que se muestra en el perfil del usuario.
 */
export const obtenerGaleriaCuradaController = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const userId = req.user!.user_id
  const galeria = await settingsService.obtenerGaleriaCuradaService(userId)

  return res.json({
    ok: true,
    data: galeria,
  })
}

/**
 * Actualiza la selección de películas que componen la galería curada.
 */
export const actualizarGaleriaCuradaController = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const userId = req.user!.user_id
  const galeria = await settingsService.actualizarGaleriaCuradaService(
    userId,
    req.body
  )

  return res.json({
    ok: true,
    message: "Galería curada actualizada",
    data: galeria,
  })
}
