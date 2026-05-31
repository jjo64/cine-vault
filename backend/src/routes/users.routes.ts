/**
 * @file users.routes.ts
 * @description Gestión de perfiles de usuario y relaciones sociales.
 * Permite la consulta de perfiles públicos, la gestión de la firma cinematográfica,
 * la actualización de avatares y el sistema de seguimiento (follow/unfollow).
 */

import { Router } from "express"
import {
  actualizarAvatar,
  actualizarFirmaCinematograficaController,
  obtenerFirmaCinematograficaController,
} from "../controllers/SettingsController.js"
import {
  buscarUsuarios,
  dejarDeSeguirUsuario,
  obtenerFirmaCinematograficaPublica,
  obtenerGaleriaCuradaPublica,
  obtenerSeguidores,
  obtenerSiguiendo,
  obtenerUsuarioPorUsername,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  seguirUsuario,
  obtenerInsignias,
} from "../controllers/UserController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  validarBody,
  validarParams,
  validarQuery,
} from "../middlewares/validation.middleware.js"
import { idParamSchema } from "../schemas/common.js"
import { actualizarFirmaSchema } from "../schemas/profile.js"
import { actualizarAvatarSchema } from "../schemas/settings.js"
import {
  buscarUsuariosQuerySchema,
  usernameParamSchema,
} from "../schemas/user.js"
import { getPosterOptions, selectPoster } from "../controllers/SubscriptionsController.js"

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de identidad y networking social
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: CONSULTA PÚBLICA
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listado global de usuarios de la plataforma
 *     tags: [Usuarios]
 */
router.get("/", manejadorAsincrono(obtenerUsuarios))

/**
 * Búsqueda de usuarios por username o criterios específicos.
 */
router.get(
  "/search",
  validarQuery(buscarUsuariosQuerySchema),
  manejadorAsincrono(buscarUsuarios)
)

/**
 * Recuperar perfil por ID numérico.
 */
router.get(
  "/:id",
  validarParams(idParamSchema),
  manejadorAsincrono(obtenerUsuarioPorId)
)

/**
 * Recuperar perfil por nombre de usuario único.
 */
router.get(
  "/username/:username",
  validarParams(usernameParamSchema),
  manejadorAsincrono(obtenerUsuarioPorUsername)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: PERFIL Y CONFIGURACIÓN PROPIA
 * ---------------------------------------------------------------------------
 */

/**
 * Obtener la firma cinematográfica del usuario autenticado.
 */
router.get(
  "/me/signature",
  middlewareAutenticacion,
  manejadorAsincrono(obtenerFirmaCinematograficaController)
)

/**
 * Actualizar la firma cinematográfica.
 */
router.patch(
  "/me/signature",
  middlewareAutenticacion,
  validarBody(actualizarFirmaSchema),
  manejadorAsincrono(actualizarFirmaCinematograficaController)
)

/**
 * Actualizar avatar o banner del perfil.
 */
router.post(
  "/me/banner",
  middlewareAutenticacion,
  validarBody(actualizarAvatarSchema),
  manejadorAsincrono(actualizarAvatar)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: RED SOCIAL (Networking)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /users/follow/{id}:
 *   post:
 *     summary: Iniciar seguimiento de otro usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/follow/:id",
  middlewareAutenticacion,
  validarParams(idParamSchema),
  manejadorAsincrono(seguirUsuario)
)

/**
 * @swagger
 * /users/unfollow/{id}:
 *   delete:
 *     summary: Cesar seguimiento de un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/unfollow/:id",
  middlewareAutenticacion,
  validarParams(idParamSchema),
  manejadorAsincrono(dejarDeSeguirUsuario)
)

/**
 * Consultar lista de seguidores de un perfil.
 */
router.get(
  "/:id/followers",
  validarParams(idParamSchema),
  manejadorAsincrono(obtenerSeguidores)
)

/**
 * Consultar lista de usuarios seguidos por un perfil.
 */
router.get(
  "/:id/following",
  validarParams(idParamSchema),
  manejadorAsincrono(obtenerSiguiendo)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: COMPONENTES DE PERFIL PÚBLICO
 * ---------------------------------------------------------------------------
 */

/**
 * Obtener firma cinematográfica de un tercero.
 */
router.get(
  "/:id/profile/signature",
  validarParams(idParamSchema),
  manejadorAsincrono(obtenerFirmaCinematograficaPublica)
)

/**
 * Obtener galería curada de películas de un tercero.
 */
router.get(
  "/:id/profile/curated-gallery",
  validarParams(idParamSchema),
  manejadorAsincrono(obtenerGaleriaCuradaPublica)
)

/**
 * Obtener listado de insignias desbloqueadas.
 */
router.get(
  "/:id/badges",
  validarParams(idParamSchema),
  manejadorAsincrono(obtenerInsignias)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: PÓSTERS ALTERNATIVOS (Membresía)
 * ---------------------------------------------------------------------------
 */
router.get(
  "/posters/options",
  middlewareAutenticacion,
  manejadorAsincrono(getPosterOptions)
)

router.patch(
  "/posters/selection",
  middlewareAutenticacion,
  manejadorAsincrono(selectPoster)
)

export default router
