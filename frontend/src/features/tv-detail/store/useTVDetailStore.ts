import { create } from "zustand";
import type { TVDetailState, TVDetailActions } from "../types";

export const useTVDetailStore = create<TVDetailState & TVDetailActions>((set) => ({
  detail: null,
  loading: false,
  error: null,
  watchedIds: new Set<string>(),
  userRating: 0,
  isFavorite: false,
  inWatchlist: false,
  inDiary: false,
  reviews: [],
  myReviewId: null,

  setDetail: (detail) => set({ detail }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setWatchedIds: (watchedIds) => set({ watchedIds }),
  toggleEpisodeWatched: (episodeKey) =>
    set((state) => {
      const next = new Set(state.watchedIds);
      if (next.has(episodeKey)) next.delete(episodeKey);
      else next.add(episodeKey);
      return { watchedIds: next };
    }),
  setUserRating: (userRating) => set({ userRating }),
  setIsFavorite: (isFavorite) => set({ isFavorite }),
  setInWatchlist: (inWatchlist) => set({ inWatchlist }),
  setInDiary: (inDiary) => set({ inDiary }),
}));
