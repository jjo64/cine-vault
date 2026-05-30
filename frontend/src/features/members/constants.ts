export const C = {
  bg: "#080808",
  surface: "#111111",
  elevated: "#171717",
  border: "#222222",
  borderHover: "#383838",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  accentGlow: "rgba(212,175,122,0.09)",
  accentGlowMid: "rgba(212,175,122,0.16)",
  accentGlowStrong: "rgba(212,175,122,0.26)",
  text: "#E2E2E2",
  textSoft: "#6E6E6E",
  textMuted: "#383838",
  gold: "#C8A96E",
  adminBorder: "rgba(212,175,122,0.50)",
  editorBorder: "rgba(180,150,90,0.35)",
} as const;

export const SERIF = "'Cormorant Garamond', serif";
export const SANS = "'Syne', sans-serif";

export const ROLE_GLOW: Record<string, string> = {
  admin: "80,70,30",
  editor: "60,80,120",
  member: "60,60,90",
} as const;
