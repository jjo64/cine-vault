export const C = {
  bg: "#080808",
  surface: "#111111",
  elevated: "#1A1A1A",
  border: "#252525",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  accentGlow: "rgba(212,175,122,0.10)",
  accentGlowStrong: "rgba(212,175,122,0.18)",
  text: "#E2E2E2",
  textSoft: "#A1A1A1",
  textMuted: "#B0B0B0",
  gold: "#C8A96E",
} as const;
export const SERIF = "'Cormorant Garamond', serif";
export const SANS = "'Syne', sans-serif";

export const TMDB_POSTER = "https://image.tmdb.org/t/p/w500";
export const TMDB_THUMB = "https://image.tmdb.org/t/p/w300";
export const TMDB_BASE = "https://image.tmdb.org/t/p/";
export const SIZES = {
  BACKDROP: "w1280", // En lugar de 'original'
  POSTER: "w342", // Tamaño óptimo para el poster lateral
  STILL: "w780", // Para la galería de imágenes
  PROFILE: "w185", // Para el reparto (Cast)
};

export function tmdbImg(path?: string | null, size = SIZES.BACKDROP) {
  return path ? `${TMDB_BASE}${size}${path}` : "";
}
