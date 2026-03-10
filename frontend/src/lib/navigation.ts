export const COMING_SOON_SECTIONS = new Set([
  'films',
  'members',
  'journal',
  'diary',
  'reviews',
  'watchlist',
])

const navMap: Record<string, string> = {
  films: '/films',
  listas: '/lists',
  lists: '/lists',
  members: '/members',
  miembros: '/members',
  journal: '/journal',
  diary: '/journal',
  profile: '/profile',
  home: '/',
  settings: '/settings',
  search: '/search',
}

const normalize = (label: string) => label.trim().toLowerCase()

export const isAuthActionLabel = (label: string) => {
  const key = normalize(label)
  return key === 'sign in' || key === 'create account'
}

export const resolveNavPath = (label: string) => {
  const key = normalize(label)
  return navMap[key] ?? null
}

export const toComingSoonPath = (section: string) => {
  const safe = normalize(section)
  return `/coming-soon/${encodeURIComponent(safe)}`
}

export const resolveNavPathWithFallback = (label: string) => {
  const path = resolveNavPath(label)
  if (!path) return '/'

  const section = path.replace(/^\//, '')
  if (COMING_SOON_SECTIONS.has(section)) {
    return toComingSoonPath(section)
  }

  return path
}
