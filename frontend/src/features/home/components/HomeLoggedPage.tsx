import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { logoutCurrentUser } from "../../../services/authServices";

import { useHomeData } from "../hooks/useHomeData";
import { useHomeNavigation } from "../hooks/useHomeNavigation";
import { useFeedActions } from "../hooks/useFeedActions";

import { C, ZONES, SANS, SERIF } from "../constants";
import { toPoster } from "../utils";

import { GreetingBar } from "./shared/GreetingBar";
import { Grain } from "./shared/SafeImg";
import { EntradaZone } from "./zones/Entrada/EntradaZone";
import { SalaZone } from "./zones/Sala/SalaZone";
import { VitrinaZone } from "./zones/Vitrina/VitrinaZone";
import OnboardingModal from "../../../components/onboarding/OnboardingModal";

import styles from "./HomeLogged.module.css";
import type { HomeLoggedProps } from "../types";

export const HomeLoggedPage: React.FC<HomeLoggedProps> = ({ username }) => {
  const navigate = useNavigate();
  const greetingName = username || "Cinéfilo";

  const {
    loading,
    error,
    diary,
    watchlist,
    reviews,
    vault,
    publicLists,
    followingReviews,
    directors,
    arcos,
    forYouMovies,
    tonightMovie,
    needsOnboarding,
    setNeedsOnboarding,
    setFollowingReviews,
  } = useHomeData(username);

  const { activeZone, setActiveZone } = useHomeNavigation();
  const { likedFeedIds, likeBusyIds, handleToggleFeedLike } = useFeedActions(setFollowingReviews);

  const [watchedTonight, setWatchedTonight] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const directorCards = useMemo(() => {
    return directors.slice(0, 6).map((d) => ({
      id: d.id,
      name: d.name,
      nationality: "Descubrimiento",
      films: d.score || 0,
      img: toPoster(d.profile_path),
    }));
  }, [directors]);

  const communityLists = useMemo(() => {
    return publicLists.slice(0, 3).map((list) => ({
      id: list.id,
      title: list.name,
      count: list.items_count || 0,
      user: list.owner ? `@${list.owner.username}` : "@comunidad",
      img: list.custom_cover || (list.posters?.[0] ? `https://image.tmdb.org/t/p/w500${list.posters[0]}` : "/no-poster.svg"),
      href: `/lists/${list.id}`,
    }));
  }, [publicLists]);

  const hasData = tonightMovie || forYouMovies.length > 0 || followingReviews.length > 0;

  if (loading && !hasData) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Cargando CineVault...</p>
      </div>
    );
  }

  return (
    <div 
      className={styles.homeRoot} 
      style={{ 
        background: C.bg, 
        minHeight: "100vh", 
        color: C.text, 
        fontFamily: SANS,
        // Inject CSS variables for the module
        ["--color-bg" as any]: C.bg,
        ["--color-border" as any]: C.border,
        ["--color-accent" as any]: C.accent,
        ["--color-accent-dim" as any]: C.accentDim,
        ["--color-accent-glow" as any]: "rgba(212, 175, 122, 0.15)",
        ["--color-text" as any]: C.text,
        ["--color-text-soft" as any]: C.textSoft,
        ["--color-text-muted" as any]: C.textMuted,
        ["--font-serif" as any]: SERIF,
        ["--font-sans" as any]: SANS,
      }}
    >
      <Grain />

      <div className={styles.navOffset}>
        <GreetingBar 
          greetingName={greetingName}
          diaryLength={diary.length}
          reviewsLength={reviews.length}
          watchlistLength={watchlist.length}
        />
      </div>

      <div className={styles.zones}>
        {ZONES.map((zone, i) => {
          const isActive = activeZone === zone.id;
          return (
            <motion.button
              key={zone.id}
              onClick={() => setActiveZone(zone.id)}
              className={`${styles.zoneBtn} ${isActive ? styles.active : ""} ${i < 2 ? styles.withBorder : ""}`}
              whileHover={{ scale: 1.01 }}
            >
              <div className={styles.zoneBg} />
              <div className={styles.zoneLine} />
              {isActive && <div className={styles.zoneGlow} />}
              <div className={styles.zoneInner}>
                <div className={styles.zoneSymbolWrap}>
                  <span className={styles.zoneSymbol}>{zone.symbol}</span>
                  <div className={styles.zoneDot} />
                </div>
                <div className={styles.zoneInfo}>
                  <div className={styles.zoneName}>{zone.name}</div>
                  <div className={styles.zoneSubtitle}>{zone.subtitle}</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <main className={styles.mainContent}>
        {error && <div style={{ color: "#FF8A8A", marginBottom: 16 }}>{error}</div>}

        <AnimatePresence mode="wait">
          {activeZone === "entrada" && (
            <EntradaZone 
              tonightFilm={tonightMovie}
              forYouMovies={forYouMovies}
              diary={diary}
              followingReviews={followingReviews}
              likedFeedIds={likedFeedIds}
              likeBusyIds={likeBusyIds}
              handleToggleFeedLike={handleToggleFeedLike}
              watchedTonight={watchedTonight}
              setWatchedTonight={setWatchedTonight}
            />
          )}
          {activeZone === "sala" && (
            <SalaZone 
              vault={vault}
              diary={diary}
              reviews={reviews}
              username={username}
              greetingName={greetingName}
              watchlistLength={watchlist.length}
            />
          )}
          {activeZone === "vitrina" && (
            <VitrinaZone 
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              arcos={arcos}
              directorCards={directorCards}
              communityLists={communityLists}
            />
          )}
        </AnimatePresence>

        <div style={{ marginTop: 64, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={async () => {
              await logoutCurrentUser();
              navigate("/");
            }}
            style={{
              border: `1px solid ${C.border}`,
              background: C.elevated,
              color: "#FF8A8A",
              padding: "9px 12px",
              fontSize: 11,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </main>

      {needsOnboarding && (
        <OnboardingModal onComplete={() => setNeedsOnboarding(false)} />
      )}
    </div>
  );
};
