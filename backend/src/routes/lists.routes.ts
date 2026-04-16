/**
 * @file lists.routes.ts
 * @description Gestión de Listas de Películas personalizadas.
 * Permite a los usuarios crear colecciones temáticas (ej: "Peliculas de Terror de los 80"),
 * compartirlas con la comunidad y gestionar dinámicamente sus contenidos.
 */

import { Router } from "express"
import {
  addMovieToList,
  createList,
  deleteList,
  getMyListDetail,
  getMyLists,
  getPublicListDetail,
  getPublicLists,
  removeMovieFromList,
  updateList,
} from "../controllers/ListsController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  validarBody,
  validarParams,
  validarQuery,
} from "../middlewares/validation.middleware.js"
import {
  addMovieToListSchema,
  createListSchema,
  listIdParamsSchema,
  listItemParamsSchema,
  listPublicListsQuerySchema,
  updateListSchema,
} from "../schemas/lists.js"

/**
 * @swagger
 * tags:
 *   name: Listas
 *   description: Colecciones personalizadas de cine
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: DESCUBRIMIENTO (Listas Públicas)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /lists/public:
 *   get:
 *     summary: Explorar listas públicas compartidas por la comunidad
 *     tags: [Listas]
 */
router.get(
  "/public",
  validarQuery(listPublicListsQuerySchema),
  manejadorAsincrono(getPublicLists)
)

/**
 * Obtener el detalle y contenido de una lista pública específica.
 */
router.get(
  "/public/:id",
  validarParams(listIdParamsSchema),
  manejadorAsincrono(getPublicListDetail)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN DE MIS LISTAS
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /lists:
 *   get:
 *     summary: Obtener todas las listas creadas por el usuario autenticado
 *     tags: [Listas]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", middlewareAutenticacion, manejadorAsincrono(getMyLists))

/**
 * @swagger
 * /lists:
 *   post:
 *     summary: Crear una nueva lista de películas
 *     tags: [Listas]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  middlewareAutenticacion,
  validarBody(createListSchema),
  manejadorAsincrono(createList)
)

/**
 * Obtener detalle privado de una lista propia.
 */
router.get(
  "/:id",
  middlewareAutenticacion,
  validarParams(listIdParamsSchema),
  manejadorAsincrono(getMyListDetail)
)

/**
 * Actualizar metadatos de una lista (título, descripción, privacidad).
 */
router.patch(
  "/:id",
  middlewareAutenticacion,
  validarParams(listIdParamsSchema),
  validarBody(updateListSchema),
  manejadorAsincrono(updateList)
)

/**
 * Eliminar una lista permanentemente.
 */
router.delete(
  "/:id",
  middlewareAutenticacion,
  validarParams(listIdParamsSchema),
  manejadorAsincrono(deleteList)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN DE ÍTEMS (Películas dentro de listas)
 * ---------------------------------------------------------------------------
 */

/**
 * Añadir una película a una lista de reproducción.
 */
router.post(
  "/:id/movies",
  middlewareAutenticacion,
  validarParams(listIdParamsSchema),
  validarBody(addMovieToListSchema),
  manejadorAsincrono(addMovieToList)
)

/**
 * Retirar una película de una lista específica.
 */
router.delete(
  "/:id/movies/:movie_id",
  middlewareAutenticacion,
  validarParams(listItemParamsSchema),
  manejadorAsincrono(removeMovieFromList)
)

export default router
