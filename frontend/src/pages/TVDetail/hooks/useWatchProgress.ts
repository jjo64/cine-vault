import { useMemo } from 'react'

// Genera la key canónica de un episodio
export function episodeKey(seasonNum: number, episodeNum: number): string {
  return `s${seasonNum}e${episodeNum}`
}

// Calcula cuántos episodios de una temporada están vistos y el porcentaje
export function useSeasonProgress(
  watchedIds: Set<string>,
  activeSeason: number,
  episodes: { episode_number?: number | null }[],
  episodeCount: number | null | undefined
) {
  const watched = useMemo(
    () => episodes.filter(e => watchedIds.has(episodeKey(activeSeason, e.episode_number ?? 0))).length,
    [watchedIds, activeSeason, episodes]
  )

  const pct = useMemo(
    () => episodeCount && episodeCount > 0 ? Math.round((watched / episodeCount) * 100) : 0,
    [watched, episodeCount]
  )

  return { watched, pct }
}

// Togglea un episodio dentro del Set
export function toggleEpisode(
  prev: Set<string>,
  seasonNum: number,
  episodeNum: number
): Set<string> {
  const next = new Set(prev)
  const key = episodeKey(seasonNum, episodeNum)
  next.has(key) ? next.delete(key) : next.add(key)
  return next
}
