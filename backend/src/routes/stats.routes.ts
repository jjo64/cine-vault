/**
 * @file stats.routes.ts
 * @description Rutas para las estadísticas avanzadas y exportación de historiales.
 */

import { Router } from "express";
import { getAdvancedStats, exportStats } from "../controllers/StatsController.js";
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js";
import { manejadorAsincrono } from "../middlewares/error.middlewares.js";
import { limitarSpikesIP } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.get("/advanced", middlewareAutenticacion, manejadorAsincrono(getAdvancedStats));
router.get("/export", middlewareAutenticacion, limitarSpikesIP, manejadorAsincrono(exportStats));

export default router;
