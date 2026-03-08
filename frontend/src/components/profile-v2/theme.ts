export const C = {
  bg: '#080808',
  surface: '#111111',
  elevated: '#1a1a1a',
  border: '#2a2a2a',
  accent: '#D4AF7A',
  accentDim: '#9A7A48',
  accentGlow: 'rgba(212,175,122,0.12)',
  text: '#E2E2E2',
  textSoft: '#7a7a7a',
  textMuted: '#3f3f3f',
  gold: '#C8A96E',
} as const

export const SERIF = "'Cormorant Garamond', serif"
export const SANS = "'Syne', sans-serif"

export const textClampOneLine = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const

export const inputButtonReset = {
  border: 'none',
  background: 'none',
  cursor: 'pointer',
} as const
