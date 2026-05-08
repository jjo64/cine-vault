import { motion } from "motion/react";
import { C, SANS, SERIF } from "../constants";
import { SectionLabel } from "./shared/SectionLabel";
import { useTVDetailStore } from "../store/useTVDetailStore";

export function EpisodeTracker() {
  const { detail, watchedIds } = useTVDetailStore();

  if (!detail) return null;

  const seasons =
    detail.season_details?.filter((s) => s.season_number > 0) || [];
  const total = detail.number_of_episodes || 0;
  const watched = watchedIds.size;
  const pct = total > 0 ? Math.round((watched / total) * 100) : 0;

  let cumulative = 0;
  const boundaries = seasons.map((s) => {
    const start = total > 0 ? cumulative / total : 0;
    cumulative += s.episode_count || 0;
    return { season: s.season_number, start: start * 100, subtitle: s.name };
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 64 }}
    >
      <SectionLabel>Tu recorrido</SectionLabel>
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          padding: "28px 32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 42,
              fontWeight: 300,
              color: C.text,
              lineHeight: 1,
            }}
          >
            {watched}
          </span>
          <span style={{ fontFamily: SERIF, fontSize: 20, color: C.textSoft }}>
            de {total} episodios
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: SERIF,
              fontSize: 28,
              color: C.accent,
              lineHeight: 1,
            }}
          >
            {pct}%
          </span>
        </div>
        <div
          style={{
            position: "relative",
            height: 6,
            background: C.border,
            borderRadius: 2,
            marginBottom: 18,
            overflow: "visible",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              height: "100%",
              background: `linear-gradient(to right, ${C.accentDim}, ${C.accent})`,
              borderRadius: 2,
              position: "absolute",
            }}
          />
          {boundaries.slice(1).map((b) => (
            <div
              key={b.season}
              style={{
                position: "absolute",
                top: -3,
                left: `${b.start}%`,
                width: 1,
                height: 12,
                background: C.bg,
                zIndex: 2,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {seasons.map((s, i) => {
            const epCount = s.episode_count || 0;
            const width = total > 0 ? (epCount / total) * 100 : 0;
            const seasonWatched = (s.episodes || []).filter((e) =>
              watchedIds.has(`s${s.season_number}e${e.episode_number}`),
            ).length;
            return (
              <div
                key={s.id}
                style={{
                  width: `${width}%`,
                  paddingRight: i < seasons.length - 1 ? 8 : 0,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: C.textMuted,
                    fontFamily: SANS,
                    marginBottom: 2,
                  }}
                >
                  T{s.season_number}
                </div>
                <div
                  style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}
                >
                  {seasonWatched}/{epCount}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
