/**
 * @file subscriptionServices.ts
 * @description Servicios frontend para interactuar con los endpoints de pagos, suscripciones y estadísticas.
 */

import { authorizedJson, authorizedFetch } from "./authServices";

export interface SubscriptionStatus {
  membership: "free" | "vip" | "pro";
  status: "active" | "expired" | "cancelled";
  end_date: string | null;
  entitlements: {
    max_videos: number;
    max_pinned_clips: number;
    poster_alt_level: "none" | "half" | "all";
    reviews_critical: boolean;
    points_multiplier: number;
  };
  usage: {
    videos: number;
    pinned_clips: number;
  };
}

export interface PosterOption {
  key: string;
  label: string;
  url: string;
  tier: "free" | "vip" | "pro";
}

export interface AdvancedStats {
  total_watched: number;
  racha_cinefila_dias: number;
  comparativa_promedio: {
    usuario: number;
    plataforma: number;
  };
  top_genres: Array<{ name: string; count: number }>;
  top_directors: Array<{ name: string; count: number }>;
  decades: Array<{ name: string; count: number }>;
  countries: Array<{ name: string; count: number }>;
}

export interface VaultVideo {
  id: number;
  title: string;
  video_url: string;
  duration_sec?: number;
  cover_url?: string;
  is_public: boolean;
}

export interface VaultClip {
  id: number;
  title: string;
  clip_url: string;
  cover_url?: string;
  is_public: boolean;
  pinned: boolean;
}

/**
 * Obtiene el estado actual de suscripción del usuario.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return authorizedJson<SubscriptionStatus>("/api/subscriptions/me");
}

/**
 * Obtiene las opciones de pósters alternativos.
 */
export async function getPosterOptions(): Promise<{ options: PosterOption[] }> {
  return authorizedJson<{ options: PosterOption[] }>("/api/users/posters/options");
}

/**
 * Guarda el póster alternativo seleccionado.
 */
export async function selectPoster(posterKey: string): Promise<{ selected_poster_key: string }> {
  return authorizedJson<{ selected_poster_key: string }>("/api/users/posters/selection", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ poster_key: posterKey }),
  });
}

/**
 * Inicia la sesión de checkout de Stripe para un plan específico.
 */
export async function createCheckoutSession(plan: "vip" | "pro"): Promise<{ url: string }> {
  // Nota: El backend redirige o devuelve la URL
  // Si devuelve la URL como texto plano o JSON, lo manejamos.
  // El endpoint /create-checkout-session del PaymentsController del backend devuelve text/html o redirección,
  // pero el servicio devuelve la URL. Veamos cómo responde el controller.
  const res = await authorizedFetch("/api/payments/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }), // El controlador suele leer de req.body.plan
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  // Si responde con JSON que contiene la URL
  try {
    const data = await res.json();
    return data;
  } catch {
    // Si responde directamente con la URL
    const url = await res.text();
    return { url };
  }
}

/**
 * Abre el portal de facturación de Stripe.
 */
export async function createPortalSession(): Promise<{ url: string }> {
  const res = await authorizedFetch("/api/payments/portal-session", {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  try {
    const data = await res.json();
    return data;
  } catch {
    const url = await res.text();
    return { url };
  }
}

/**
 * Reactiva una suscripción cancelada dentro del periodo de gracia.
 */
export async function reactivateSubscription(): Promise<{ message: string }> {
  const res = await authorizedFetch("/api/payments/reactivate-subscription", {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/**
 * Sincroniza la sesión de checkout en el backend para activar la suscripción inmediatamente.
 */
export async function syncCheckoutSession(sessionId: string): Promise<{ status: string; membership: string }> {
  const res = await authorizedFetch("/api/payments/sync-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/**
 * Obtiene estadísticas avanzadas.
 */
export async function getAdvancedStats(filters?: { from?: string; to?: string; media_type?: "movie" | "tv" }): Promise<AdvancedStats> {
  const params = new URLSearchParams();
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  if (filters?.media_type) params.set("media_type", filters.media_type);

  return authorizedJson<AdvancedStats>(`/api/stats/advanced?${params.toString()}`);
}

/**
 * Descarga las estadísticas exportadas.
 */
export async function exportStats(format: "csv" | "json", filters?: { from?: string; to?: string }) {
  const params = new URLSearchParams();
  params.set("format", format);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);

  // Realizar fetch para validar token e iniciar la descarga
  const res = await authorizedFetch(`/api/stats/export?${params.toString()}`);
  if (!res.ok) {
    throw new Error("No se pudo iniciar la exportación de datos");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cinevault-export.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Completa una recomendación y liquida puntos.
 */
export async function completeRecommendation(data: {
  recommendation_id: string;
  media_id: number;
  media_type: "movie" | "tv";
}) {
  return authorizedJson("/api/recommendations/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/**
 * Sube un video al Vault.
 */
export async function addVaultVideo(data: {
  title: string;
  movie_id?: number;
  media_type?: "movie" | "tv";
  video_url: string;
  duration_sec?: number;
  cover_url?: string;
  is_public?: boolean;
}): Promise<VaultVideo> {
  return authorizedJson<VaultVideo>("/api/vault/media/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/**
 * Elimina un video del Vault.
 */
export async function deleteVaultVideo(videoId: number): Promise<void> {
  await authorizedJson(`/api/vault/media/videos/${videoId}`, {
    method: "DELETE",
  });
}

/**
 * Sube un clip al Vault.
 */
export async function addVaultClip(data: {
  title: string;
  movie_id?: number;
  media_type?: "movie" | "tv";
  clip_url: string;
  cover_url?: string;
  is_public?: boolean;
}): Promise<VaultClip> {
  return authorizedJson<VaultClip>("/api/vault/media/clips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/**
 * Fija o desfija un clip de video.
 */
export async function pinVaultClip(clipId: number, pinned: boolean): Promise<VaultClip> {
  return authorizedJson<VaultClip>(`/api/vault/media/clips/${clipId}/pin`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pinned }),
  });
}
