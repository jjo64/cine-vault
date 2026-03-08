export type EnrichedMovie = {
  movieId: number
  title: string
  year: number | null
  director: string
  posterUrl: string
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

export type UserListMock = {
  id: number
  title: string
  count: number
  visibility: 'public' | 'private'
  desc: string
  covers: string[]
}

export type ProfileHeaderData = {
  displayName: string
  username: string
  memberSince: string
  avatarUrl: string
  bio: string
}

export type ProfileStatsData = {
  views: number
  reviews: number
  vault: number
  watchlist: number
}
