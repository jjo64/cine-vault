/**
 * @file recommendation.services.ts
 * @description Capa de servicios para el motor de recomendaciones de CineVault.
 *
 * ARQUITECTURA DEL MOTOR (v2):
 * ──────────────────────────────────────────────────────────────
 * 1. getPersonalizedFeed:
 *    - Extrae semillas del historial (Diario > Reseñas > Vault).
 *    - Llama a TMDB /recommendations por cada semilla.
 *    - USA el affinity_vector del user_taste_profiles para REORDENAR y FILTRAR resultados.
 *    - Veta géneros con penalización de -50 en la puntuación.
 *    - Boost de afinidad proporcional a los géneros de cada candidato.
 *
 * 2. getTonightMovie:
 *    - Obtiene candidatos desde historial o TMDB top_rated.
 *    - Aplica la misma lógica de affinity_vector + vetoedGenres.
 *    - Considera hora local y clima para pesos adicionales.
 *    - weather_history del taste profile refuerza las preferencias contextuales.
 *
 * 3. getOnboardingMovies: rotación variada para el flujo Tinder.
 *
 * 4. saveExplicitInteraction: registra y actualiza el taste profile en tiempo real.
 */

import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { prisma } from "../lib/prisma.js"

// ══════════════════════════════════════════════════════════════════════════════
//  MAPA TMDB genre_id → nombre en inglés (coincide con las claves del affinity_vector)
// ══════════════════════════════════════════════════════════════════════════════

const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
}

// ══════════════════════════════════════════════════════════════════════════════
//  TIPOS
// ══════════════════════════════════════════════════════════════════════════════

export type RecommendationItem =
  | {
      id: string
      type: "media"
      media: {
        id: number
        title: string
        year: number | null
        poster_path: string | null
        vote_average: number
        reason: string
        media_type: "movie" | "tv"
        affinity_score?: number
      }
    }
  | {
      id: string
      type: "review"
      review: {
        id: number
        content: string | null
        rating: number | null
        mode: string
        created_at: string
      }
      user: { id: number; username: string; avatar_url: string | null }
      media: { id: number; tmdb_id: number; media_type: "movie" | "tv" }
    }

const curatedFallbackDirectors = [
  { name: "Chantal Akerman", reason: "Cine de observación y riesgo formal" },
  { name: "Andrei Tarkovsky", reason: "Poesía visual y tempo contemplativo" },
  { name: "Agnès Varda", reason: "Mirada íntima y documental sensible" },
  { name: "Apichatpong Weerasethakul", reason: "Narrativas hipnóticas y sensoriales" },
]

// ══════════════════════════════════════════════════════════════════════════════
//  UTILIDADES DE PUNTUACIÓN POR AFINIDAD
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calcula el boost de afinidad de un candidato TMDB contra el affinity_vector
 * del usuario. Si el candidato tiene algún género vetado, devuelve -50.
 *
 * @param genreIds       Array de genre_ids de TMDB del candidato
 * @param affinityVector Mapa { "Drama": 1.9, "Crime": 1.7, ... }
 * @param vetoedIds      Array de TMDB genre_ids vetados como strings ["28", "12"]
 */
function calcAffinityBoost(
  genreIds: number[] | undefined,
  affinityVector: Record<string, number>,
  vetoedIds: string[]
): number {
  if (!genreIds || genreIds.length === 0) return 0

  // Veto — penalización mortal
  if (vetoedIds.length > 0) {
    const hasVeto = genreIds.some((id) => vetoedIds.includes(id.toString()))
    if (hasVeto) return -50
  }

  // Suma de afinidades por género
  return genreIds.reduce((sum, genreId) => {
    const genreName = TMDB_GENRE_MAP[genreId]
    return sum + (genreName ? (affinityVector[genreName] ?? 0) : 0)
  }, 0)
}

/**
 * Extrae el taste profile del usuario y normaliza sus estructuras JSON.
 */
