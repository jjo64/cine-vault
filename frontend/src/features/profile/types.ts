import type {
  ProfileUser,
  CuratedGalleryItemData,
  FollowUserEntry,
  RichDiaryEntry,
  RichWatchlistEntry,
  ReviewEntry,
  CinematicSignatureData,
} from "../../services/profileServices";

export type EnrichedMovie = {
  movieId: number;
  tmdbId: number | null;
  title: string;
  year: number | null;
  director: string;
  posterUrl: string;
  runtimeMinutes?: number | null;
  primaryGenre?: string | null;
  curatedNote?: string | null;
  rating?: number | null;
  mediaType: "movie" | "tv";
};

export type RecentlyWatchedItem = EnrichedMovie & {
  id: number;
  rating: number;
};

export type WatchlistItem = EnrichedMovie & {
  runtimeMinutes: number | null;
  primaryGenre: string | null;
  priority: "alta" | "normal";
};

export type ReviewItem = {
  id: number;
  movieId: number;
  tmdbId: number | null;
  mediaType: "movie" | "tv";
  username: string;
  createdAtIso: string;
  reviewSequence: number;
  title: string;
  year: number | null;
  director: string;
  posterUrl: string;
  rating: number;
  createdAtLabel: string;
  text: string;
  tags: string[];
};

export type UserListSummaryItem = {
  id: number;
  name: string;
  itemsCount: number;
  isPublic: boolean;
  description: string | null;
};

export type ProfileHeaderData = {
  displayName: string;
  username: string;
  memberSince: string;
  avatarUrl: string;
  bio: string;
  membership?: string;
};

export type ProfileConnection = {
  id: number;
  username: string;
  avatarUrl?: string | null;
};

export type ProfileStatsData = {
  views: number;
  reviews: number;
  watchlist: number;
  following: number;
  followers: number;
};

export type DiaryTimelineItem = {
  id: number;
  movieId: number;
  tmdbId: number | null;
  title: string;
  year: number | null;
  director: string;
  posterUrl: string;
  rating: number;
  watchedDateLabel: string;
  moodLabel: string;
  stageLabel: string;
  note: string | null;
  mediaType: "movie" | "tv";
};

export type CinematicSignaturePayload = {
  pivotal_film: string | null;
  pivotal_film_detail: string | null;
  formative_director: string | null;
  formative_director_detail: string | null;
  unforgettable_scene: string | null;
  unforgettable_scene_detail: string | null;
  cinema_turning_year: string | null;
  cinema_turning_year_detail: string | null;
};

export type PROFILE_TABS_TYPE = "Resumen" | "Vault" | "Diario" | "Watchlist" | "Reseñas" | "Listas";

export interface ProfileStore {
  // Carga
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isOwnProfile: boolean;
  isPublicProfile: boolean;
  targetUserId: number | null;

  // Header & Stats
  profileHeader: ProfileHeaderData;
  stats: ProfileStatsData;
  followerUsers: ProfileConnection[];
  followingUsers: ProfileConnection[];
  userBadges: any[];

  // Listas & Vault
  userLists: UserListSummaryItem[];
  vaultSocialEntries: any[];

  // Timeline
  recentlyWatched: RecentlyWatchedItem[];
  watchlistFilms: WatchlistItem[];
  reviewItems: ReviewItem[];
  diaryTimeline: DiaryTimelineItem[];
  allDiaryFilms: RecentlyWatchedItem[];

  // Galería & Firma
  signature: CinematicSignatureData | null;
  curatedGalleryItems: CuratedGalleryItemData[];

  // UI State
  activeTab: PROFILE_TABS_TYPE;
  showDesktopSidebar: boolean;
  isFollowing: boolean;
  followBusy: boolean;
  isCurating: boolean;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthAndProfileRoles: (auth: boolean, isOwn: boolean, isPublic: boolean, targetId: number | null) => void;
  setProfileData: (data: {
    profileHeader: ProfileHeaderData;
    stats: ProfileStatsData;
    followerUsers: ProfileConnection[];
    followingUsers: ProfileConnection[];
    userBadges: any[];
    userLists: UserListSummaryItem[];
    vaultSocialEntries: any[];
    recentlyWatched: RecentlyWatchedItem[];
    watchlistFilms: WatchlistItem[];
    reviewItems: ReviewItem[];
    diaryTimeline: DiaryTimelineItem[];
    allDiaryFilms: RecentlyWatchedItem[];
    signature: CinematicSignatureData | null;
    curatedGalleryItems: CuratedGalleryItemData[];
  }) => void;
  setSignature: (signature: CinematicSignatureData | null) => void;
  setCuratedGalleryItems: (items: CuratedGalleryItemData[]) => void;
  setFollowingState: (isFollowing: boolean, followersCount: number) => void;
  setFollowBusy: (busy: boolean) => void;
  setIsCurating: (curating: boolean) => void;
  setActiveTab: (tab: PROFILE_TABS_TYPE) => void;
  setShowDesktopSidebar: (show: boolean) => void;
  resetStore: () => void;
}

export type {
  ProfileUser,
  CuratedGalleryItemData,
  FollowUserEntry,
  RichDiaryEntry,
  RichWatchlistEntry,
  ReviewEntry,
  CinematicSignatureData,
};
