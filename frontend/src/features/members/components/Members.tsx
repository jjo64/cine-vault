import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X } from "lucide-react";
import { useMembersStore } from "../store/useMembersStore";
import { useMembersData } from "../hooks/useMembersData";
import { useMembersActions } from "../hooks/useMembersActions";
import { useMembersEnrich } from "../hooks/useMembersEnrich";
import { Grain } from "../../../components/shared/Grain";
import { Navbar } from "./Navbar/Navbar";
import { LoadingState } from "./LoadingState/LoadingState";
import { EmptyStateBanner } from "./EmptyStateBanner/EmptyStateBanner";
import { FeaturedCard } from "./FeaturedCard/FeaturedCard";
import { CommunityCard } from "./CommunityCard/CommunityCard";
import type { Member } from "../types";
import styles from "./Members.module.css";

export const Members: React.FC = () => {
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Initialize data hooks
  useMembersData();
  const { toggleFollow } = useMembersActions();
  const { enrichMember } = useMembersEnrich();

  // Select states from store
  const membersMap = useMembersStore((s) => s.membersMap);
  const followedIds = useMembersStore((s) => s.followedIds);
  const loading = useMembersStore((s) => s.loading);
  const error = useMembersStore((s) => s.error);

  const handleFollow = (id: string) => {
    void enrichMember(id);
    void toggleFollow(id);
  };

  // Derived lists
  const membersArray: Member[] = Array.from(membersMap.values());
  const admins = membersArray.filter((m) => m.role === "admin");
  const editors = membersArray.filter((m) => m.role === "editor");
  const community = membersArray.filter((m) => m.role === "member");

  function filteredBy(list: Member[]): Member[] {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.handle.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q),
    );
  }

  const filteredAdmins = filteredBy(admins);
  const filteredEditors = filteredBy(editors);
  const filteredCommunity = filteredBy(community);

  const showEmpty = followedIds.size === 0 && !loading;
  const suggestions = [...editors.slice(0, 3), ...admins.slice(0, 2)];

  const noResults =
    !loading &&
    query.trim() &&
    filteredAdmins.length === 0 &&
    filteredEditors.length === 0 &&
    filteredCommunity.length === 0;

  // Search input styling
  const searchIconClass = `${styles.searchIcon} ${searchFocused ? styles.searchIconFocused : ""}`;
  const searchInputClass = `${styles.searchInput} ${searchFocused ? styles.searchInputFocused : ""}`;

  return (
    <div className={styles.pageContainer}>
      <Grain />
      <Navbar />

      <div className={styles.pageContent}>
        {/* ── PAGE HEADER ── */}
        <div className={styles.headerSection}>
          <div className={styles.gridOverlay} />
          <div className={styles.glowBackdrop} />

          <div className={styles.headerInner}>
            <div className={styles.headerRow}>
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className={styles.headerTag}
                >
                  La Vitrina · Comunidad
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.08 }}
                  className={styles.headerTitle}
                >
                  CineVault Society
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className={styles.headerDescription}
                >
                  {loading
                    ? "Cargando la comunidad…"
                    : `${membersArray.length} cinéfilos. ${admins.length + editors.length} editores. Una sola obsesión.`}
                </motion.p>
              </div>

              {/* Search bar */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className={styles.searchWrapper}
              >
                <Search size={13} className={searchIconClass} />
                <input
                  id="members-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Buscar miembros…"
                  className={searchInputClass}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className={styles.clearBtn}
                  >
                    <X size={12} />
                  </button>
                )}
              </motion.div>
            </div>

            {/* Tab stats */}
            <div className={styles.tabsContainer}>
              {[
                { label: "Todos", count: membersArray.length },
                { label: "Admins", count: admins.length },
                { label: "Editores", count: editors.length },
                { label: "Comunidad", count: community.length },
              ].map((tab, i) => {
                const countClass = `${styles.tabCount} ${i === 0 ? styles.tabCountFirst : ""}`;
                const tabClass = `${styles.tabItem} ${i === 3 ? styles.tabItemLast : ""}`;
                return (
                  <div key={tab.label} className={tabClass}>
                    <span className={countClass}>{tab.count}</span>
                    <span className={styles.tabLabel}>{tab.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className={styles.mainContent}>
          {/* Loading state */}
          {loading && <LoadingState />}

          {/* Error state */}
          {!loading && error && (
            <div className={styles.errorSection}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          {/* Empty state banner (no following yet) */}
          {!loading && !error && (
            <AnimatePresence>
              {showEmpty && (
                <motion.div
                  key="empty-banner"
                  initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                  animate={{ opacity: 1, height: "auto", overflow: "visible" }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.5 }}
                >
                  <EmptyStateBanner
                    suggestions={suggestions}
                    followed={followedIds}
                    onFollow={handleFollow}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* No search results */}
          {noResults && (
            <div className={styles.noResultsSection}>
              <p className={styles.noResultsText}>
                Ningún miembro coincide con &ldquo;{query}&rdquo;
              </p>
              <button
                onClick={() => setQuery("")}
                className={styles.clearQueryBtn}
              >
                Limpiar búsqueda
              </button>
            </div>
          )}

          {/* ── ADMINS SECTION ── */}
          {!loading && !error && filteredAdmins.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={`${styles.sectionIndicator} ${styles.sectionIndicatorAdmin}`} />
                <div>
                  <h2 className={styles.sectionTitle}>Fundadores</h2>
                  <p className={styles.sectionSubtitle}>
                    Los que construyeron CineVault desde cero
                  </p>
                </div>
              </div>
              <div className={styles.adminsGrid}>
                {filteredAdmins.map((m) => (
                  <FeaturedCard
                    key={m.id}
                    member={m}
                    isFollowed={followedIds.has(m.id)}
                    onFollow={() => handleFollow(m.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── EDITORS SECTION ── */}
          {!loading && !error && filteredEditors.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={`${styles.sectionIndicator} ${styles.sectionIndicatorEditor}`} />
                <div>
                  <h2 className={styles.sectionTitle}>Editores</h2>
                  <p className={styles.sectionSubtitle}>
                    Curadores de contenido editorial e imprescindibles del feed
                  </p>
                </div>
                <div className={styles.sectionLine} />
                <span className={styles.sectionCount}>
                  {filteredEditors.length} editores
                </span>
              </div>
              <div className={styles.editorsGrid}>
                {filteredEditors.map((m) => (
                  <FeaturedCard
                    key={m.id}
                    member={m}
                    isFollowed={followedIds.has(m.id)}
                    onFollow={() => handleFollow(m.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── COMMUNITY GRID ── */}
          {!loading && !error && filteredCommunity.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={`${styles.sectionIndicator} ${styles.sectionIndicatorCommunity}`} />
                <div>
                  <h2 className={styles.sectionTitle}>Comunidad</h2>
                  <p className={styles.sectionSubtitle}>
                    La sociedad de cinéfilos que construye CineVault cada día
                  </p>
                </div>
                <div className={styles.sectionLine} />
                <span className={styles.sectionCount}>
                  {filteredCommunity.length} miembros
                </span>
              </div>
              <div className={styles.communityGrid}>
                {filteredCommunity.map((m, i) => (
                  <CommunityCard
                    key={m.id}
                    member={m}
                    index={i}
                    isFollowed={followedIds.has(m.id)}
                    onFollow={() => handleFollow(m.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
