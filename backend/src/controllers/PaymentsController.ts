/**
 * @file PaymentsController.ts
 * @description Controlador para la gestión de suscripciones y transacciones comerciales.
 * Maneja el flujo de pagos mediante Stripe, incluyendo la creación de sesiones de
 * checkout, portales de autoservicio y la recepción de webhooks de red.
 */

import { Request, Response } from "express"
import {
  createCheckoutSessionService,
  createPortalSessionService,
  processWebhookEventService,
  syncCheckoutSessionService,
  reactivateSubscriptionService,
} from "../services/payments.services.js"

/**
 * Inicia una nueva sesión de pago para la adquisición de planes premium.
 */
export const createCheckoutSession = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  const { plan } = req.body
  const url = await createCheckoutSessionService(Number(userId), plan)
  res.json({ url })
}

/**
 * Genera un enlace al portal de gestión de suscripciones del usuario.
 */
export const createPortalSession = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  const url = await createPortalSessionService(Number(userId))
  res.json({ url })
}

/**
 * Sincroniza y activa de forma inmediata el plan de una sesión de checkout completada.
 */
export const syncCheckoutSession = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  const { sessionId } = req.body

  if (!sessionId) {
    res.status(400).json({ error: "sessionId es requerido" })
    return
  }

  const result = await syncCheckoutSessionService(Number(userId), sessionId)
  res.json(result)
}

/**
 * Punto de entrada para los eventos asíncronos (Webhooks) de Stripe.
 */
export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string
  await processWebhookEventService(req.body as unknown as Buffer, sig)
  res.json({ received: true })
}

/**
 * Reactiva una suscripción cancelada dentro del periodo de gracia.
 */
export const reactivateSubscription = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  await reactivateSubscriptionService(Number(userId))
  res.json({ message: "Suscripción reactivada correctamente" })
}
