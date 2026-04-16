import { createSlug } from '../../utils/stringUtils'
import type { CreditItem, CrewTab, PersonDetail, PersonStats } from './types'

export function toPoster(path?: string | null, size: 'w500' | 'original' = 'w500') {
  if (!path) return '/no-poster.svg'
  return `https://image.tmdb.org/t/p/${size}${path}`
}

export function getCreditTitle(item: CreditItem) {
  return item.title || item.name || 'Sin título'
}

export function getCreditDate(item: CreditItem) {
  return item.release_date || item.first_air_date || null
}

export function getCreditYear(item: CreditItem) {
  const value = getCreditDate(item)
  if (!value) return null
  const parsed = Number.parseInt(value.slice(0, 4), 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function movieHref(item: CreditItem) {
  const title = getCreditTitle(item)
  return `/movie/${item.id}-${createSlug(title)}`
}

export function buildAwards(person: PersonDetail, knownFor: CreditItem[]) {
  const items = knownFor.slice(0, 4).map((item) => {
    const year = getCreditYear(item)
    return `${year || '-'} · ${getCreditTitle(item)}`
  })

  if (items.length > 0) return items

  return [
    `Popularidad TMDB: ${Math.round(person.popularity || 0)}`,
    'Sin premios registrados en esta fuente',
  ]
}

export function getDecades(items: CreditItem[]) {
  const years = items
    .map((item) => getCreditYear(item))
    .filter((year): year is number => Number.isFinite(year))

  if (years.length === 0) return ['Todo']

  const unique = Array.from(
    new Set(years.map((year) => `${Math.floor(year / 10) * 10}s`))
  )

  return ['Todo', ...unique.sort((a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10))]
}

export function filterByDecade(items: CreditItem[], decade: string) {
  if (decade === 'Todo') return items
  const base = Number.parseInt(decade, 10)
  if (!Number.isFinite(base)) return items
  return items.filter((item) => {
    const year = getCreditYear(item)
    return year !== null && year >= base && year < base + 10
  })
}

export function roleFromCrew(item: CreditItem) {
  return item.job || item.department || 'Crew'
}

export function splitCrew(items: CreditItem[]) {
  return {
    director: items.filter((item) => (item.job || '').toLowerCase() === 'director'),
    writer: items.filter((item) => {
      const job = (item.job || '').toLowerCase()
      return job.includes('writer') || job.includes('screenplay') || job.includes('story') || job.includes('novel')
    }),
    producer: items.filter((item) => {
      const job = (item.job || '').toLowerCase()
      return job.includes('producer')
    }),
  } as Record<CrewTab, CreditItem[]>
}

export function getBiographyParagraphs(rawText?: string) {
  const text = (rawText || '').trim()
  if (!text) return ['Biografía no disponible para esta persona.']
  const parts = text.split(/\r?\n\r?\n/).filter(Boolean)
  return parts.length > 0 ? parts : [text]
}

export function computeStats(personPopularity: number | undefined, knownFor: CreditItem[], castCount: number, crewCount: number): PersonStats {
  const totalFilms = knownFor.length
  const avgRating = totalFilms > 0
    ? knownFor.reduce((acc, item) => acc + Number(item.vote_average || 0), 0) / totalFilms
    : 0

  return {
    fans: Math.round((personPopularity || 0) * 100),
    watchlists: castCount * 220 + crewCount * 260,
    avgRating: avgRating || 0,
    totalFilms,
  }
}
