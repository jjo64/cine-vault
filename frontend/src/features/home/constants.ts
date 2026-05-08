import type { Zone } from "./types";

export const C = {
  bg: "#080808",
  surface: "#0D0D0D",
  elevated: "#121212",
  accent: "#D4AF37", // Oro CineVault
  accentDim: "rgba(212, 175, 55, 0.15)",
  gold: "#FFD700",
  text: "#FFFFFF",
  textSoft: "#A0A0A0",
  textMuted: "#666666",
  border: "rgba(255, 255, 255, 0.08)",
  shadow: "0 8px 32px rgba(0,0,0,0.4)",
};

export const SERIF = "'Playfair Display', serif";
export const SANS = "'Inter', sans-serif";

export const ZONES: Zone[] = [
  {
    id: "entrada",
    symbol: "✧",
    name: "La Entrada",
    subtitle: "Feed & Descubrimiento",
    desc: "Tus recomendaciones personalizadas y actividad reciente de tus seguidos.",
  },
  {
    id: "sala",
    symbol: "◈",
    name: "La Sala",
    subtitle: "Mi Colección",
    desc: "Tu Vault personal, diario de visionado y estadísticas de la semana.",
  },
  {
    id: "vitrina",
    symbol: "❖",
    name: "La Vitrina",
    subtitle: "Curaduría & Comunidad",
    desc: "Arcos editoriales, listas públicas y rankings de la comunidad.",
  },
];