async function getUserTasteProfile(userId: number) {
  const profile = await prisma.user_taste_profiles.findUnique({
    where: { user_id: userId },
  })

  if (!profile) {
    return { affinityVector: {} as Record<string, number>, vetoedGenreIds: [] as string[], weatherHistory: {} as Record<string, string[]> }
  }

  const affinityVector: Record<string, number> =
    profile.affinity_vector
      ? (typeof profile.affinity_vector === "string"
          ? JSON.parse(profile.affinity_vector)
          : profile.affinity_vector) as Record<string, number>
      : {}

  const vetoedEntities: { genres?: string[]; directors?: string[] } =
    profile.vetoed_entities
      ? (typeof profile.vetoed_entities === "string"
          ? JSON.parse(profile.vetoed_entities)
          : profile.vetoed_entities) as { genres?: string[]; directors?: string[] }
      : {}

  const weatherHistory: Record<string, string[]> =
    profile.weather_history
      ? (typeof profile.weather_history === "string"
          ? JSON.parse(profile.weather_history)
          : profile.weather_history) as Record<string, string[]>
      : {}

  return {
    affinityVector,
    vetoedGenreIds: vetoedEntities.genres ?? [],
    weatherHistory,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  1. FEED PERSONALIZADO
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Genera un feed de recomendaciones personalizadas usando historial + taste profile.
 */
export const getPersonalizedFeed = async (
  viewerId: number,
  page: number,
  limit: number
) => {
  // ── A. Cargar taste profile ──
  const { affinityVector, vetoedGenreIds } = await getUserTasteProfile(viewerId)

  // ── B. Extraer semillas del historial (Diario > Reseñas > Vault) ──
  const [vaultEntries, diaryEntries, ownReviews] = await Promise.all([
    prisma.vault.findMany({
      where: { user_id: viewerId },
      orderBy: { added_at: "desc" },
      take: 12,
      include: { movies_ref: { select: { id: true, tmdb_id: true, media_type: true } } },
    }),
    prisma.diary_entries.findMany({
      where: { user_id: viewerId },
      orderBy: { watched_date: "desc" },
      take: 12,
      include: { movies_ref: { select: { id: true, tmdb_id: true, media_type: true } } },
    }),
    prisma.reviews.findMany({
      where: { user_id: viewerId },
      orderBy: { created_at: "desc" },
      take: 12,
      include: { movies_ref: { select: { id: true, tmdb_id: true, media_type: true } } },
    }),
  ])

  // Combinar semillas con priorización (sin duplicados)
  const seedMap = new Map<string, { tmdb_id: number; media_type: string; recency_score: number }>()

  diaryEntries.forEach((e, idx) => {
    const key = `${e.movies_ref.media_type}-${e.movies_ref.tmdb_id}`
    if (!seedMap.has(key))
      seedMap.set(key, { tmdb_id: e.movies_ref.tmdb_id, media_type: e.movies_ref.media_type, recency_score: 100 - idx })
  })
  ownReviews.forEach((e, idx) => {
    const key = `${e.movies_ref.media_type}-${e.movies_ref.tmdb_id}`
    if (!seedMap.has(key))
      seedMap.set(key, { tmdb_id: e.movies_ref.tmdb_id, media_type: e.movies_ref.media_type, recency_score: 90 - idx })
  })
  vaultEntries.forEach((e, idx) => {
    const key = `${e.movies_ref.media_type}-${e.movies_ref.tmdb_id}`
    if (!seedMap.has(key))
      seedMap.set(key, { tmdb_id: e.movies_ref.tmdb_id, media_type: e.movies_ref.media_type, recency_score: 80 - idx })
  })

  // Mezcla balanceada: 4 más recientes + 4 aleatorias del resto
  const allSeeds = Array.from(seedMap.values()).sort((a, b) => b.recency_score - a.recency_score)
  const seeds = [...allSeeds.slice(0, 4), ...allSeeds.slice(4).sort(() => Math.random() - 0.5).slice(0, 4)]

  // ── C. Obtener candidatos de TMDB ──
  let rawCandidates: any[] = []

  if (seeds.length > 0) {
    const results = await Promise.all(
      seeds.map(async (seed) => {
        try {
          const path = seed.media_type === "movie"
            ? `movie/${seed.tmdb_id}/recommendations`
            : `tv/${seed.tmdb_id}/recommendations`
          const data = (await consultarTMDB(path, { page: "1" })) as any
          return (data.results ?? []).map((i: any) => ({
            ...i,
            _source_media_type: seed.media_type,
          }))
        } catch {
          return []
        }
      })
    )
    rawCandidates = results.flat()
  } else {
    // Fallback: populares
    const [popularMovies, popularTV] = (await Promise.all([
      consultarTMDB("movie/popular", { page: "1", region: "ES" }),
      consultarTMDB("tv/popular", { page: "1" }),
    ])) as any[]

    rawCandidates = [
      ...(popularMovies.results ?? []).slice(0, 10).map((i: any) => ({ ...i, _source_media_type: "movie" })),
      ...(popularTV.results ?? []).slice(0, 10).map((i: any) => ({ ...i, _source_media_type: "tv" })),
    ]
  }

  // ── D. Deduplicar + puntuar por afinidad ──
  const seenIds = new Set<string>()
  const scoredCandidates: Array<{ item: any; score: number }> = []

  for (const item of rawCandidates) {
    const key = `${item._source_media_type}-${item.id}`
    if (seenIds.has(key) || !item.poster_path) continue
    seenIds.add(key)

    const affinityBoost = calcAffinityBoost(item.genre_ids, affinityVector, vetoedGenreIds)
    if (affinityBoost === -50) continue // vetoado — omitir

    const baseScore = Number(item.vote_average ?? 0)
    scoredCandidates.push({ item, score: baseScore + affinityBoost })
  }

  // ── E. Ordenar por puntuación de gusto (descendente) ──
  scoredCandidates.sort((a, b) => b.score - a.score)

  const recommendedMedia: RecommendationItem[] = scoredCandidates
    .slice(0, 15)
    .map(({ item, score }) => ({
      id: `media-${item.id}`,
      type: "media" as const,
      media: {
        id: item.id,
        title: item.title ?? item.name ?? "Sin título",
        year: item.release_date ?? item.first_air_date
          ? Number((item.release_date ?? item.first_air_date).slice(0, 4)) || null
          : null,
        poster_path: item.poster_path ?? null,
        vote_average: Number(item.vote_average ?? 0),
        reason: buildReasonLabel(item.genre_ids ?? [], affinityVector),
        media_type: item._source_media_type as "movie" | "tv",
        affinity_score: Math.round(score * 10) / 10,
      },
    }))

  // ── F. Complementar con reviews de la comunidad ──
  const tmdbCandidates = recommendedMedia
    .filter((m) => m.type === "media")
    .map((m) => (m.type === "media" ? { tmdb_id: m.media.id, media_type: m.media.media_type } : null))
    .filter(Boolean) as { tmdb_id: number; media_type: string }[]

  const mediaRefs =
    tmdbCandidates.length > 0
      ? await prisma.movies_ref.findMany({
          where: { OR: tmdbCandidates.map((c) => ({ tmdb_id: c.tmdb_id, media_type: c.media_type as any })) },
          select: { id: true },
        })
      : []

  const reviewSuggestions = mediaRefs.length
    ? await prisma.reviews.findMany({
        where: { movie_id: { in: mediaRefs.map((r) => r.id) }, user_id: { not: viewerId }, content: { not: null } },
        take: 8,
        orderBy: { created_at: "desc" },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true, media_type: true } },
        },
      })
    : []

  const items: RecommendationItem[] = [
    ...recommendedMedia,
    ...reviewSuggestions.map((r) => ({
      id: `review-${r.id}`,
      type: "review" as const,
      review: {
        id: r.id,
        content: r.content,
        rating: r.rating ? Number(r.rating) : null,
        mode: r.mode,
        created_at: r.created_at.toISOString(),
      },
      user: { id: r.users.id, username: r.users.username, avatar_url: r.users.avatar_url },
      media: { id: r.movies_ref.id, tmdb_id: r.movies_ref.tmdb_id, media_type: r.movies_ref.media_type as "movie" | "tv" },
    })),
  ]

  const start = (page - 1) * limit
  return {
    items: items.slice(start, start + limit),
    total: items.length,
    has_more: start + limit < items.length,
  }
}

