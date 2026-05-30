/**
 * @file SubscriptionsController.ts
 * @description Controlador para gestionar el estado de suscripción, entitlements y pósters alternativos.
 */

import { Request, Response } from "express";
import * as subscriptionsService from "../services/subscriptions.services.js";

/**
 * Obtiene el estado de suscripción de la sesión del usuario.
 */
export async function getMySubscription(req: Request, res: Response) {
  const result = await subscriptionsService.getSubscriptionStatusService(req.user!.user_id);
  res.json(result);
}

/**
 * Obtiene la lista de pósters alternativos y su requerimiento de nivel.
 */
export async function getPosterOptions(req: Request, res: Response) {
  const options = await subscriptionsService.getPosterOptionsService();
  res.json({ options });
}

/**
 * Selecciona un póster alternativo.
 */
export async function selectPoster(req: Request, res: Response) {
  const { poster_key } = req.body;
  if (!poster_key) {
    return res.status(400).json({ error: "poster_key es requerido" });
  }

  const result = await subscriptionsService.selectPosterService(req.user!.user_id, poster_key);
  res.json(result);
}
