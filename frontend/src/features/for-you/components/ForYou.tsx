import { motion } from "motion/react";
import { ChevronRight, Users } from "lucide-react";
import { C, SANS } from "../constants";
import { useForYouStore } from "../store/useForYouStore";
import { useForYouData } from "../hooks/useForYouData";
import { Grain } from "./shared/Grain";
import { Navbar } from "./shared/Navbar";
import { DailyHero } from "./DailyHero";
import { EmptyState } from "./EmptyState";
import { FeedHeader } from "./FeedHeader";
import { EmptyFeed } from "./EmptyFeed";
import { ActivityCard } from "./ActivityCard";
import { QuickStatsWidget } from "./QuickStatsWidget";
import { TrendingWidget } from "./TrendingWidget";
import { WatchlistWidget } from "./WatchlistWidget";

export function ForYou() {
  const {
    user,
    tonightMovie,
    forYouFeed,
    activityFeed,
    profile,
    watchlist,
    showOnboarding,
    loading,
  } = useForYouStore();

  useForYouData();

  if (loading && !user) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 24, color: C.accentDim }}
        >
          Preparando tu Vault...
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <Grain />
      <Navbar user={user} />

      {/* Hero */}
      {!showOnboarding && tonightMovie ? (
        <DailyHero film={tonightMovie} isNewUser={showOnboarding} />
      ) : (
        <div style={{ height: 60 }} />
      )}

      {/* New user empty hero */}
      {showOnboarding && <EmptyState />}

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: showOnboarding ? "48px 40px 80px" : "40px 40px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "flex-start" }}>
          {/* LEFT: Community Feed */}
          <div>
            <FeedHeader />
            {activityFeed.length === 0 ? (
              <EmptyFeed isNewUser={showOnboarding} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {activityFeed.map((item, i) => (
                  <ActivityCard key={item.id} item={item} index={i} />
                ))}

                {/* Load more */}
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ paddingTop: 24 }}>
                  <button style={{ width: "100%", padding: "14px", background: "transparent", border: `1px solid ${C.border}`, color: C.textSoft, fontFamily: SANS, fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
                    Cargar más actividad <ChevronRight size={10} />
                  </button>
                </motion.div>
              </div>
            )}
          </div>

          {/* RIGHT: Widgets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, position: "sticky", top: 80 }}>
            {/* QuickStatsWidget needs profile info. For now, it might need additional data or state. 
                Wait, in original ForYou.tsx, profile was fetched separately. I'll need to update useForYouData to fetch it.
            */}
            <QuickStatsWidget user={profile} /> 
            <div style={{ height: 8 }} />
            <TrendingWidget items={forYouFeed} />
            <div style={{ height: 8 }} />
            <WatchlistWidget items={watchlist} />

            {/* Discover people CTA */}
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ marginTop: 10 }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "20px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 100%, ${C.accentGlow} 0%, transparent 60%)`, pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontFamily: SANS, fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: C.accent, marginBottom: 10 }}>Descubrí cinéfilos</div>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 14, color: C.textSoft, lineHeight: 1.65, margin: "0 0 16px" }}>
                    Conectá con personas que ven el mismo cine que vos.
                  </p>
                  <button style={{ width: "100%", padding: "10px 16px", background: C.accentGlow, border: `1px solid ${C.accentDim}`, color: C.accent, fontFamily: SANS, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s" }}>
                    <Users size={10} /> Ver miembros
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
