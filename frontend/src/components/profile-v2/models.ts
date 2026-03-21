export type EnrichedMovie = {
  movieId: number
  tmdbId: number | null
  title: string
  year: number | null
  director: string
  posterUrl: string
  runtimeMinutes?: number | null
  primaryGenre?: string | null
  curatedNote?: string | null
}

export type RecentlyWatchedItem = EnrichedMovie & {
  rating: number
}

export type WatchlistItem = EnrichedMovie & {
  priority: 'alta' | 'normal'
}

export type ReviewItem = EnrichedMovie & {
  id: number
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
}
