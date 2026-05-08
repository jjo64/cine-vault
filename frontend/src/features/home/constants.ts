import type { Zone } from "./types";

export const C = {
  bg: "#080808",
  surface: "#0D0D0D",
  elevated: "#121212",
  accent: "#d4af7a", // Oro CineVault más sobrio
  accentDim: "rgba(212, 175, 122, 0.12)",
  gold: "#c8a96e",
  text: "#e2e2e2",
  textSoft: "#8a8a8a",
  textMuted: "#6e6e6e",
  border: "rgba(255, 255, 255, 0.08)",
  shadow: "0 8px 32px rgba(0,0,0,0.4)",
};

export const SERIF = "'Cormorant Garamond', serif";
export const SANS = "'Syne', sans-serif";

export const ZONES: Zone[] = [
  {
    id: "entrada",
    symbol: "◈",
    name: "La Entrada",
    subtitle: "DESCUBRIMIENTO · RETO NOCTURNO · FEED",
    desc: "Tus recomendaciones personalizadas y actividad reciente de tus seguidos.",
  },
  {
    id: "sala",
    symbol: "◫",
    name: "Tu Sala",
    subtitle: "VAULT · DIARIO · PROGRESO",
    desc: "Tu Vault personal, diario de visionado y estadísticas de la semana.",
  },
  {
    id: "vitrina",
    symbol: "◳",
    name: "La Vitrina",
    subtitle: "BUSCAR · DIRECTORES · LISTAS",
    desc: "Arcos editoriales, listas públicas y rankings de la comunidad.",
  },
];
