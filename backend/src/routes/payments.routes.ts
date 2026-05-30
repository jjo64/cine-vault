/**
 * @file payments.routes.ts
 * @description Pasarela de pagos e integración con Stripe.
 * Gestiona la creación de sesiones de pago (Checkout), el portal de autoservicio
 * para el cliente y el procesamiento de notificaciones asíncronas vía Webhooks.
 */

import { Router } from "express"
import {
  createCheckoutSession,
  createPortalSession,
  stripeWebhook,
  syncCheckoutSession,
  reactivateSubscription,
} from "../controllers/PaymentsController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

/**
 * @swagger
 * tags:
 *   name: Pagos
 *   description: Facturación y suscripciones PRO/VIP a través de Stripe
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: FLUJO DE SUSCRIPCIÓN (Privado)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /payments/create-checkout-session:
 *   post:
 *     summary: Iniciar proceso de pago para un plan específico
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/create-checkout-session",
  middlewareAutenticacion,
  manejadorAsincrono(createCheckoutSession)
)

/**
 * Acceso al portal de facturación de Stripe para gestionar suscripciones activas.
 */
router.post(
  "/portal-session",
  middlewareAutenticacion,
  manejadorAsincrono(createPortalSession)
)

/**
 * Sincroniza de forma inmediata una sesión de checkout completada.
 */
router.post(
  "/sync-session",
  middlewareAutenticacion,
  manejadorAsincrono(syncCheckoutSession)
)

/**
 * Reactiva una suscripción cancelada dentro del periodo de gracia.
 */
router.post(
  "/reactivate-subscription",
  middlewareAutenticacion,
  manejadorAsincrono(reactivateSubscription)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: SISTEMA (Webhooks)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Receptor de eventos asíncronos de Stripe
 *     tags: [Pagos]
 */
router.post("/webhook", manejadorAsincrono(stripeWebhook))

export default router
