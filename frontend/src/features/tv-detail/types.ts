import type { TVDetailApi } from "../../services/tvDetailServices";

export interface TVDetailState {
  detail: TVDetailApi | null;
  loading: boolean;
  error: string | null;
  watchedIds: Set<string>;
  
  // User Actions State (Portado de useUserActions si decidimos centralizarlo)
  userRating: number;
  isFavorite: boolean;
  inWatchlist: boolean;
  inDiary: boolean;
  reviews: any[];
  myReviewId: number | null;
}

export interface TVDetailActions {
  setDetail: (detail: TVDetailApi | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setWatchedIds: (ids: Set<string>) => void;
  toggleEpisodeWatched: (episodeKey: string) => void;
  
  // User Actions (Placeholders para integración futura)
  setUserRating: (rating: number) => void;
  setIsFavorite: (isFav: boolean) => void;
  setInWatchlist: (inWL: boolean) => void;
  setInDiary: (inDiary: boolean) => void;
}
