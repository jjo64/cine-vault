import { useMemo } from "react";
import type { CommunityState } from "./useCommunityState";

export function useCommunitySearch(state: CommunityState) {
  const { allLists, myLists, activeTab, activeSort, searchQuery, currentUser } = state;

  const filteredLists = useMemo(() => {
    const officials = allLists.filter((l) => l.is_official);

    let visibleLists =
      activeTab === "mine"
        ? myLists
        : activeTab === "official"
          ? officials
          : allLists;

    if (activeTab === "friends") {
      visibleLists = allLists.filter(
        (l) => !l.is_official && l.user_id !== (currentUser?.id || -1),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      visibleLists = visibleLists.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.description || "").toLowerCase().includes(q) ||
          (l.tags || []).some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (activeSort === "recent") {
      visibleLists = [...visibleLists].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
    } else if (activeSort === "alphabetical") {
      visibleLists = [...visibleLists].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    } else {
      visibleLists = [...visibleLists].sort(
        (a, b) => (b.items_count || 0) - (a.items_count || 0),
      );
    }

    return visibleLists;
  }, [allLists, myLists, activeTab, activeSort, searchQuery, currentUser]);

  const officials = useMemo(() => allLists.filter((l) => l.is_official), [allLists]);

  return { filteredLists, officials };
}
