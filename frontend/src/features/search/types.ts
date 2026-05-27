export type FilmResult = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  originalTitle: string;
  year: number | null;
  director?: string | null;
  description: string;
  rating: number;
  img: string;
  runtime?: number | null;
  genres?: string[];
  country?: string | null;
};

export type FilmDetails = {
  director?: string | null;
  runtime?: number | null;
  genres?: string[];
  country?: string | null;
};

export type PersonResult = {
  id: number;
  name: string;
  role: string;
  notable: string[];
  img: string;
};

export type UserResult = {
  id: number;
  username: string;
  handle: string;
  films: number;
  bio: string;
  avatar: string;
};

export type FiltersState = {
  genres: string[];
  yearFrom: string;
  yearTo: string;
  countries: string[];
  minRating: number;
  duration: string | null;
  pendientes: boolean;
  palmares: boolean;
  noVistas: boolean;
};

export interface SearchState {
  activeTab: string;
  filters: FiltersState;
  page: number;
  isSearching: boolean;
  showFilters: boolean;
  isFiltersOpen: boolean;
  myWatchlist: number[];
  myDiary: number[];
  enrichedFilms: Record<number, FilmDetails>;
  loadingFilmDetails: Record<number, boolean>;
  filmResults: FilmResult[];
  personResults: PersonResult[];
  userResults: UserResult[];
  fetchError: string | null;
}

export interface SearchStore extends SearchState {
  setActiveTab: (tab: string) => void;
  setFilters: (filters: FiltersState | ((prev: FiltersState) => FiltersState)) => void;
  setPage: (page: number) => void;
  setIsSearching: (isSearching: boolean) => void;
  setShowFilters: (showFilters: boolean | ((prev: boolean) => boolean)) => void;
  setIsFiltersOpen: (isFiltersOpen: boolean) => void;
  setMyWatchlist: (watchlist: number[]) => void;
  setMyDiary: (diary: number[]) => void;
  setEnrichedFilms: (enriched: Record<number, FilmDetails> | ((prev: Record<number, FilmDetails>) => Record<number, FilmDetails>)) => void;
  setLoadingFilmDetails: (loading: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  setFilmResults: (results: FilmResult[]) => void;
  setPersonResults: (results: PersonResult[]) => void;
  setUserResults: (results: UserResult[]) => void;
  setFetchError: (error: string | null) => void;
  addToWatchlistStore: (movieId: number) => void;
  removeFromWatchlistStore: (movieId: number) => void;
  addToDiaryStore: (movieId: number) => void;
  removeFromDiaryStore: (movieId: number) => void;
  resetFilters: () => void;
}

