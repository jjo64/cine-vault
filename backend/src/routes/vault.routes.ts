/**
 * @file vault.routes.ts
 * @description Gestión de la "Cripta" (Vault), la colección definitiva del usuario.
 * Permite a los usuarios añadir películas que "definen" su gusto cinematográfico
 * y acompañarlas de críticas extendidas (social entries) para su perfil público.
 */

import { Router } from "express"
import {
  addMovieToVault,
  createVaultSocialEntry,
  deleteVaultSocialEntry,
  getMyVault,
  getMyVaultSocial,
  getVaultByUser,
  getVaultSocialByUser,
  removeMovieFromVault,
  updateVaultSocialEntry,
  getVaultSocialEntryById,
} from "../controllers/VaultController.js"
import { middlewareAutenticacion, middlewareAutenticacionOpcional } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  validarBody,
  validarParams,
  validarQuery,
} from "../middlewares/validation.middleware.js"
import {
  agregarVaultSchema,
  createVaultSocialEntrySchema,
  eliminarVaultParamsSchema,
  listVaultSocialQuerySchema,
  updateVaultSocialEntrySchema,
  vaultSocialEntryIdParamsSchema,
  vaultSocialUserParamsSchema,
  crearVideoSchema,
  videoIdParamsSchema,
  crearClipSchema,
  clipIdParamsSchema,
  pinClipSchema,
} from "../schemas/vault.js"
import {
  addVideo,
  deleteVideo,
  addClip,
  pinClip,
} from "../controllers/VaultMediaController.js"

/**
 * @swagger
 * tags:
 *   name: Vault
 *   description: Colección definitiva y biblioteca personal socializada
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: LECTURA DE COLECCIONES (Vault)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /vault:
 *   get:
 *     summary: Obtener la colección completa (Vault) del usuario autenticado
 *     tags: [Vault]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", middlewareAutenticacion, manejadorAsincrono(getMyVault))

/**
 * @swagger
 * /vault/user/{id_user}:
 *   get:
 *     summary: Consultar el Vault público de otro usuario
 *     tags: [Vault]
 */
router.get(
  "/user/:id_user",
  validarParams(vaultSocialUserParamsSchema),
  manejadorAsincrono(getVaultByUser)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: CRÍTICA EXTENDIDA (Social Entries)
 * ---------------------------------------------------------------------------
 */

/**
 * Recuperar las entradas sociales (críticas) del Vault de un usuario.
 */
router.get(
  "/social/mine",
  middlewareAutenticacion,
  validarQuery(listVaultSocialQuerySchema),
  manejadorAsincrono(getMyVaultSocial)
)

router.get(
  "/social/user/:id_user",
  validarParams(vaultSocialUserParamsSchema),
  validarQuery(listVaultSocialQuerySchema),
  manejadorAsincrono(getVaultSocialByUser)
)

router.get(
  "/social/entry/:id",
  middlewareAutenticacionOpcional,
  validarParams(vaultSocialEntryIdParamsSchema),
  manejadorAsincrono(getVaultSocialEntryById)
)

/**
 * Publicar o actualizar la "entrada social" para una película del Vault.
 */
router.post(
  "/social",
  middlewareAutenticacion,
  validarBody(createVaultSocialEntrySchema),
  manejadorAsincrono(createVaultSocialEntry)
)

router.patch(
  "/social/:id",
  middlewareAutenticacion,
  validarParams(vaultSocialEntryIdParamsSchema),
  validarBody(updateVaultSocialEntrySchema),
  manejadorAsincrono(updateVaultSocialEntry)
)

router.delete(
  "/social/:id",
  middlewareAutenticacion,
  validarParams(vaultSocialEntryIdParamsSchema),
  manejadorAsincrono(deleteVaultSocialEntry)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: MULTIMEDIA DEL VAULT (Membresía)
 * ---------------------------------------------------------------------------
 */
router.post(
  "/media/videos",
  middlewareAutenticacion,
  validarBody(crearVideoSchema),
  manejadorAsincrono(addVideo)
)

router.delete(
  "/media/videos/:id",
  middlewareAutenticacion,
  validarParams(videoIdParamsSchema),
  manejadorAsincrono(deleteVideo)
)

router.post(
  "/media/clips",
  middlewareAutenticacion,
  validarBody(crearClipSchema),
  manejadorAsincrono(addClip)
)

router.patch(
  "/media/clips/:id/pin",
  middlewareAutenticacion,
  validarParams(clipIdParamsSchema),
  validarBody(pinClipSchema),
  manejadorAsincrono(pinClip)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN DE ÍTEMS (Alta/Baja en Vault)
 * ---------------------------------------------------------------------------
 */

/**
 * Añadir un nuevo título a la Cripta personal.
 */
router.post(
  "/",
  middlewareAutenticacion,
  validarBody(agregarVaultSchema),
  manejadorAsincrono(addMovieToVault)
)

/**
 * Eliminar una película de la Cripta.
 */
router.delete(
  "/:movie_id",
  middlewareAutenticacion,
  validarParams(eliminarVaultParamsSchema),
  manejadorAsincrono(removeMovieFromVault)
)

export default router
