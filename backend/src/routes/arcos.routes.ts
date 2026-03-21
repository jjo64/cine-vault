import { Router } from "express"
import {
  getArcoById,
  getArcos,
  marcarProgresoArco,
} from "../controllers/ArcosController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  validarBody,
  validarParams,
} from "../middlewares/validation.middleware.js"
import {
  arcoIdParamsSchema,
  marcarProgresoArcoSchema,
} from "../schemas/arcos.js"

const router = Router()

router.get("/", manejadorAsincrono(getArcos))
router.get("/:id", validarParams(arcoIdParamsSchema), manejadorAsincrono(getArcoById))
router.post(
  "/:id/progress",
  middlewareAutenticacion,
  validarParams(arcoIdParamsSchema),
  validarBody(marcarProgresoArcoSchema),
  manejadorAsincrono(marcarProgresoArco)
)

export default router
