import { create } from "zustand";
import type { SearchStore } from "../types";
import { EMPTY_FILTERS } from "../constants";

export const useSearchStore = create<SearchStore>((set) => ({
  activeTab: "all",
  filters: { ...EMPTY_FILTERS },
  page: 1,
  isSearching: false,
  showFilters: true,
  isFiltersOpen: false,
  myWatchlist: [],
  myDiary: [],
  enrichedFilms: {},
  loadingFilmDetails: {},
  filmResults: [],
  personResults: [],
  userResults: [],
  fetchError: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setFilters: (filters) =>
    set((state) => ({
      filters: typeof filters === "function" ? filters(state.filters) : filters,
    })),
  setPage: (page) => set({ page }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setShowFilters: (showFilters) =>
    set((state) => ({
      showFilters:
        typeof showFilters === "function"
          ? showFilters(state.showFilters)
          : showFilters,
    })),
  setIsFiltersOpen: (isFiltersOpen) => set({ isFiltersOpen }),
  setMyWatchlist: (myWatchlist) => set({ myWatchlist }),
  setMyDiary: (myDiary) => set({ myDiary }),
  setEnrichedFilms: (enrichedFilms) =>
    set((state) => ({
      enrichedFilms:
        typeof enrichedFilms === "function"
          ? enrichedFilms(state.enrichedFilms)
          : enrichedFilms,
    })),
  setLoadingFilmDetails: (loadingFilmDetails) =>
    set((state) => ({
      loadingFilmDetails:
        typeof loadingFilmDetails === "function"
          ? loadingFilmDetails(state.loadingFilmDetails)
          : loadingFilmDetails,
    })),
  setFilmResults: (filmResults) => set({ filmResults }),
  setPersonResults: (personResults) => set({ personResults }),
  setUserResults: (userResults) => set({ userResults }),
  setFetchError: (fetchError) => set({ fetchError }),

  addToWatchlistStore: (movieId) =>
    set((state) => ({
      myWatchlist: [...state.myWatchlist, movieId],
    })),
  removeFromWatchlistStore: (movieId) =>
    set((state) => ({
      myWatchlist: state.myWatchlist.filter((id) => id !== movieId),
    })),
  addToDiaryStore: (movieId) =>
    set((state) => ({
      myDiary: [...state.myDiary, movieId],
    })),
  removeFromDiaryStore: (movieId) =>
    set((state) => ({
      myDiary: state.myDiary.filter((id) => id !== movieId),
    })),
  resetFilters: () => set({ filters: { ...EMPTY_FILTERS } }),
}));
