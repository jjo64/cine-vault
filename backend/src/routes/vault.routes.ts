import { Router } from "express"
import {
  addMovieToVault,
  getMyVault,
  getVaultByUser,
  removeMovieFromVault,
} from "../controllers/VaultController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  validarBody,
  validarParams,
} from "../middlewares/validation.middleware.js"
import { agregarVaultSchema, eliminarVaultParamsSchema } from "../schemas/vault.js"

const router = Router()

router.get("/", middlewareAutenticacion, manejadorAsincrono(getMyVault))
router.get("/user/:id_user", manejadorAsincrono(getVaultByUser))

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
