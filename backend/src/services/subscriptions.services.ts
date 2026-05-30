/**
 * @file subscriptions.services.ts
 * @description Capa de servicio para gestionar el estado de suscripción del usuario, entitlements y selección de pósters alternativos.
 */

import { prisma } from "../lib/prisma.js";
import { getEntitlements } from "../config/entitlements.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors/AppErrors.js";
import { stripe, mapStripeStatus } from "./payments.services.js";
import { paymentsRepository } from "../repositories/PaymentsRepository.js";

export interface PosterOption {
  key: string;
  label: string;
  url: string;
  tier: "free" | "vip" | "pro";
}

export const POSTER_OPTIONS: PosterOption[] = [
  { key: "poster_classic", label: "Classic CineVault", url: "/assets/posters/classic.jpg", tier: "free" },
  { key: "poster_neon", label: "Neon Retro", url: "/assets/posters/neon.jpg", tier: "vip" },
  { key: "poster_noir", label: "Film Noir", url: "/assets/posters/noir.jpg", tier: "vip" },
  { key: "poster_prestige", label: "Golden Prestige", url: "/assets/posters/prestige.jpg", tier: "pro" },
  { key: "poster_avantgarde", label: "Avant-Garde Art", url: "/assets/posters/avantgarde.jpg", tier: "pro" },
];

/**
 * Obtiene el estado de suscripción consolidado de un usuario.
 */
export async function getSubscriptionStatusService(userId: number) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { membership: true },
  });

  if (!user) {
    throw new NotFoundError("Usuario no encontrado");
  }

  let latestSub = await prisma.subscriptions.findFirst({
    where: { user_id: userId },
    orderBy: { id: "desc" },
  });

  // Sincronizar en tiempo real con Stripe si existe ID de suscripción
  if (latestSub && latestSub.provider_subscription_id) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(latestSub.provider_subscription_id) as any;
      if (stripeSub) {
        let status = mapStripeStatus(stripeSub.status);
        if (stripeSub.cancel_at_period_end && status === "active") {
          status = "cancelled";
        }

        // Si el estado en Stripe difiere del local, sincronizar en DB
        if (latestSub.status !== status) {
          if (stripeSub.status === "canceled") {
            // Cancelación definitiva o expiración total
            await paymentsRepository.cancelSubscription(latestSub.provider_subscription_id);
          } else {
            // Actualización de estado (ej. cancelada en periodo de gracia, o reactivada)
            const endDate = stripeSub.current_period_end
              ? new Date(stripeSub.current_period_end * 1000)
              : undefined;
            await paymentsRepository.updateSubscriptionStatus(
              latestSub.provider_subscription_id,
              status,
              endDate
            );
          }

          // Volver a consultar la suscripción actualizada para devolver los datos reales
          latestSub = await prisma.subscriptions.findFirst({
            where: { user_id: userId },
            orderBy: { id: "desc" },
          });
        }
      }
    } catch (err) {
      console.error("Error al sincronizar con Stripe en tiempo real:", err);
    }
  }

  // Volver a consultar el usuario (por si cancelSubscription degradó el membership a 'free')
  const updatedUser = await prisma.users.findUnique({
    where: { id: userId },
    select: { membership: true },
  }) || user;

  const entitlements = getEntitlements(updatedUser.membership);

  // Contar uso actual de videos y clips fijados
  const videoCount = await prisma.vault_videos.count({
    where: { user_id: userId },
  });
  const pinnedClipCount = await prisma.vault_clips.count({
    where: { user_id: userId, pinned: true },
  });

  return {
    membership: user.membership || "free",
    status: latestSub?.status || "expired",
    end_date: latestSub?.end_date || null,
    entitlements,
    usage: {
      videos: videoCount,
      pinned_clips: pinnedClipCount,
    },
  };
}

/**
 * Obtiene las opciones de pósters alternativos.
 */
export async function getPosterOptionsService() {
  return POSTER_OPTIONS;
}

/**
 * Guarda la selección del póster alternativo.
 */
export async function selectPosterService(userId: number, posterKey: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { membership: true },
  });

  if (!user) {
    throw new NotFoundError("Usuario no encontrado");
  }

  const option = POSTER_OPTIONS.find((o) => o.key === posterKey);
  if (!option) {
    throw new ValidationError("Póster alternativo no válido");
  }

  const userMembership = user.membership || "free";

  // Validar nivel de acceso
  if (option.tier === "vip" && userMembership === "free") {
    throw new ForbiddenError("El póster seleccionado es exclusivo para miembros VIP o PRO");
  }
  if (option.tier === "pro" && userMembership !== "pro") {
    throw new ForbiddenError("El póster seleccionado es exclusivo para miembros PRO");
  }

  await prisma.users.update({
    where: { id: userId },
    data: { selected_poster_key: posterKey },
  });

  return { selected_poster_key: posterKey };
}
