import { useState } from "react";
import type { TabId, SortId, UserListSummary, AuthUser } from "../types";

export type CommunityState = ReturnType<typeof useCommunityState>;

export function useCommunityState() {
  const [allLists, setAllLists] = useState<UserListSummary[]>([]);
  const [myLists, setMyLists] = useState<UserListSummary[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [activeSort, setActiveSort] = useState<SortId>("popular");
  const [searchQuery, setSearchQuery] = useState("");

  return {
    allLists, setAllLists,
    myLists, setMyLists,
    currentUser, setCurrentUser,
    loading, setLoading,
    error, setError,
    activeTab, setActiveTab,
    activeSort, setActiveSort,
    searchQuery, setSearchQuery,
  };
}
