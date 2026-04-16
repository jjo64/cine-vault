/**
 * @file settings.routes.ts
 * @description Configuración de cuenta y personalización del perfil de usuario.
 * Gestiona la actualización de datos personales, credenciales de acceso,
 * elementos de identidad visual (avatar) y la firma cinematográfica personalizada.
 */

import { Router } from "express"
import {
  actualizarAuth,
  actualizarAvatar,
  actualizarFirmaCinematograficaController,
  actualizarGaleriaCuradaController,
  actualizarPerfil,
  eliminarCuenta,
  obtenerFirmaCinematograficaController,
  obtenerGaleriaCuradaController,
} from "../controllers/SettingsController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { validarBody } from "../middlewares/validation.middleware.js"
import {
  actualizarFirmaSchema,
  actualizarGaleriaCuradaSchema,
} from "../schemas/profile.js"
import {
  actualizarAuthSchema,
  actualizarAvatarSchema,
  actualizarPerfilSchema,
} from "../schemas/settings.js"

/**
 * @swagger
 * tags:
 *   name: Ajustes
 *   description: Personalización del perfil y seguridad de la cuenta
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN DE CUENTA (Privado)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /settings:
 *   patch:
 *     summary: Actualizar información básica del perfil (username, bio, etc.)
 *     tags: [Ajustes]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/",
  middlewareAutenticacion,
  validarBody(actualizarPerfilSchema),
  manejadorAsincrono(actualizarPerfil)
)

/**
 * Eliminar permanentemente la cuenta del usuario autenticado.
 */
router.delete("/", middlewareAutenticacion, manejadorAsincrono(eliminarCuenta))

/**
 * @swagger
 * /settings/auth:
 *   patch:
 *     summary: Actualizar credenciales de acceso (cambio de password)
 *     tags: [Ajustes]
 */
router.patch(
  "/auth",
  middlewareAutenticacion,
  validarBody(actualizarAuthSchema),
  manejadorAsincrono(actualizarAuth)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: IDENTIDAD VISUAL Y FIRMA
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /settings/avatar:
 *   patch:
 *     summary: Cambiar la imagen de perfil (Avatar)
 *     tags: [Ajustes]
 */
router.patch(
  "/avatar",
  middlewareAutenticacion,
  validarBody(actualizarAvatarSchema),
  manejadorAsincrono(actualizarAvatar)
)

/**
 * Recuperar la firma cinematográfica propia.
 */
router.get(
  "/profile/signature",
  middlewareAutenticacion,
  manejadorAsincrono(obtenerFirmaCinematograficaController)
)

/**
 * Actualizar los datos de la firma cinematográfica.
 */
router.patch(
  "/profile/signature",
  middlewareAutenticacion,
  validarBody(actualizarFirmaSchema),
  manejadorAsincrono(actualizarFirmaCinematograficaController)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GALERÍA CURADA
 * ---------------------------------------------------------------------------
 */

/**
 * Recuperar la selección de películas de la galería curada.
 */
router.get(
  "/profile/curated-gallery",
  middlewareAutenticacion,
  manejadorAsincrono(obtenerGaleriaCuradaController)
)

/**
 * Actualizar la selección de películas de la galería curada.
 */
router.put(
  "/profile/curated-gallery",
  middlewareAutenticacion,
  validarBody(actualizarGaleriaCuradaSchema),
  manejadorAsincrono(actualizarGaleriaCuradaController)
)

export default router
