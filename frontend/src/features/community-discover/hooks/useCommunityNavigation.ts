import { useState, useRef, useEffect } from "react";
import type { CommunityState } from "./useCommunityState";

export function useCommunityNavigation(state: CommunityState) {
  const { activeTab, setActiveTab, activeSort, setActiveSort, searchQuery, setSearchQuery } = state;
  const [modalOpen, setModalOpen] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return {
    activeTab,
    setActiveTab,
    activeSort,
    setActiveSort,
    searchQuery,
    setSearchQuery,
    modalOpen,
    setModalOpen,
    showSortMenu,
    setShowSortMenu,
    sortRef,
  };
}
