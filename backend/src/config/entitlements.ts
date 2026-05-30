/**
 * @file entitlements.ts
 * @description Matriz de beneficios y límites centralizada según el nivel de membresía del usuario.
 */

export interface Entitlements {
  max_videos: number;
  max_pinned_clips: number;
  poster_alt_level: "none" | "half" | "all";
  reviews_critical: boolean;
  points_multiplier: number;
}

const MATRIZ_ENTITLEMENTS: Record<string, Entitlements> = {
  free: {
    max_videos: 0,
    max_pinned_clips: 0,
    poster_alt_level: "none",
    reviews_critical: false,
    points_multiplier: 1.0,
  },
  vip: {
    max_videos: 2,
    max_pinned_clips: 2,
    poster_alt_level: "half",
    reviews_critical: true,
    points_multiplier: 1.25,
  },
  pro: {
    max_videos: 4,
    max_pinned_clips: 4,
    poster_alt_level: "all",
    reviews_critical: true,
    points_multiplier: 1.75,
  },
};

/**
 * Obtiene los entitlements correspondientes a un nivel de membresía.
 *
 * @param membership Nivel de membresía del usuario (free, vip, pro).
 * @returns Matriz de beneficios cuantitativos y cualitativos.
 */
export function getEntitlements(membership?: string | null): Entitlements {
  const key = String(membership || "free").toLowerCase();
  return MATRIZ_ENTITLEMENTS[key] || MATRIZ_ENTITLEMENTS.free;
}
