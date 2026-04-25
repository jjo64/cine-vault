/**
 * @file activity.routes.ts
 * @description Definición de rutas para el sistema de Actividad y Social Feed.
 * Permite a los usuarios visualizar un flujo de eventos (reseñas, entradas de diario, 
 * adiciones al vault) de sus amigos o de su propia actividad.
 * 
 * @note Este archivo contiene actualmente lógica de negocio pesada que será 
 * delegada a un servicio dedicado en la Fase 5 para cumplir con SOLID.
 */

import { Router } from "express"
import { getFeed } from "../controllers/ActivityController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * @swagger
 * /activity/feed:
 *   get:
 *     summary: Obtener el feed de actividad social
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 */
router.get("/feed", middlewareAutenticacion, manejadorAsincrono(getFeed))

export default router
