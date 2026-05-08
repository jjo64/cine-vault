import { ArrowUpDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { C, SANS } from "../constants";
import { ListSearchBar } from "./shared/ListSearchBar";
import type { TabId, SortId } from "../types";

interface Tab {
  id: TabId;
  label: string;
}

interface SortOption {
  id: SortId;
  label: string;
}

export function FilterBar({
  activeTab,
  setActiveTab,
  activeSort,
  setActiveSort,
  searchQuery,
  setSearchQuery,
  showSortMenu,
  setShowSortMenu,
  sortRef,
  tabs,
  sortOptions,
  showBorder,
}: {
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
  activeSort: SortId;
  setActiveSort: (id: SortId) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showSortMenu: boolean;
  setShowSortMenu: (v: boolean | ((v: boolean) => boolean)) => void;
  sortRef: React.RefObject<HTMLDivElement | null>;
  tabs: readonly Tab[];
  sortOptions: readonly SortOption[];
  showBorder: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: showBorder ? 0 : 36,
        paddingBottom: 28,
        borderTop: showBorder ? `1px solid ${C.border}` : "none",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              background:
                activeTab === tab.id ? "rgba(212,175,122,0.1)" : "transparent",
              border: `1px solid ${activeTab === tab.id ? C.accentDim : C.border}`,
              color: activeTab === tab.id ? C.accent : C.textSoft,
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ListSearchBar value={searchQuery} onChange={setSearchQuery} />

        <div ref={sortRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowSortMenu((v) => !v)}
            style={{
              padding: "9px 14px",
              background: showSortMenu ? "rgba(212,175,122,0.08)" : "transparent",
              border: `1px solid ${showSortMenu ? C.accentDim : C.border}`,
              color: showSortMenu ? C.accent : C.textSoft,
              fontFamily: SANS,
              fontSize: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "all 0.2s",
            }}
          >
            <ArrowUpDown size={11} />
            {sortOptions.find((s) => s.id === activeSort)?.label}
          </button>

          <AnimatePresence>
            {showSortMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: C.elevated,
                  border: `1px solid ${C.border}`,
                  minWidth: 180,
                  zIndex: 100,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                }}
              >
                {sortOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setActiveSort(opt.id);
                      setShowSortMenu(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "11px 16px",
                      background:
                        activeSort === opt.id
                          ? "rgba(212,175,122,0.08)"
                          : "transparent",
                      color: activeSort === opt.id ? C.accent : C.text,
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                  >
                    {activeSort === opt.id && <Check size={11} color={C.accent} />}
                    {activeSort !== opt.id && <div style={{ width: 11 }} />}
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
