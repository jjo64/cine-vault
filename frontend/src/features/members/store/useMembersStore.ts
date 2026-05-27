import { create } from "zustand";
import type { MembersStore } from "../types";

export const useMembersStore = create<MembersStore>((set) => ({
  membersMap: new Map(),
  followedIds: new Set(),
  loading: true,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  initializeMembers: (members) => {
    const map = new Map();
    members.forEach((m) => map.set(m.id, m));
    set({ membersMap: map });
  },
  updateMember: (id, member) =>
    set((state) => {
      const nextMap = new Map(state.membersMap);
      nextMap.set(id, member);
      return { membersMap: nextMap };
    }),
  setFollowedIds: (followedIds) => set({ followedIds }),
  toggleFollowOptimistic: (id) =>
    set((state) => {
      const nextSet = new Set(state.followedIds);
      if (nextSet.has(id)) {
        nextSet.delete(id);
      } else {
        nextSet.add(id);
      }
      return { followedIds: nextSet };
    }),
}));
