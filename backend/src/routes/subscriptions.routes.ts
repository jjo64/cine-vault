/**
 * @file subscriptions.routes.ts
 * @description Rutas para el estado de suscripción y beneficios del usuario.
 */

import { Router } from "express";
import { getMySubscription } from "../controllers/SubscriptionsController.js";
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js";
import { manejadorAsincrono } from "../middlewares/error.middlewares.js";

const router = Router();

router.get("/me", middlewareAutenticacion, manejadorAsincrono(getMySubscription));

export default router;
