import type { FiltersState } from "./types";

export const C = {
  bg: "#080808",
  surface: "#111111",
  elevated: "#1A1A1A",
  border: "#252525",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  accentGlow: "rgba(212,175,122,0.10)",
  text: "#FFFFFF",
  textSoft: "#B0B0B0",
  textMuted: "#888888",
  gold: "#C8A96E",
} as const;

export const SERIF = "'Cormorant Garamond', serif";
export const SANS = "'Syne', sans-serif";
export const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

export const GENRES = [
  "Drama",
  "Sci-fi",
  "Romance",
  "Thriller",
  "Horror",
  "Documental",
  "Comedia",
  "Animación",
  "Bélica",
  "Histórica",
  "Slow cinema",
  "Experimental",
];

export const COUNTRIES = [
  "Francia",
  "Italia",
  "EE.UU.",
  "Japón",
  "Corea del Sur",
  "Alemania",
  "España",
  "Argentina",
  "URSS/Rusia",
  "Reino Unido",
  "Hong Kong",
  "Suecia",
];

export const DURATIONS = [
  { label: "Corta", sub: "<90 min", key: "short" },
  { label: "Media", sub: "90–130 min", key: "medium" },
  { label: "Larga", sub: "130–180 min", key: "long" },
  { label: "Épica", sub: ">3 horas", key: "epic" },
];

export const SPECIAL_FILTERS = [
  { key: "pendientes" as const, label: "Solo mis pendientes" },
  { key: "palmares" as const, label: "Palmarés (Cannes / Venecia)" },
  { key: "noVistas" as const, label: "No vistas todavía" },
];

export const TABS_CONFIG = [
  { key: "all", label: "Todo", iconName: "film" },
  { key: "film", label: "Películas", iconName: "film" },
  { key: "tv", label: "Series", iconName: "film" },
  { key: "person", label: "Personas", iconName: "user" },
  { key: "user", label: "Usuarios", iconName: "user" },
] as const;

export const EMPTY_FILTERS: FiltersState = {
  genres: [],
  yearFrom: "",
  yearTo: "",
  countries: [],
  minRating: 0,
  duration: null,
  pendientes: false,
  palmares: false,
  noVistas: false,
};
