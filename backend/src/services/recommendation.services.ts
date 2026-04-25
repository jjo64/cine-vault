/**
 * @file recommendation.services.ts
 * @description Capa de servicios para el motor de recomendaciones de CineVault.
 * Utiliza el historial del usuario e integraciones externas para generar
 * sugerencias personalizadas de películas y directores.
 */

import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { prisma } from "../lib/prisma.js"

/**
 * Tipos de ítems que pueden aparecer en el flujo de recomendaciones.
 */
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
  {
    name: "Apichatpong Weerasethakul",
    reason: "Narrativas hipnóticas y sensoriales",
  },
]

/**
 * Genera un feed de recomendaciones personalizadas para un usuario.
 */
export const getPersonalizedFeed = async (
  viewerId: number,
  page: number,
  limit: number
) => {
  // 1. Recuperar semillas del historial reciente del usuario
  const [vaultEntries, diaryEntries, ownReviews] = await Promise.all([
    prisma.vault.findMany({
      where: { user_id: viewerId },
      orderBy: { added_at: "desc" },
      take: 12,
      include: {
        movies_ref: { select: { id: true, tmdb_id: true, media_type: true } },
      },
    }),
    prisma.diary_entries.findMany({
      where: { user_id: viewerId },
      orderBy: { id: "desc" },
      take: 12,
      include: {
        movies_ref: { select: { id: true, tmdb_id: true, media_type: true } },
      },
    }),
    prisma.reviews.findMany({
      where: { user_id: viewerId },
      orderBy: { created_at: "desc" },
      take: 12,
      include: {
        movies_ref: { select: { id: true, tmdb_id: true, media_type: true } },
      },
    }),
  ])

  // Combinar semillas con priorización: Diario > Reseñas > Bóveda (Deduplicadas)
  const seedMap = new Map<
    string,
    { tmdb_id: number; media_type: string; recency_score: number }
  >()

  // Prioridad 1: Diario (lo que realmente ha visto recientemente)
  diaryEntries.forEach((e, idx) => {
    const key = `${e.movies_ref.media_type}-${e.movies_ref.tmdb_id}`
    if (!seedMap.has(key))
      seedMap.set(key, {
        tmdb_id: e.movies_ref.tmdb_id,
        media_type: e.movies_ref.media_type,
        recency_score: 100 - idx,
      })
  })

  // Prioridad 2: Reseñas propias (lo que le ha impulsado a escribir)
  ownReviews.forEach((e, idx) => {
    const key = `${e.movies_ref.media_type}-${e.movies_ref.tmdb_id}`
    if (!seedMap.has(key))
      seedMap.set(key, {
        tmdb_id: e.movies_ref.tmdb_id,
        media_type: e.movies_ref.media_type,
        recency_score: 90 - idx,
      })
  })

  // Prioridad 3: Bóveda (lo que tiene guardado)
  vaultEntries.forEach((e, idx) => {
    const key = `${e.movies_ref.media_type}-${e.movies_ref.tmdb_id}`
    if (!seedMap.has(key))
      seedMap.set(key, {
        tmdb_id: e.movies_ref.tmdb_id,
        media_type: e.movies_ref.media_type,
        recency_score: 80 - idx,
      })
  })

  // Tomar una mezcla balanceada: Las 4 más recientes + 4 aleatorias del resto para dar variedad
  const allSeeds = Array.from(seedMap.values()).sort(
    (a, b) => b.recency_score - a.recency_score
  )
  const topSeeds = allSeeds.slice(0, 4)
  const restSeeds = allSeeds.slice(4)
  const randomRest = restSeeds.sort(() => Math.random() - 0.5).slice(0, 4)

  const seeds = [...topSeeds, ...randomRest]

  const recommendedMedia: RecommendationItem[] = []

  if (seeds.length > 0) {
    const results = await Promise.all(
      seeds.map(async (seed) => {
        try {
          const path =
            seed.media_type === "movie"
              ? `movie/${seed.tmdb_id}/recommendations`
              : `tv/${seed.tmdb_id}/recommendations`

          const data = (await consultarTMDB(path, { page: "1" })) as any
          const items = Array.isArray(data.results) ? data.results : []
          return items.map((i: any) => ({
            ...i,
            source_media_type: seed.media_type,
          }))
        } catch {
          return []
        }
      })
    )

    const seen = new Set<string>()
    for (const item of results.flat()) {
      const globalKey = `${item.source_media_type}-${item.id}`
      if (seen.has(globalKey)) continue
      seen.add(globalKey)

      recommendedMedia.push({
        id: `media-${item.id}`,
        type: "media",
        media: {
          id: item.id,
          title: item.title || item.name || "Sin título",
          year:
            item.release_date || item.first_air_date
              ? Number(
                  (item.release_date || item.first_air_date).slice(0, 4)
                ) || null
              : null,
          poster_path: item.poster_path || null,
          vote_average: Number(item.vote_average || 0),
          reason: `Basado en tus ${item.source_media_type === "movie" ? "películas" : "series"} recientes`,
          media_type: item.source_media_type as "movie" | "tv",
        },
      })
      if (recommendedMedia.length >= 12) break
    }
  } else {
    // Fallback: Mezcla de populares
    const [popularMovies, popularTV] = (await Promise.all([
      consultarTMDB("movie/popular", { page: "1", region: "ES" }),
      consultarTMDB("tv/popular", { page: "1" }),
    ])) as any[]

    const fallbackItems = [
      ...(popularMovies.results || [])
        .slice(0, 6)
        .map((i: any) => ({ ...i, type: "movie" })),
      ...(popularTV.results || [])
        .slice(0, 6)
        .map((i: any) => ({ ...i, type: "tv" })),
    ]

    for (const item of fallbackItems) {
      recommendedMedia.push({
        id: `media-${item.id}`,
        type: "media",
        media: {
          id: item.id,
          title: item.title || item.name || "Sin título",
          year:
            item.release_date || item.first_air_date
              ? Number(
                  (item.release_date || item.first_air_date).slice(0, 4)
                ) || null
              : null,
          poster_path: item.poster_path || null,
          vote_average: Number(item.vote_average || 0),
          reason: "Sugerencia global de descubrimiento",
          media_type: item.type as "movie" | "tv",
        },
      })
    }
  }

  // 2. Complementar con reseñas sugeridas de la comunidad
  const tmdbSeedsForReviews = recommendedMedia
    .map((m) =>
      m.type === "media"
        ? { tmdb_id: m.media.id, media_type: m.media.media_type }
        : null
    )
    .filter(Boolean) as { tmdb_id: number; media_type: string }[]

  const mediaRefCandidates =
    tmdbSeedsForReviews.length > 0
      ? await prisma.movies_ref.findMany({
          where: {
            OR: tmdbSeedsForReviews.map((s) => ({
              tmdb_id: s.tmdb_id,
              media_type: s.media_type as any,
            })),
          },
          select: { id: true },
        })
      : []

  const reviewSuggestions = mediaRefCandidates.length
    ? await prisma.reviews.findMany({
        where: {
          movie_id: { in: mediaRefCandidates.map((c) => c.id) },
          user_id: { not: viewerId },
          content: { not: null },
        },
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
      user: {
        id: r.users.id,
        username: r.users.username,
        avatar_url: r.users.avatar_url,
      },
      media: {
        id: r.movies_ref.id,
        tmdb_id: r.movies_ref.tmdb_id,
        media_type: r.movies_ref.media_type as "movie" | "tv",
      },
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
 * Sugiere directores basados en el contenido de la Cripta (Vault).
 */
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
    {
      id: number
      name: string
      profile_path: string | null
      score: number
      movies: number[]
    }
  >()

  for (const e of credits) {
    for (const p of e.crew) {
      if (p.job !== "Director" || !p.name) continue
      const prev = byDirector.get(p.name) || {
        id: p.id,
        name: p.name,
        profile_path: p.profile_path || null,
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
    .map((d, i) => ({
      id: d.id, // Using TMDB person ID directly
      name: d.name,
      profile_path: d.profile_path,
      score: d.score,
      reason: `Presente en ${d.score} obra(s) de tu colección`,
      source: "personalized",
      movie_tmdb_ids: d.movies,
    }))
}

/**
 * Retorna LA película perfecta recomendada para "Esta Noche" (For You Phase 4)
 * Considera historial vetado, hora local, y opcionalmente clima.
 */
export const getTonightMovie = async (
  userId: number,
  localHour: number = new Date().getHours(),
  weather: string = "clear"
) => {
  // 1. Obtener Blacklist y Preferencias de user_taste_profiles
  const tasteProfile = await prisma.user_taste_profiles.findUnique({
    where: { user_id: userId },
  })

  let vetoedDirectors: string[] = []
  let vetoedGenres: string[] = [] // asumiendo genre IDs as strings if needed

  if (tasteProfile && tasteProfile.vetoed_entities) {
    const vetoes = tasteProfile.vetoed_entities as any
    if (vetoes.directors) vetoedDirectors = vetoes.directors
    if (vetoes.genres) vetoedGenres = vetoes.genres
  }

  // 2. Extraer historial para no repetir (y para usar de semillas)
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

  const seenMap = new Set([
    ...vaultEntries.map((e) => e.movies_ref.tmdb_id),
    ...diaryEntries.map((e) => e.movies_ref.tmdb_id),
  ])

  const seeds = vaultEntries
    .filter((e) => e.movies_ref.media_type === "movie")
    .map((e) => e.movies_ref.tmdb_id)

  const isLateNight = localHour >= 22 || localHour < 5

  let candidates: any[] = []

  // 3. Obtener recomendaciones base
  if (seeds.length > 0) {
    // Tomar hasta 3 semillas recientes
    const recentSeeds = seeds.slice(0, Math.min(3, seeds.length))
    const recomms = await Promise.all(
      recentSeeds.map(async (seedId) => {
        try {
          const data = (await consultarTMDB(`movie/${seedId}/recommendations`, {
            page: "1",
          })) as any
          return data.results || []
        } catch {
          return []
        }
      })
    )
    candidates = recomms.flat()
  }

  // Fallback si no hay candidatos
  if (candidates.length === 0) {
    const backup = (await consultarTMDB("movie/top_rated", {
      page: "1",
    })) as any
    candidates = backup.results || []
  }

  // 4. Filtrar y puntuar candidatos
  // Eliminar vistos y sin poster
  candidates = candidates.filter((c) => !seenMap.has(c.id) && c.poster_path)

  let bestCandidate = null
  let bestScore = -9999

  for (const c of candidates) {
    let score = c.vote_average || 0

    // Filtro Blacklist: Géneros directos
    if (c.genre_ids && vetoedGenres.length > 0) {
      // Simplificación: si un item de vetoedGenres hace match, penalizamos
      const hasVetoedGenre = c.genre_ids.some((id: number) =>
        vetoedGenres.includes(id.toString())
      )
      if (hasVetoedGenre) {
        score -= 50 // Penalización mortal
      }
    }

    // Heurística de Tiempo: Si es Late Night, premiar películas que parecen "intensas pero directas" o penalizar si logramos deducir que son muy largas.
    // Como la API recommendation no da runtime, usamos géneros de atajo.
    // Thriller (53), Horror (27), Action (28), Drama (18), Comedy (35)
    if (isLateNight) {
      if (c.genre_ids?.includes(27) || c.genre_ids?.includes(53)) {
        score += 2 // Boost a thriller/horror de madrugada
      }
    } else {
      // Tarde soleada / normal
      if (weather.includes("rain") || weather.includes("cloud")) {
        if (c.genre_ids?.includes(18) || c.genre_ids?.includes(9648)) score += 3 // Drama / Misterio
      } else {
        if (c.genre_ids?.includes(35) || c.genre_ids?.includes(12)) score += 3 // Comedia / Aventura
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestCandidate = c
    }
  }

  // Si a pesar de todo no hallamos nada (muy raro), devolver un fallback duro
  if (!bestCandidate) {
    const hardFallback = (await consultarTMDB("movie/popular", {
      page: "1",
    })) as any
    bestCandidate = (hardFallback.results || [])[0]
  }

  // 5. Devolver LA ÚNICA película
  return {
    id: `tonight-${bestCandidate?.id}`,
    type: "tonight",
    media: {
      id: bestCandidate?.id,
      title: bestCandidate?.title || bestCandidate?.name,
      year: bestCandidate?.release_date
        ? Number(bestCandidate?.release_date.slice(0, 4))
        : null,
      poster_path: bestCandidate?.poster_path,
      vote_average: bestCandidate?.vote_average,
      media_type: "movie",
      reason: `Elegida para ti esta noche (${localHour}:00). ${isLateNight ? "Perfecta para cerrar el día." : ""}`,
      weather_context: weather,
    },
  }
}

/**
 * Obtiene películas para el flujo de Onboarding (Tinder-style).
 */
export const getOnboardingMovies = async (
  userId: number,
  step: number,
  seedId?: number
) => {
  // En el onboarding queremos variedad pero también afinamiento.
  // Si tenemos un seedId y el paso es impar, buscamos algo relacionado.
  // Si es paso par o no hay seed, buscamos algo genérico de descubrimiento.

  let candidates: any[] = []

  if (seedId && step % 2 !== 0) {
    try {
      const data = (await consultarTMDB(`movie/${seedId}/recommendations`, {
        page: "1",
      })) as any
      candidates = data.results || []
    } catch (e) {
      candidates = []
    }
  }

  if (candidates.length === 0) {
    const categories = ["popular", "top_rated", "upcoming"]
    const cat = categories[step % categories.length]
    const data = (await consultarTMDB(`movie/${cat}`, { page: "1" })) as any
    candidates = data.results || []
  }

  // Barajamos un poco para que no sea siempre lo mismo
  const pick =
    candidates[Math.floor(Math.random() * Math.min(10, candidates.length))]

  return {
    step,
    movie: {
      id: pick.id,
      title: pick.title,
      poster_path: pick.poster_path,
      year: pick.release_date ? Number(pick.release_date.slice(0, 4)) : null,
      overview: pick.overview,
    },
  }
}

/**
 * Guarda una interacción explícita y actualiza el perfil de gusto.
 */
export const saveExplicitInteraction = async (
  userId: number,
  movieId: number,
  type: string, // 'like', 'dislike', 'skip', 'love', 'hate'
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

  // 2. Actualizar (o crear) User Taste Profile
  // Simplificación: si es onboarding_love, sumamos afinidad a los géneros de esa película
  if (["like", "love"].includes(type)) {
    try {
      const movieData = (await consultarTMDB(`movie/${movieId}`)) as any
      const genres = movieData.genres || []

      const profile = await prisma.user_taste_profiles.findUnique({
        where: { user_id: userId },
      })
      let vector = profile?.affinity_vector
        ? JSON.parse(profile.affinity_vector as string)
        : {}

      for (const g of genres) {
        vector[g.name] = (vector[g.name] || 0) + (type === "love" ? 0.3 : 0.1)
      }

      await prisma.user_taste_profiles.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          affinity_vector: JSON.stringify(vector),
          vetoed_entities: JSON.stringify({ directors: [], genres: [] }),
          weather_history: JSON.stringify({}),
        },
        update: {
          affinity_vector: JSON.stringify(vector),
        },
      })
    } catch (e) {
      console.error("Error actualizando perfil de gusto:", e)
    }
  }

  return interaction
}
