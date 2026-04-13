import { Router } from "express"
import {
  createArcoDraft,
  getArcoById,
  getArcosModeration,
  getArcos,
  getMyArcoById,
  getMyArcos,
  marcarProgresoArco,
  moderateArco,
  submitArcoReview,
  updateArcoDraft,
} from "../controllers/ArcosController.js"
import { PERMISOS } from "../config/permisos.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { verificarPermiso } from "../middlewares/rbac.middleware.js"
import {
  validarBody,
  validarParams,
  validarQuery,
} from "../middlewares/validation.middleware.js"
import {
  actualizarArcoSchema,
  arcoIdParamsSchema,
  crearArcoSchema,
  listArcosModeracionQuerySchema,
  marcarProgresoArcoSchema,
  moderarArcoSchema,
} from "../schemas/arcos.js"

const router = Router()

router.get("/", manejadorAsincrono(getArcos))

router.get("/mine", middlewareAutenticacion, manejadorAsincrono(getMyArcos))

router.get(
  "/mine/:id",
  middlewareAutenticacion,
  validarParams(arcoIdParamsSchema),
  manejadorAsincrono(getMyArcoById)
)

router.get(
  "/moderation",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_ARCOS),
  validarQuery(listArcosModeracionQuerySchema),
  manejadorAsincrono(getArcosModeration)
)

router.post(
  "/",
  middlewareAutenticacion,
  validarBody(crearArcoSchema),
  manejadorAsincrono(createArcoDraft)
)

router.patch(
  "/:id",
  middlewareAutenticacion,
  validarParams(arcoIdParamsSchema),
  validarBody(actualizarArcoSchema),
  manejadorAsincrono(updateArcoDraft)
)

router.post(
  "/:id/submit",
  middlewareAutenticacion,
  validarParams(arcoIdParamsSchema),
  manejadorAsincrono(submitArcoReview)
)

router.patch(
  "/:id/moderation",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_ARCOS),
  validarParams(arcoIdParamsSchema),
  validarBody(moderarArcoSchema),
  manejadorAsincrono(moderateArco)
)

router.get(
  "/:id",
  validarParams(arcoIdParamsSchema),
  manejadorAsincrono(getArcoById)
)

router.post(
  "/:id/progress",
  middlewareAutenticacion,
  validarParams(arcoIdParamsSchema),
  validarBody(marcarProgresoArcoSchema),
  manejadorAsincrono(marcarProgresoArco)
)

export default router
