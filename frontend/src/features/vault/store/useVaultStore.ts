import { create } from "zustand";
import type { VaultStore } from "../types";
import { VAULT_USER } from "../constants";

const initialUser = { ...VAULT_USER };

export const useVaultStore = create<VaultStore>((set) => ({
  user: initialUser,
  entries: [],
  isOwner: false,
  loading: true,
  loadError: null,
  activeFilter: "TODO",
  refreshTrigger: 0,

  setLoading: (loading) => set({ loading }),
  setLoadError: (loadError) => set({ loadError }),
  setOwner: (isOwner) => set({ isOwner }),
  setVaultData: (user, entries) => set({ user, entries }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
  triggerRefresh: () => set((s) => ({ refreshTrigger: s.refreshTrigger + 1 })),
  resetStore: () =>
    set({
      user: { ...initialUser },
      entries: [],
      isOwner: false,
      loading: true,
      loadError: null,
      activeFilter: "TODO",
      refreshTrigger: 0,
    }),
}));
