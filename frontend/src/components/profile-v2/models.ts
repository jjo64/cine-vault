export type EnrichedMovie = {
  movieId: number
  tmdbId: number
  title: string
  year: number | null
  director: string
  posterUrl: string
  runtimeMinutes?: number | null
  primaryGenre?: string | null
  curatedNote?: string | null
  rating?: number | null
  mediaType: 'movie' | 'tv'
}

export type RecentlyWatchedItem = EnrichedMovie & {
  id: number
  rating: number
}

export type WatchlistItem = EnrichedMovie & {
  runtimeMinutes: number | null
  primaryGenre: string | null
  priority: 'alta' | 'normal'
}

export type ReviewItem = {
  id: number
  movieId: number
  tmdbId: number | null
  mediaType: 'movie' | 'tv'
  username: string
  createdAtIso: string
  reviewSequence: number
  title: string
  year: number | null
  director: string
  posterUrl: string
  rating: number
  createdAtLabel: string
  text: string
  tags: string[]
}

export type VaultMockItem = {
  id: number
  type: string
  title: string
  duration: string
  views: number
  img: string
}

export type UserListSummaryItem = {
  id: number
  name: string
  itemsCount: number
  isPublic: boolean
  description: string | null
}

export type ProfileHeaderData = {
  displayName: string
  username: string
  memberSince: string
  avatarUrl: string
  bio: string
}

export type ProfileConnection = {
  id: number
  username: string
  avatarUrl?: string | null
}

export type ProfileStatsData = {
  views: number
  reviews: number
  watchlist: number
  following: number
  followers: number
}

export type DiaryTimelineItem = {
  id: number
  movieId: number
  tmdbId: number | null
  title: string
  year: number | null
  director: string
  posterUrl: string
  rating: number
  watchedDateLabel: string
  moodLabel: string
  stageLabel: string
  note: string | null
  mediaType: 'movie' | 'tv'
}
