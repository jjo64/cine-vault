import { create } from "zustand";
import type { ForYouStore } from "../types";

export const useForYouStore = create<ForYouStore>((set) => ({
  user: null,
  tonightMovie: null,
  forYouFeed: [],
  activityFeed: [],
  profile: null,
  watchlist: [],
  showOnboarding: false,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setTonightMovie: (tonightMovie) => set({ tonightMovie }),
  setForYouFeed: (forYouFeed) => set({ forYouFeed }),
  setActivityFeed: (activityFeed) => set({ activityFeed }),
  setProfile: (profile) => set({ profile }),
  setWatchlist: (watchlist) => set({ watchlist }),
  setShowOnboarding: (showOnboarding) => set({ showOnboarding }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
