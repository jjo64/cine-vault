import { Router } from "express"
import {
  createVaultSocialEntry,
  deleteVaultSocialEntry,
  addMovieToVault,
  getMyVaultSocial,
  getMyVault,
  getVaultSocialByUser,
  getVaultByUser,
  removeMovieFromVault,
  updateVaultSocialEntry,
} from "../controllers/VaultController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
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
} from "../schemas/vault.js"

const router = Router()

router.get("/", middlewareAutenticacion, manejadorAsincrono(getMyVault))
router.get(
  "/user/:id_user",
  validarParams(vaultSocialUserParamsSchema),
  manejadorAsincrono(getVaultByUser)
)
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

router.post(
  "/",
  middlewareAutenticacion,
  validarBody(agregarVaultSchema),
  manejadorAsincrono(addMovieToVault)
)

router.delete(
  "/:movie_id",
  middlewareAutenticacion,
  validarParams(eliminarVaultParamsSchema),
  manejadorAsincrono(removeMovieFromVault)
)

export default router
