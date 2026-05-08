import { create } from "zustand";
import type { CommunityState, TabId, SortId, UserListSummary, AuthUser } from "../types";

interface CommunityStore extends CommunityState {
  setAllLists: (lists: UserListSummary[]) => void;
  setMyLists: (lists: UserListSummary[]) => void;
  setCurrentUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: TabId) => void;
  setActiveSort: (sort: SortId) => void;
  setSearchQuery: (query: string) => void;
}

export const useCommunityStore = create<CommunityStore>((set) => ({
  allLists: [],
  myLists: [],
  currentUser: null,
  loading: true,
  error: null,
  activeTab: "all",
  activeSort: "popular",
  searchQuery: "",

  setAllLists: (allLists) => set({ allLists }),
  setMyLists: (myLists) => set({ myLists }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveSort: (activeSort) => set({ activeSort }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