/**
 * Construye un label de razón legible basándose en los géneros de mayor afinidad.
 */
function buildReasonLabel(
  genreIds: number[],
  affinityVector: Record<string, number>
): string {
  if (genreIds.length === 0) return "Sugerencia editorial de CineVault"

  // Ordenar géneros por afinidad del usuario
  const sorted = genreIds
    .map((id) => ({ name: TMDB_GENRE_MAP[id], boost: TMDB_GENRE_MAP[id] ? (affinityVector[TMDB_GENRE_MAP[id]] ?? 0) : 0 }))
    .filter((g) => g.name)
    .sort((a, b) => b.boost - a.boost)

  if (sorted.length === 0) return "Basado en tu historial reciente"
  if (sorted[0].boost > 1.5) return `Tu perfil de ${sorted[0].name} lo pide`
  if (sorted[0].boost > 0.8) return `Afinidad con ${sorted[0].name} detectada`
  return "Basado en tu historial reciente"
}

// ══════════════════════════════════════════════════════════════════════════════
//  2. DIRECTORES SUGERIDOS
// ══════════════════════════════════════════════════════════════════════════════

export const getSuggestedDirectors = async (userId: number) => {
  const refs = await prisma.vault.findMany({
    where: { user_id: userId },
    include: { movies_ref: { select: { tmdb_id: true, media_type: true } } },
    take: 20,
    orderBy: { added_at: "desc" },
  })

  const movieSeeds = refs
    .filter((e) => e.movies_ref.media_type === "movie")
    .map((e) => e.movies_ref.tmdb_id)
    .slice(0, 10)

  if (movieSeeds.length === 0) {
    return curatedFallbackDirectors.map((d, i) => ({
      id: `curated-${i}`,
      name: d.name,
      score: 0,
      reason: d.reason,
      source: "editorial",
    }))
  }

  const credits = await Promise.all(
    movieSeeds.map(async (id) => {
      try {
        const data = (await consultarTMDB(`movie/${id}/credits`)) as any
        return { id, crew: data.crew || [] }
      } catch {
        return { id, crew: [] }
      }
    })
  )

  const byDirector = new Map<
    string,
    { id: number; name: string; profile_path: string | null; score: number; movies: number[] }
  >()

  for (const e of credits) {
    for (const p of e.crew) {
      if (p.job !== "Director" || !p.name) continue
      const prev = byDirector.get(p.name) ?? {
        id: p.id,
        name: p.name,
        profile_path: p.profile_path ?? null,
        score: 0,
        movies: [] as number[],
      }
      prev.score++
      if (!prev.movies.includes(e.id)) prev.movies.push(e.id)
      byDirector.set(p.name, prev)
    }
  }

  return Array.from(byDirector.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((d) => ({
      id: d.id,
      name: d.name,
      profile_path: d.profile_path,
      score: d.score,
      reason: `Presente en ${d.score} obra(s) de tu colección`,
      source: "personalized",
      movie_tmdb_ids: d.movies,
    }))
}

// ══════════════════════════════════════════════════════════════════════════════
//  3. TONIGHT MOVIE — la película perfecta para esta noche
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Elige LA película para esta noche combinando:
 *  - Historial (semillas TMDB)
 *  - affinity_vector (boost de géneros preferidos)
 *  - vetoedGenres (penalización -50)
 *  - weather_history (boost contextual por clima)
 *  - isLateNight (boost Thriller/Horror si es madrugada)
 */
export const getTonightMovie = async (
  userId: number,
  localHour: number = new Date().getHours(),
  weather: string = "clear"
) => {
  // ── A. Cargar taste profile ──
  const { affinityVector, vetoedGenreIds, weatherHistory } = await getUserTasteProfile(userId)

  // ── B. Determinar géneros preferidos según contexto climático ──
  const weatherKey = weather.includes("rain") || weather.includes("cloud") ? "rainy" : "sunny"
  const contextualGenres: string[] = weatherHistory[weatherKey] ?? []
  const isLateNight = localHour >= 22 || localHour < 5

  // ── C. Historial para no repetir y como semillas ──
  const [vaultEntries, diaryEntries] = await Promise.all([
    prisma.vault.findMany({
      where: { user_id: userId },
      include: { movies_ref: true },
      take: 20,
      orderBy: { added_at: "desc" },
    }),
    prisma.diary_entries.findMany({
      where: { user_id: userId },
      include: { movies_ref: true },
      take: 20,
      orderBy: { watched_date: "desc" },
    }),
  ])

  // También revisar explicit_interactions tonight_accept (lo que ya ha aceptado)
  const tonightAccepts = await prisma.explicit_interactions.findMany({
    where: { user_id: userId, interaction_type: "tonight_accept" },
    orderBy: { created_at: "desc" },
    take: 10,
    select: { movie_id: true },
  }).catch(() => [] as { movie_id: number | null }[])

  const seenTmdbIds = new Set([
    ...vaultEntries.map((e) => e.movies_ref.tmdb_id),
    ...diaryEntries.map((e) => e.movies_ref.tmdb_id),
  ])

  // TMDb IDs de películas tonight_accepted (para excluirlas también)
  const acceptedMovieIds = tonightAccepts.map((a) => a.movie_id).filter(Boolean) as number[]
  if (acceptedMovieIds.length > 0) {
    const acceptedRefs = await prisma.movies_ref.findMany({
      where: { id: { in: acceptedMovieIds } },
      select: { tmdb_id: true },
    })
    acceptedRefs.forEach((r) => seenTmdbIds.add(r.tmdb_id))
  }

  const seeds = vaultEntries
    .filter((e) => e.movies_ref.media_type === "movie")
    .map((e) => e.movies_ref.tmdb_id)
    .slice(0, 3)

  // ── D. Obtener candidatos ──
  let candidates: any[] = []

  if (seeds.length > 0) {
    const results = await Promise.all(
      seeds.map(async (seedId) => {
        try {
          const data = (await consultarTMDB(`movie/${seedId}/recommendations`, { page: "1" })) as any
          return data.results ?? []
        } catch {
          return []
        }
      })
    )
    candidates = results.flat()
  }

  if (candidates.length < 5) {
    // Complementar con top_rated si hay pocos candidatos
    try {
      const backup = (await consultarTMDB("movie/top_rated", { page: "1" })) as any
      candidates = [...candidates, ...(backup.results ?? [])]
    } catch {
      // ignorar
    }
  }

  // ── E. Pre-filtrar ──
  candidates = candidates.filter((c) => !seenTmdbIds.has(c.id) && c.poster_path)

  // ── F. Puntuar candidatos con taste profile ──
  let bestCandidate: any = null
  let bestScore = -9999

  for (const c of candidates) {
    const baseScore = Number(c.vote_average ?? 0)
    const genreIds: number[] = c.genre_ids ?? []

    // Affinity boost (incluye veto check)
    const affinityBoost = calcAffinityBoost(genreIds, affinityVector, vetoedGenreIds)
    if (affinityBoost === -50) continue // vetoado

    let score = baseScore + affinityBoost * 0.6 // Affinity contribuye 60% del boost

    // Boost contextual por clima (weather_history del perfil)
    if (contextualGenres.length > 0) {
      const weatherBoost = genreIds.some((id) => {
        const name = TMDB_GENRE_MAP[id]
        return name && contextualGenres.includes(name)
      })
        ? 2.5
        : 0
      score += weatherBoost
    }

    // Boost nocturno — Thriller (53), Horror (27), Mystery (9648)
    if (isLateNight) {
      if (genreIds.includes(27) || genreIds.includes(53) || genreIds.includes(9648)) {
        score += 2.0
      }
    } else {
      // Tarde normal: Comedy (35), Adventure (12), Romance (10749)
      if (genreIds.includes(35) || genreIds.includes(12)) {
        score += 1.5
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestCandidate = c
    }
  }

  // Hard fallback
  if (!bestCandidate) {
    const hardFallback = (await consultarTMDB("movie/popular", { page: "1" })) as any
    bestCandidate = (hardFallback.results ?? []).find((m: any) => m.poster_path) ?? (hardFallback.results ?? [])[0]
  }

  // ── G. Construir razón legible ──
  const tonightReason = buildTonightReason(
    bestCandidate?.genre_ids ?? [],
    affinityVector,
    isLateNight,
    weather
  )

  return {
    id: `tonight-${bestCandidate?.id}`,
    type: "tonight",
    media: {
      id: bestCandidate?.id,
      title: bestCandidate?.title ?? bestCandidate?.name,
      year: bestCandidate?.release_date ? Number(bestCandidate.release_date.slice(0, 4)) : null,
      poster_path: bestCandidate?.poster_path,
      vote_average: bestCandidate?.vote_average,
      media_type: "movie",
      reason: tonightReason,
      weather_context: weather,
      taste_score: Math.round(bestScore * 10) / 10,
    },
  }
}

/**
 * Construye un mensaje de razón para la película Tonight.
 */
function buildTonightReason(
  genreIds: number[],
  affinityVector: Record<string, number>,
  isLateNight: boolean,
  weather: string
): string {
  const topGenre = genreIds
    .map((id) => ({ name: TMDB_GENRE_MAP[id], boost: TMDB_GENRE_MAP[id] ? (affinityVector[TMDB_GENRE_MAP[id]] ?? 0) : 0 }))
    .filter((g) => g.name)
    .sort((a, b) => b.boost - a.boost)[0]

  if (isLateNight && (genreIds.includes(27) || genreIds.includes(53))) {
    return "Perfecta para cerrar el día. Tu perfil la pide esta madrugada."
  }
  if (weather.includes("rain") && topGenre?.boost > 1) {
    return `Para una noche de lluvia. Tu afinidad con ${topGenre.name} la convierte en elección obvia.`
  }
  if (topGenre?.boost > 1.5) {
    return `Tu perfil de ${topGenre.name} lleva tiempo sin esta recomendación.`
  }
  return "Elegida para vos esta noche. Puntuación de gusto óptima."
}

// ══════════════════════════════════════════════════════════════════════════════
//  4. ONBOARDING MOVIES
// ══════════════════════════════════════════════════════════════════════════════

export const getOnboardingMovies = async (
  userId: number,
  step: number,
  seedId?: number
) => {
  let candidates: any[] = []

  if (seedId && step % 2 !== 0) {
    try {
      const data = (await consultarTMDB(`movie/${seedId}/recommendations`, { page: "1" })) as any
      candidates = data.results ?? []
    } catch {
      candidates = []
    }
  }

  if (candidates.length === 0) {
    const categories = ["popular", "top_rated", "upcoming"]
    const cat = categories[step % categories.length]
    const data = (await consultarTMDB(`movie/${cat}`, { page: "1" })) as any
    candidates = data.results ?? []
  }

  const pick = candidates[Math.floor(Math.random() * Math.min(10, candidates.length))]

  return {
    step,
    movie: {
      id: pick.id,
      title: pick.title,
      poster_path: pick.poster_path,
      year: pick.release_date ? Number(pick.release_date.slice(0, 4)) : null,
      overview: pick.overview,
      genre_ids: pick.genre_ids ?? [],
    },
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  5. GUARDAR INTERACCIÓN EXPLÍCITA + ACTUALIZAR TASTE PROFILE
// ══════════════════════════════════════════════════════════════════════════════

export const saveExplicitInteraction = async (
  userId: number,
  movieId: number,
  type: string, // 'like_onboarding', 'skip_onboarding', 'tonight_accept', 'tonight_reject'
  metadata: any = {}
) => {
  // 1. Registrar interacción
  const interaction = await prisma.explicit_interactions.create({
    data: {
      user_id: userId,
      movie_id: movieId,
      interaction_type: type,
      metadata: JSON.stringify(metadata),
    },
  })

  // 2. Actualizar taste profile según el tipo de interacción
  const isPositive = ["like_onboarding", "tonight_accept"].includes(type)
  const isNegative = ["tonight_reject"].includes(type)

  if (isPositive || isNegative) {
    try {
      const movieData = (await consultarTMDB(`movie/${movieId}`)) as any
      const genres: { id: number; name: string }[] = movieData.genres ?? []

      const profile = await prisma.user_taste_profiles.findUnique({ where: { user_id: userId } })
      let vector: Record<string, number> = profile?.affinity_vector
        ? (typeof profile.affinity_vector === "string"
            ? JSON.parse(profile.affinity_vector)
            : profile.affinity_vector) as Record<string, number>
        : {}

      for (const g of genres) {
        if (isPositive) {
          // Boost positivo
          vector[g.name] = Math.min(3.0, (vector[g.name] ?? 0) + (type === "tonight_accept" ? 0.2 : 0.1))
        } else {
          // Penalización negativa (tonight_reject)
          vector[g.name] = Math.max(-1.0, (vector[g.name] ?? 0) - 0.15)
        }
      }

      await prisma.user_taste_profiles.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          affinity_vector: JSON.stringify(vector),
          vetoed_entities: JSON.stringify({ directors: [], genres: [] }),
          weather_history: JSON.stringify({}),
        },
        update: { affinity_vector: JSON.stringify(vector) },
      })
    } catch (e) {
      console.error("Error actualizando taste profile:", e)
    }
  }

  return interaction
}
