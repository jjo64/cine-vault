import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useParams, useSearchParams } from "react-router-dom";
import { useProfileStore } from "../store/useProfileStore";
import { useProfileData } from "../hooks/useProfileData";
import { PROFILE_TABS, SIDEBAR_MIN_WIDTH } from "../constants";
import type { PROFILE_TABS_TYPE, CinematicSignaturePayload } from "../types";
import {
  followUser,
  unfollowUser,
  updateOwnerCinematicSignature,
  updateOwnerCuratedGallery,
} from "../../../services/profileServices";
import { getStoredAccessToken } from "../../../services/authServices";
import { notify } from "../../../lib/notify";
import { SeoHead } from "../../../components/SeoHead";
import { GrainOverlay } from "./primitives/primitives";
import { ProfileHero } from "./layout/ProfileHero/ProfileHero";
import { TabsBar } from "./layout/TabsBar/TabsBar";
import { Footer } from "./layout/Footer/Footer";
import { CinematicSignature } from "./CinematicSignature/CinematicSignature";
import { CompatibilityBanner } from "./CompatibilityBanner/CompatibilityBanner";
import { CuratedGalleryModal } from "./CuratedGalleryModal/CuratedGalleryModal";

// Panels
import { OverviewPanel } from "./panels/OverviewPanel/OverviewPanel";
import { DiaryPanel } from "./panels/DiaryPanel/DiaryPanel";
import { VaultPanel } from "./panels/VaultPanel/VaultPanel";
import { WatchlistPanel } from "./panels/WatchlistPanel/WatchlistPanel";
import { ReviewsPanel } from "./panels/ReviewsPanel/ReviewsPanel";
import { ListsPanel } from "./panels/ListsPanel/ListsPanel";
import { ProfileSidebar } from "./panels/ProfileSidebar/ProfileSidebar";

import styles from "./Profile.module.css";

