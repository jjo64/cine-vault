import type { AuthUser } from "../../services/authServices";
import type { ForYouItem, ActivityItem } from "../../services/socialServices";
import type { MovieDetailApi } from "../../services/movieDetailServices";

export interface ForYouState {
  user: AuthUser | null;
  tonightMovie: MovieDetailApi | null;
  forYouFeed: ForYouItem[];
  activityFeed: ActivityItem[];
  profile: any | null;
  watchlist: any[];
  showOnboarding: boolean;
  loading: boolean;
  error: string | null;
}

export interface ForYouStore extends ForYouState {
  setUser: (user: AuthUser | null) => void;
  setTonightMovie: (movie: MovieDetailApi | null) => void;
  setForYouFeed: (feed: ForYouItem[]) => void;
  setActivityFeed: (feed: ActivityItem[]) => void;
  setProfile: (profile: any | null) => void;
  setWatchlist: (watchlist: any[]) => void;
  setShowOnboarding: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
