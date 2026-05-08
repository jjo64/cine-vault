export type ZoneId = "entrada" | "sala" | "vitrina";

export type DiaryEntry = {
  movie_id: number;
  watched_date: string | null;
  tmdb_id: number | null;
  movie_info?: {
    title?: string;
    poster_path?: string | null;
  } | null;
  review?: {
    rating?: number | null;
    content?: string | null;
    created_at?: string;
  } | null;
};

export type WatchlistEntry = {
  movie_id: number;
  tmdb_id: number | null;
  added_at?: string | null;
  movie_info?: {
    title?: string;
    poster_path?: string | null;
  } | null;
};

export type ReviewEntry = {
  id: number;
  movie_id: number;
  tmdb_id?: number | null;
  content: string | null;
  rating: number | null;
  likes?: number;
  created_at: string;
};

export type VaultEntry = {
  movie_id: number;
  tmdb_id: number | null;
  movie_info?: {
    title?: string;
    poster_path?: string | null;
    release_date?: string;
  } | null;
  added_at?: string | null;
};

export type FollowingUser = {
  id: number;
  username: string;
  avatar_url?: string | null;
};

export type MentirasRanking = {
  shame?: Array<{
    id: number;
    title: string;
    poster: string;
    voterCount: number;
  }>;
  completed?: Array<{
    id: number;
    title: string;
    poster: string;
    finishRate: number;
  }>;
};

export type UserListSummary = {
  id: number;
  name: string;
  items_count: number;
  itemsCount?: number;
  is_public?: boolean;
  description?: string | null;
};

export type MovieMeta = {
  movieId: number;
  tmdbId: number;
  title: string;
  posterUrl: string;
  backdropUrl: string;
  year: number | null;
  director: string;
  duration: string;
  genres: string[];
  synopsis: string;
  points: number;
  // Mantener por compatibilidad si es necesario, aunque se prefieren las nuevas
  runtimeLabel?: string;
  overview?: string | null;
};

export type FeedItem = {
  id: number;
  user: string;
  username: string;
  avatar: string;
  film: string;
  movieId: number;
  tmdbId: number | null;
  rating: number;
  text: string;
  likes: number;
  comments: number;
  posterUrl: string;
};

export type FollowingActivityItem = {
  user: string;
  username: string;
  avatar: string;
  film: string;
  movieId: number;
  tmdbId: number | null;
  rating: number;
  time: string;
  posterUrl: string;
};

export type FollowingReviewItem = {
  id: number;
  user: string;
  username: string;
  avatar: string;
  film: string;
  movieId: number;
  tmdbId: number | null;
  rating: number;
  text: string;
  likes: number;
  posterUrl: string;
  createdAt: string;
};

export interface HomeLoggedProps {
  username: string;
}

export interface Zone {
  id: ZoneId;
  symbol: string;
  name: string;
  subtitle: string;
  desc: string;
}
