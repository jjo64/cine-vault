/**
 * @file arcos.routes.ts
 * @description Definición de rutas para el sistema de "Arcos Narrativos".
 * Gestiona la creación, moderación y seguimiento del progreso de colecciones
 * temáticas curadas (Story Arcs) por los usuarios.
 */

import { Router } from "express"
import { PERMISOS } from "../config/permisos.js"
import {
  createArcoDraft,
  getArcoById,
  getArcos,
  getArcosModeration,
  getMyArcoById,
  getMyArcos,
  marcarProgresoArco,
  moderateArco,
  submitArcoReview,
  updateArcoDraft,
} from "../controllers/ArcosController.js"
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

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: EXPLORACIÓN PÚBLICA
 * ---------------------------------------------------------------------------
 */

// Listado global de arcos publicados
router.get("/", manejadorAsincrono(getArcos))

// Detalle individual de un arco
router.get(
  "/:id",
  validarParams(arcoIdParamsSchema),
  manejadorAsincrono(getArcoById)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN PERSONAL (Mis Arcos)
 * ---------------------------------------------------------------------------
 */

// Listado y detalle de arcos propios
router.get("/mine", middlewareAutenticacion, manejadorAsincrono(getMyArcos))
router.get(
  "/mine/:id",
  middlewareAutenticacion,
  validarParams(arcoIdParamsSchema),
  manejadorAsincrono(getMyArcoById)
)

// Creación y edición de borradores
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

// Envío a revisión para publicación
router.post(
  "/:id/submit",
  middlewareAutenticacion,
  validarParams(arcoIdParamsSchema),
  manejadorAsincrono(submitArcoReview)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: INTERACCIÓN Y PROGRESO
 * ---------------------------------------------------------------------------
 */

// Seguimiento de avance en un arco específico
router.post(
  "/:id/progress",
  middlewareAutenticacion,
  validarParams(arcoIdParamsSchema),
  validarBody(marcarProgresoArcoSchema),
  manejadorAsincrono(marcarProgresoArco)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: MODERACIÓN (Solo Staff)
 * ---------------------------------------------------------------------------
 */

// Panel de moderación y gestión de estatus de arcos
router.get(
  "/moderation",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_ARCOS),
  validarQuery(listArcosModeracionQuerySchema),
  manejadorAsincrono(getArcosModeration)
)

router.patch(
  "/:id/moderation",
  middlewareAutenticacion,
  verificarPermiso(PERMISOS.GESTIONAR_ARCOS),
  validarParams(arcoIdParamsSchema),
  validarBody(moderarArcoSchema),
  manejadorAsincrono(moderateArco)
)

export default router
