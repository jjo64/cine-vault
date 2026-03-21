import { Router } from "express"
import { getDirectorAutopsy } from "../controllers/DirectorsController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { validarParams } from "../middlewares/validation.middleware.js"
import { directorAutopsyParamsSchema } from "../schemas/directors.js"

const router = Router()

router.get(
  "/:id/autopsy",
  validarParams(directorAutopsyParamsSchema),
  manejadorAsincrono(getDirectorAutopsy)
)

export default router
