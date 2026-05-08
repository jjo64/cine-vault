export const C = {
  bg: "#080808",
  surface: "#111111",
  elevated: "#181818",
  border: "#232323",
  borderHover: "#3a3a3a",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  accentGlow: "rgba(212,175,122,0.10)",
  accentGlowStrong: "rgba(212,175,122,0.22)",
  text: "#E2E2E2",
  textSoft: "#727272",
  textMuted: "#3C3C3C",
  gold: "#C8A96E",
} as const;

export const SERIF = "'Cormorant Garamond', serif";
export const SANS = "'Syne', sans-serif";

export const GENRE_OPTIONS = [
  "Drama",
  "Sci-fi",
  "Romance",
  "Thriller",
  "Horror",
  "Slow cinema",
  "Experimental",
  "Documental",
  "Bélica",
  "Histórica",
  "Minimalismo",
  "Neo-noir",
];

export const COUNTRY_OPTIONS = [
  "EE.UU.",
  "Francia",
  "Italia",
  "Suecia",
  "URSS",
  "Hong Kong",
  "Japón",
  "Bélgica",
  "Reino Unido",
  "Corea del Sur",
];

export const YEAR_RANGES = [
  { label: "Antes de 1960", from: 1900, to: 1959 },
  { label: "1960–1979", from: 1960, to: 1979 },
  { label: "1980–1999", from: 1980, to: 1999 },
  { label: "2000–2015", from: 2000, to: 2015 },
  { label: "2016–hoy", from: 2016, to: 2099 },
];

export const SORT_OPTIONS = [
  { id: "rating", label: "Mejor valoradas" },
  { id: "recent", label: "Más recientes" },
  { id: "discussed", label: "Más comentadas" },
  { id: "alpha", label: "Alfabético (A–Z)" },
];
