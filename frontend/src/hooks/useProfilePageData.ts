import { useEffect, useMemo, useState } from 'react'
import {
  fetchDiary,
  fetchFollowers,
  fetchFollowing,
  fetchReviews,
  fetchUserProfile,
  fetchUserProfileByUsername,
  fetchWatchlist,
  resolveViewerId,
} from '../services/profileServices'
import { IMG } from '../components/profile-v2/assets'
import type { EnrichedMovie, ProfileConnection, ProfileHeaderData, ProfileStatsData, RecentlyWatchedItem, ReviewItem, WatchlistItem } from '../components/profile-v2/models'
import type { FollowUserEntry, ProfileUser, RichDiaryEntry, RichWatchlistEntry, ReviewEntry } from '../services/profileServices'

const API_URL = import.meta.env.VITE_API_URL

const moviePoster = (path?: string | null, size: 'w300' | 'w500' = 'w300') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : IMG.grain

const relativeDateLabel = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime()
  const days = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  if (days < 7) return `hace ${days} dia${days > 1 ? 's' : ''}`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`
  const months = Math.floor(days / 30)
  return `hace ${months} mes${months > 1 ? 'es' : ''}`
}

const cleanReviewText = (content: string | null) => {
  if (!content) return 'Sin comentario aun.'
  return content.replace(/\n/g, ' ').trim()
}

const pickTags = (content: string | null): string[] => {
  const normalized = (content || '').toLowerCase()
  const tags: string[] = []
  if (normalized.includes('tarkovsky')) tags.push('Tarkovsky')
  if (normalized.includes('drama')) tags.push('Drama')
  if (normalized.includes('surreal')) tags.push('Surrealismo')
  if (normalized.includes('cine')) tags.push('Cine')
  return tags.length > 0 ? tags : ['Resena', 'CineVault']
}

type MovieMetaTarget = {
  movieId: number
  tmdbId: number | null
}

async function fetchMovieMetaMap(targets: MovieMetaTarget[]) {
  const normalized = Array.from(
    new Map(
      targets
        .filter((item) => item.tmdbId !== null)
        .map((item) => [item.movieId, item.tmdbId as number]),
    ).entries(),
  ).slice(0, 50)

  const entries = await Promise.allSettled(
    normalized.map(async ([movieId, tmdbId]) => {
      const res = await fetch(`${API_URL}/api/movies/${tmdbId}`)
      if (!res.ok) throw new Error('No se pudo obtener pelicula')
      const data = await res.json()
      const director = (data.credits?.crew || []).find((person: { job?: string; name?: string }) => person.job === 'Director')?.name || 'Desconocido'
      const year = data.release_date ? Number(String(data.release_date).split('-')[0]) : null
      const meta: EnrichedMovie = {
        movieId,
        tmdbId,
        title: data.title || `Pelicula ${tmdbId}`,
        year,
        director,
        posterUrl: moviePoster(data.poster_path, 'w500'),
      }
      return [movieId, meta] as const
    }),
  )

  const map = new Map<number, EnrichedMovie>()
  entries.forEach((item) => {
    if (item.status === 'fulfilled') {
      const [movieId, data] = item.value
      map.set(movieId, data)
    }
  })
  return map
}

export function useProfilePageData(userParam?: string) {
  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [diary, setDiary] = useState<RichDiaryEntry[]>([])
  const [watchlist, setWatchlist] = useState<RichWatchlistEntry[]>([])
  const [reviews, setReviews] = useState<ReviewEntry[]>([])
  const [followers, setFollowers] = useState<FollowUserEntry[]>([])
  const [following, setFollowing] = useState<FollowUserEntry[]>([])
  const [movieMap, setMovieMap] = useState<Map<number, EnrichedMovie>>(new Map())
  const [viewerId, setViewerId] = useState<number | null>(null)
  const [targetId, setTargetId] = useState<number | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const { userId: resolvedViewerId, username: viewerUsername, token } = await resolveViewerId()
        const normalizedTargetUsername = (userParam || viewerUsername || '').trim()

        if (!active) return

        setViewerId(resolvedViewerId)
        setIsAuthenticated(Boolean(token))

        if (!normalizedTargetUsername) {
          setTargetId(null)
          setProfile(null)
          setDiary([])
          setWatchlist([])
          setReviews([])
          setFollowers([])
          setFollowing([])
          setMovieMap(new Map())
          return
        }

        const profileData = await fetchUserProfileByUsername(normalizedTargetUsername)

        if (!active) return

        if (!profileData) {
          setTargetId(null)
          setProfile(null)
          setDiary([])
          setWatchlist([])
          setReviews([])
          setFollowers([])
          setFollowing([])
          setMovieMap(new Map())
          setError('Perfil no encontrado')
          return
        }

        const resolvedTargetId = profileData.id
        setTargetId(resolvedTargetId)
        const isSelf =
          resolvedViewerId !== null &&
          ((viewerUsername && normalizedTargetUsername.toLowerCase() === viewerUsername.toLowerCase()) ||
            resolvedTargetId === resolvedViewerId)
        const authToken = isSelf ? token : null

        const [fullProfileData, diaryData, watchlistData, reviewsData, followersData, followingData] = await Promise.all([
          fetchUserProfile(resolvedTargetId, authToken),
          fetchDiary(resolvedTargetId, authToken, isSelf),
          fetchWatchlist(resolvedTargetId, authToken, isSelf),
          fetchReviews(resolvedTargetId, authToken, isSelf),
          fetchFollowers(resolvedTargetId),
          fetchFollowing(resolvedTargetId),
        ])

        if (!active) return

        const nextDiary = diaryData.diary ?? []
        const nextWatchlist = [...(watchlistData ?? [])].sort((a, b) => {
          const aTime = a.added_at ? new Date(a.added_at).getTime() : 0
          const bTime = b.added_at ? new Date(b.added_at).getTime() : 0
          return bTime - aTime
        })
        const nextReviews = reviewsData ?? []

        setProfile(fullProfileData)
        setDiary(nextDiary)
        setWatchlist(nextWatchlist)
        setReviews(nextReviews)
        setFollowers(followersData)
        setFollowing(followingData)

        const tmdbByMovieId = new Map<number, number | null>()
        nextDiary.forEach((item) => tmdbByMovieId.set(item.movie_id, item.tmdb_id))
        nextWatchlist.forEach((item) => {
          if (!tmdbByMovieId.has(item.movie_id)) tmdbByMovieId.set(item.movie_id, item.tmdb_id)
        })

        const ids: MovieMetaTarget[] = [
          ...nextDiary.map((item) => ({ movieId: item.movie_id, tmdbId: item.tmdb_id })),
          ...nextWatchlist.map((item) => ({ movieId: item.movie_id, tmdbId: item.tmdb_id })),
          ...nextReviews.map((item) => ({ movieId: item.movie_id, tmdbId: item.tmdb_id ?? item.movies_ref?.tmdb_id ?? tmdbByMovieId.get(item.movie_id) ?? null })),
        ]

        const map = await fetchMovieMetaMap(ids)
        if (active) setMovieMap(map)
      } catch (err) {
        if (!active) return
        setError('No se pudo cargar el perfil')
        console.error(err)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [userParam])

  const profileHeader: ProfileHeaderData = useMemo(() => {
    const year = profile?.created_at ? new Date(profile.created_at).getFullYear().toString() : '2024'
    const bio = (profile?.bio || '').trim() || 'Sin biografia todavia.'
    return {
      displayName: profile?.username || 'Perfil',
      username: profile?.username || 'perfil',
      memberSince: year,
      avatarUrl: profile?.avatar_url || IMG.avatar,
      bio,
    }
  }, [profile])

  const stats: ProfileStatsData = useMemo(() => ({
    views: profile?._count?.diary_entries ?? diary.length,
    reviews: profile?._count?.reviews ?? reviews.length,
    watchlist: profile?._count?.watchlist ?? watchlist.length,
    following: profile?._count?.follows_follows_follower_idTousers ?? following.length,
    followers: profile?._count?.follows_follows_following_idTousers ?? followers.length,
  }), [profile, diary.length, reviews.length, watchlist.length, following.length, followers.length])

  const followerUsers: ProfileConnection[] = useMemo(() => followers.map((item) => ({
    id: item.id,
    username: item.username,
    avatarUrl: item.avatar_url || null,
  })), [followers])

  const followingUsers: ProfileConnection[] = useMemo(() => following.map((item) => ({
    id: item.id,
    username: item.username,
    avatarUrl: item.avatar_url || null,
  })), [following])

  const recentlyWatched: RecentlyWatchedItem[] = useMemo(() => (
    diary.slice(0, 8).map((entry) => {
      const fromMovieMap = movieMap.get(entry.movie_id)
      return {
        movieId: entry.movie_id,
        tmdbId: entry.tmdb_id ?? fromMovieMap?.tmdbId ?? null,
        title: entry.movie_info?.title || fromMovieMap?.title || `Pelicula ${entry.movie_id}`,
        year: fromMovieMap?.year ?? null,
        director: fromMovieMap?.director || 'Desconocido',
        posterUrl: entry.movie_info?.poster_path ? moviePoster(entry.movie_info.poster_path, 'w500') : fromMovieMap?.posterUrl || IMG.grain,
        rating: entry.review?.rating ? Math.round(entry.review.rating) : 0,
      }
    })
  ), [diary, movieMap])

  const watchlistFilms: WatchlistItem[] = useMemo(() => (
    watchlist.slice(0, 20).map((entry, index) => {
      const fromMovieMap = movieMap.get(entry.movie_id)
      return {
        movieId: entry.movie_id,
        tmdbId: entry.tmdb_id ?? fromMovieMap?.tmdbId ?? null,
        title: entry.movie_info?.title || fromMovieMap?.title || `Pelicula ${entry.movie_id}`,
        year: fromMovieMap?.year ?? null,
        director: fromMovieMap?.director || 'Desconocido',
        posterUrl: entry.movie_info?.poster_path ? moviePoster(entry.movie_info.poster_path, 'w500') : fromMovieMap?.posterUrl || IMG.grain,
        priority: index < 4 ? 'alta' : 'normal',
      }
    })
  ), [watchlist, movieMap])

  const reviewItems: ReviewItem[] = useMemo(() => (
    reviews.slice(0, 12).map((entry) => {
      const fromMovieMap = movieMap.get(entry.movie_id)
      const fromDiary = diary.find((diaryEntry) => diaryEntry.movie_id === entry.movie_id)
      const fromWatchlist = watchlist.find((watchlistEntry) => watchlistEntry.movie_id === entry.movie_id)
      return {
        id: entry.id,
        movieId: entry.movie_id,
        tmdbId: entry.tmdb_id ?? entry.movies_ref?.tmdb_id ?? fromMovieMap?.tmdbId ?? fromDiary?.tmdb_id ?? fromWatchlist?.tmdb_id ?? null,
        title: fromMovieMap?.title || fromDiary?.movie_info?.title || fromWatchlist?.movie_info?.title || `Pelicula ${entry.movie_id}`,
        year: fromMovieMap?.year ?? null,
        director: fromMovieMap?.director || 'Desconocido',
        posterUrl: fromMovieMap?.posterUrl || (fromDiary?.movie_info?.poster_path || fromWatchlist?.movie_info?.poster_path ? moviePoster(fromDiary?.movie_info?.poster_path || fromWatchlist?.movie_info?.poster_path, 'w500') : IMG.grain),
        rating: entry.rating ? Math.round(entry.rating) : 0,
        createdAtLabel: relativeDateLabel(entry.created_at),
        text: cleanReviewText(entry.content),
        tags: pickTags(entry.content),
      }
    })
  ), [reviews, movieMap, diary, watchlist])

  return {
    loading,
    error,
    isAuthenticated,
    hasTargetProfile: Boolean(targetId),
    isOwnProfile: Boolean(viewerId && targetId && viewerId === targetId),
    isPublicProfile: Boolean(targetId && viewerId !== targetId),
    profileHeader,
    stats,
    followerUsers,
    followingUsers,
    recentlyWatched,
    watchlistFilms,
    reviewItems,
  }
}
