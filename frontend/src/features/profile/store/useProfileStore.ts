import { create } from "zustand";
import type { ProfileStore, PROFILE_TABS_TYPE } from "../types";
import { IMG } from "../constants";

const initialHeader = {
  displayName: "Perfil",
  username: "perfil",
  memberSince: "2024",
  avatarUrl: IMG.avatar,
  bio: "Sin biografía todavía.",
};

const initialStats = {
  views: 0,
  reviews: 0,
  watchlist: 0,
  following: 0,
  followers: 0,
};

export const useProfileStore = create<ProfileStore>((set) => ({
  loading: true,
  error: null,
  isAuthenticated: false,
  isOwnProfile: false,
  isPublicProfile: false,
  targetUserId: null,
  compatibilityScore: null,

  profileHeader: initialHeader,
  stats: initialStats,
  followerUsers: [],
  followingUsers: [],
  userBadges: [],

  userLists: [],
  vaultSocialEntries: [],

  recentlyWatched: [],
  watchlistFilms: [],
  reviewItems: [],
  diaryTimeline: [],
  allDiaryFilms: [],

  signature: null,
  curatedGalleryItems: [],

  activeTab: "Resumen",
  showDesktopSidebar: true,
  isFollowing: false,
  followBusy: false,
  isCurating: false,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setAuthAndProfileRoles: (isAuthenticated, isOwnProfile, isPublicProfile, targetUserId) =>
    set({ isAuthenticated, isOwnProfile, isPublicProfile, targetUserId }),
  setProfileData: (data) => set({ ...data }),
  setSignature: (signature) => set({ signature }),
  setCuratedGalleryItems: (curatedGalleryItems) => set({ curatedGalleryItems }),
  setFollowingState: (isFollowing, followersCount) =>
    set((state) => ({
      isFollowing,
      stats: { ...state.stats, followers: followersCount },
    })),
  setFollowBusy: (followBusy) => set({ followBusy }),
  setIsCurating: (isCurating) => set({ isCurating }),
  setActiveTab: (activeTab: PROFILE_TABS_TYPE) => set({ activeTab }),
  setShowDesktopSidebar: (showDesktopSidebar) => set({ showDesktopSidebar }),
  resetStore: () =>
    set({
      loading: true,
      error: null,
      isAuthenticated: false,
      isOwnProfile: false,
      isPublicProfile: false,
      targetUserId: null,
      profileHeader: initialHeader,
      stats: initialStats,
      followerUsers: [],
      followingUsers: [],
      userBadges: [],
      userLists: [],
      vaultSocialEntries: [],
      recentlyWatched: [],
      watchlistFilms: [],
      reviewItems: [],
      diaryTimeline: [],
      allDiaryFilms: [],
      signature: null,
      curatedGalleryItems: [],
      activeTab: "Resumen",
      showDesktopSidebar: true,
      isFollowing: false,
      followBusy: false,
      isCurating: false,
      compatibilityScore: null,
    }),
}));
