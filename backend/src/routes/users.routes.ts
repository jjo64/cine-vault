import { Router } from "express"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerUsuarioPorUsername,
  buscarUsuarios,
  obtenerSeguidores,
  obtenerSiguiendo,
  obtenerFirmaCinematograficaPublica,
  obtenerGaleriaCuradaPublica,
  dejarDeSeguirUsuario,
  seguirUsuario,
} from "../controllers/UserController.js"
import {
  obtenerFirmaCinematograficaController,
  actualizarFirmaCinematograficaController,
  actualizarAvatar,
} from "../controllers/SettingsController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  validarBody,
  validarQuery,
  validarParams,
} from "../middlewares/validation.middleware.js"
import { actualizarFirmaSchema } from "../schemas/profile.js"
import { actualizarAvatarSchema } from "../schemas/settings.js"
import { idParamSchema } from "../schemas/common.js"
import {
  buscarUsuariosQuerySchema,
  usernameParamSchema,
} from "../schemas/user.js"

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios y relaciones sociales
 */

const router = Router()

/**
 * Rutas de Usuarios:
 * Todas envueltas en manejadorAsincrono para centralizar errores.
 */

// Rutas publicas
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UsuarioPublico'
 *             example:
 *               - id: 1
 *                 username: "josue"
 *                 email: "josue@cinevault.com"
 *                 role: "user"
 *                 avatar_url: "https://res.cloudinary.com/doznr2qm4/image/upload/cinevault/avatars/user_1.webp"
 *                 bio: "Amante del cine"
 *                 is_verified: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", middlewareAutenticacion, manejadorAsincrono(obtenerUsuarios))

router.get(
  "/username/:username",
  validarParams(usernameParamSchema),
  manejadorAsincrono(obtenerUsuarioPorUsername)
)
router.get(
  "/search",
  validarQuery(buscarUsuariosQuerySchema),
  manejadorAsincrono(buscarUsuarios)
)

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Datos del perfil (nombre, bio, avatar, stats)
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsuarioPublico'
 *             example:
 *               id: 1
 *               username: "josue"
 *               email: "josue@cinevault.com"
 *               role: "user"
 *               avatar_url: "https://res.cloudinary.com/doznr2qm4/image/upload/cinevault/avatars/user_1.webp"
 *               bio: "Amante del cine"
 *               is_verified: true
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  validarParams(idParamSchema),
  manejadorAsincrono(obtenerUsuarioPorId)
) // Datos del pefil (nombre, bio, avatar, stats)
router.get(
  "/:id/profile/signature",
  validarParams(idParamSchema),
  manejadorAsincrono(obtenerFirmaCinematograficaPublica)
)
router.get(
  "/:id/profile/curated-gallery",
  validarParams(idParamSchema),
  manejadorAsincrono(obtenerGaleriaCuradaPublica)
)

router.get(
  "/me/signature",
  middlewareAutenticacion,
  manejadorAsincrono(obtenerFirmaCinematograficaController)
)

router.patch(
  "/me/signature",
  middlewareAutenticacion,
  validarBody(actualizarFirmaSchema),
  manejadorAsincrono(actualizarFirmaCinematograficaController)
)

router.post(
  "/me/banner",
  middlewareAutenticacion,
  validarBody(actualizarAvatarSchema),
  manejadorAsincrono(actualizarAvatar)
)

// Rutas privadas
/**
 * @swagger
 * /users/follow/{id}:
 *   post:
 *     summary: Seguir usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Usuario seguido correctamente
 *         content:
 *           application/json:
 *             example:
 *               message: "Usuario seguido correctamente"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/follow/:id",
  middlewareAutenticacion,
  validarParams(idParamSchema),
  manejadorAsincrono(seguirUsuario)
) //seguir usuario

/**
 * @swagger
 * /users/unfollow/{id}:
 *   delete:
 *     summary: Dejar de seguir usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Dejado de seguir correctamente
 *         content:
 *           application/json:
 *             example:
 *               message: "Has dejado de seguir al usuario correctamente"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/unfollow/:id",
  middlewareAutenticacion,
  validarParams(idParamSchema),
  manejadorAsincrono(dejarDeSeguirUsuario)
) // dejar de seguir usuario

/**
 * @swagger
 * /users/{id}/followers:
 *   get:
 *     summary: Obtener seguidores de un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Lista de seguidores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UsuarioPublico'
 *             example:
 *               - id: 2
 *                 username: "maria"
 *                 avatar_url: "https://res.cloudinary.com/doznr2qm4/image/upload/cinevault/avatars/user_2.webp"
 *                 bio: null
 *                 is_verified: true
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id/followers",
  validarParams(idParamSchema),
  manejadorAsincrono(obtenerSeguidores)
) // seguidores

/**
 * @swagger
 * /users/{id}/following:
 *   get:
 *     summary: Obtener usuarios que sigue
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Lista de usuarios seguidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UsuarioPublico'
 *             example:
 *               - id: 3
 *                 username: "carlos"
 *                 avatar_url: null
 *                 bio: "Director de cine aficionado"
 *                 is_verified: false
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id/following", manejadorAsincrono(obtenerSiguiendo)) // siguiendo

//router.post('/block/:id', middlewareAutenticacion, manejadorAsincrono(blockUser))
//router.delete('/unblock/:id', middlewareAutenticacion, manejadorAsincrono(unblockUser))

export default router