export function Profile() {
  const { username } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Store variables
  const loading = useProfileStore((s) => s.loading);
  const error = useProfileStore((s) => s.error);
  const isAuthenticated = useProfileStore((s) => s.isAuthenticated);
  const isOwnProfile = useProfileStore((s) => s.isOwnProfile);
  const isPublicProfile = useProfileStore((s) => s.isPublicProfile);
  const targetUserId = useProfileStore((s) => s.targetUserId);
  const profileHeader = useProfileStore((s) => s.profileHeader);
  const stats = useProfileStore((s) => s.stats);
  const recentlyWatched = useProfileStore((s) => s.recentlyWatched);
  const watchlistFilms = useProfileStore((s) => s.watchlistFilms);
  const reviewItems = useProfileStore((s) => s.reviewItems);
  const diaryTimeline = useProfileStore((s) => s.diaryTimeline);
  const userLists = useProfileStore((s) => s.userLists);
  const signature = useProfileStore((s) => s.signature);
  const curatedGalleryItems = useProfileStore((s) => s.curatedGalleryItems);
  const userBadges = useProfileStore((s) => s.userBadges);
  const allDiaryFilms = useProfileStore((s) => s.allDiaryFilms);
  const vaultSocialEntries = useProfileStore((s) => s.vaultSocialEntries);

  const activeTab = useProfileStore((s) => s.activeTab);
  const showDesktopSidebar = useProfileStore((s) => s.showDesktopSidebar);
  const isFollowing = useProfileStore((s) => s.isFollowing);
  const followBusy = useProfileStore((s) => s.followBusy);
  const isCurating = useProfileStore((s) => s.isCurating);

  // Store actions
  const setActiveTab = useProfileStore((s) => s.setActiveTab);
  const setShowDesktopSidebar = useProfileStore((s) => s.setShowDesktopSidebar);
  const setFollowingState = useProfileStore((s) => s.setFollowingState);
  const setFollowBusy = useProfileStore((s) => s.setFollowBusy);
  const setSignature = useProfileStore((s) => s.setSignature);
  const setCuratedGalleryItems = useProfileStore((s) => s.setCuratedGalleryItems);
  const setIsCurating = useProfileStore((s) => s.setIsCurating);

  // Load profile data hook
  useProfileData(username);

  // Sync sidebar visibility based on window size
  useEffect(() => {
    const syncSidebarVisibility = () => {
      setShowDesktopSidebar(window.innerWidth >= SIDEBAR_MIN_WIDTH);
    };

    syncSidebarVisibility();
    window.addEventListener("resize", syncSidebarVisibility);
    return () => window.removeEventListener("resize", syncSidebarVisibility);
  }, [setShowDesktopSidebar]);

  // Tab Sync with URL
  const tabFromQuery = searchParams.get("tab");
  const isValidTab = (value: string | null): value is PROFILE_TABS_TYPE =>
    Boolean(value) && PROFILE_TABS.includes(value as PROFILE_TABS_TYPE);

  const normalizeTab = (value: string | null): PROFILE_TABS_TYPE =>
    isValidTab(value) ? (value as PROFILE_TABS_TYPE) : "Resumen";

  useEffect(() => {
    const tab = normalizeTab(tabFromQuery);
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tabFromQuery]);

  const handleTabChange = (tab: PROFILE_TABS_TYPE) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  // Follow/Unfollow handler
  const handleToggleFollow = async () => {
    if (!targetUserId || followBusy) return;
    const token = getStoredAccessToken();
    if (!token) return;

    const previousFollowing = isFollowing;
    const previousFollowers = stats.followers;

    setFollowBusy(true);
    setFollowingState(
      !previousFollowing,
      Math.max(0, previousFollowers + (previousFollowing ? -1 : 1)),
    );

    try {
      if (previousFollowing) {
        await unfollowUser(targetUserId, token);
      } else {
        await followUser(targetUserId, token);
      }
    } catch {
      setFollowingState(previousFollowing, previousFollowers);
    } finally {
      setFollowBusy(false);
    }
  };

  // Signature Save handler
  const handleSaveSignature = async (
    payload: Partial<CinematicSignaturePayload>,
  ) => {
    const token = getStoredAccessToken();
    if (!token) return;
    const response = await updateOwnerCinematicSignature(token, payload);
    setSignature(response.data);
  };

  // Curated gallery modal handlers
  const handleCurateGallery = () => {
    setIsCurating(true);
  };

  const handleSaveCurated = async (selectedIds: number[]) => {
    const token = getStoredAccessToken();
    if (!token) return;

    try {
      const response = await updateOwnerCuratedGallery(
        token,
        selectedIds.map((movieId, index) => ({
          movie_id: movieId,
          order_index: index + 1,
        })),
      );

      setCuratedGalleryItems(response.data.items);
      setIsCurating(false);
      notify.success("Galería actualizada correctamente");
    } catch (err) {
      console.error(err);
      notify.error("No se pudo guardar la galería");
    }
  };

  const canEditProfile = isAuthenticated && isOwnProfile;

  // Memoized Curated Gallery parameters for Overview panel
  const localCuratedMovieIds = useMemo(
    () =>
      [...curatedGalleryItems]
        .sort((a, b) => a.order_index - b.order_index)
        .map((item) => item.movie_id),
    [curatedGalleryItems],
  );

  const curatedNotesByMovieId = useMemo(() => {
    const entries = curatedGalleryItems
      .filter((item) => item.note && item.note.trim().length > 0)
      .map((item) => [item.movie_id, item.note!.trim()] as const);
    return Object.fromEntries(entries) as Record<number, string>;
  }, [curatedGalleryItems]);

  const showGuestHint = !loading && !targetUserId && !isAuthenticated;
  const profileSlug = encodeURIComponent(
    (profileHeader.username || username || "").trim(),
  );
  const canonical = profileSlug
    ? `https://cinevault.art/${profileSlug}`
    : "https://cinevault.art/";
  const seoTitle = `${profileHeader.displayName} | Perfil en CineVault`;
  const seoDescription = `Actividad, listas y reseñas de ${profileHeader.displayName} en CineVault.`;

  const panels: Record<PROFILE_TABS_TYPE, ReactNode> = {
    Resumen: (
      <OverviewPanel
        stats={stats}
        recentlyWatched={recentlyWatched}
        watchlistFilms={watchlistFilms}
        reviewItems={reviewItems}
        vaultSocialEntries={vaultSocialEntries}
        curatedMovieIds={localCuratedMovieIds}
        curatedNotesByMovieId={curatedNotesByMovieId}
        allDiaryFilms={allDiaryFilms}
        canEditCurated={canEditProfile}
        onCurateGallery={handleCurateGallery}
        onJumpToTab={(tab: "Vault" | "Watchlist" | "Reseñas" | "Diario") =>
          handleTabChange(tab)
        }
      />
    ),
    Diario: <DiaryPanel diaryTimeline={diaryTimeline} />,
    Vault: (
      <VaultPanel vaultItems={vaultSocialEntries} canManage={isOwnProfile} />
    ),
    Watchlist: (
      <WatchlistPanel
        watchlistFilms={watchlistFilms}
        canManage={isOwnProfile}
      />
    ),
    Reseñas: (
      <ReviewsPanel
        reviewItems={reviewItems}
        canManageReviews={canEditProfile}
      />
    ),
    Listas: <ListsPanel userLists={userLists} />,
  };

  return (
    <div className={styles.mainContainer}>
      {isPublicProfile ? (
        <SeoHead.Profile
          title={seoTitle}
          description={seoDescription}
          canonical={canonical}
          image={profileHeader.avatarUrl}
        />
      ) : (
        <SeoHead.NoIndex
          title={seoTitle}
          description={seoDescription}
          canonical={canonical}
          image={profileHeader.avatarUrl}
        />
      )}

      <GrainOverlay />

      <ProfileHero onToggleFollow={handleToggleFollow} />

      {isPublicProfile && (
        <CompatibilityBanner
          reviewsCount={stats.reviews}
          followersCount={stats.followers}
        />
      )}

      <CinematicSignature
        value={signature}
        canEdit={canEditProfile}
        onSave={handleSaveSignature}
      />

      <TabsBar
        active={activeTab}
        onSelect={(tab) => handleTabChange(tab)}
      />

      <div className={styles.pageContentWrapper}>
        {loading && (
          <div className={styles.loadingText}>
            Cargando perfil...
          </div>
        )}
        {error && (
          <div className={styles.errorText}>{error}</div>
        )}
        {showGuestHint && (
          <div className={styles.loadingText}>
            Para ver un perfil publico como invitado usa una ruta como
            /nombre_usuario.
          </div>
        )}

        <div className={styles.gridLayout}>
          <div className={styles.gridMain}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {panels[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
          {showDesktopSidebar && (
            <ProfileSidebar
              recentlyWatched={recentlyWatched}
              reviewItems={reviewItems}
              userBadges={userBadges}
            />
          )}
        </div>
      </div>

      <Footer />

      <AnimatePresence>
        {isCurating && (
          <CuratedGalleryModal
            available={allDiaryFilms}
            initialSelected={localCuratedMovieIds}
            onClose={() => setIsCurating(false)}
            onSave={handleSaveCurated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
