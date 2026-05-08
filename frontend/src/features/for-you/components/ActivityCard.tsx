import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Heart, ArrowRight } from "lucide-react";
import { C, SANS, SERIF, TMDB_BASE } from "../constants";
import { GlowCard } from "./shared/GlowCard";
import { Stars } from "./shared/Stars";
import type { ActivityItem } from "../../../services/socialServices";

export function ActivityCard({ item, index }: { item: ActivityItem; index: number }) {
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const color = "212,175,122";
  const MAX_CHARS = 140;
  const content = item.review?.content || "";
  const isLong = content.length > MAX_CHARS;
  const displayReview = expanded || !isLong ? content : content.slice(0, MAX_CHARS) + "…";

  const actionText = (type: string) => {
    switch (type) {
      case "review_published": return "reseñó";
      case "diary_entry": return "añadió al Diario";
      case "vault_added": return "añadió al Vault";
      case "watchlist_added": return "añadió a su Watchlist";
      case "review_liked": return "le gusta la reseña de";
      default: return "publicó";
    }
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.06 }}
    >
      <GlowCard dominantColor={color} style={{ marginBottom: 2, cursor: "default" }}>
        <div style={{ padding: "22px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr auto", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                flexShrink: 0,
                background: item.user.avatar_url ? `url(${item.user.avatar_url}) center/cover` : `rgba(${color}, 0.12)`,
                border: `1.5px solid rgba(${color}, 0.35)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: SERIF,
                fontSize: 17,
                color: C.accent,
                boxShadow: `0 0 12px rgba(${color}, 0.15)`,
              }}
            >
              {!item.user.avatar_url && item.user.username.slice(0, 1).toUpperCase()}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                <Link to={`/vault/${item.user.username}`} style={{ fontFamily: SANS, fontSize: 13, color: C.text, textDecoration: "none" }}>
                  {item.user.username}
                </Link>
                <span style={{ fontFamily: SANS, fontSize: 11, color: C.textSoft }}>{actionText(item.type)}</span>
                {item.movie && (
                  <Link to={`/film/${item.movie.tmdb_id}`} style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: C.accent, textDecoration: "none" }}>
                    {item.movie.title || `Película #${item.movie.tmdb_id}`}
                  </Link>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {item.review?.rating && <Stars n={Math.round(item.review.rating / 2)} size={11} />}
                <span style={{ fontFamily: SANS, fontSize: 10, color: C.textMuted }}>·</span>
                <span style={{ fontFamily: SANS, fontSize: 10, color: C.textMuted, letterSpacing: "0.06em" }}>{timeAgo(item.created_at)}</span>
              </div>
            </div>

            {item.movie?.tmdb_id && (
              <Link to={`/film/${item.movie.tmdb_id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                <div style={{ width: 42, height: 63, overflow: "hidden", background: C.elevated, border: `1px solid rgba(${color}, 0.3)`, boxShadow: `0 4px 16px rgba(0,0,0,0.5), 0 0 12px rgba(${color}, 0.12)`, transition: "transform 0.2s" }}>
                  {item.movie.poster_path ? (
                    <img src={`${TMDB_BASE}w154${item.movie.poster_path}`} alt={item.movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: C.textMuted }}>Film</div>
                  )}
                </div>
              </Link>
            )}
          </div>

          {content && (
            <>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, lineHeight: 1.68, color: "rgba(226,226,226,0.65)", margin: "0 0 4px", borderLeft: `2px solid rgba(${color}, 0.3)`, paddingLeft: 14 }}>
                {displayReview}
              </p>
              {isLong && (
                <button onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: C.accentDim, fontFamily: SANS, fontSize: 10, letterSpacing: "0.14em", padding: "4px 0 0 14px" }}>
                  {expanded ? "Ver menos" : "Ver más"}
                </button>
              )}
            </>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <button onClick={() => setLiked((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: liked ? C.accent : C.textSoft, fontFamily: SANS, fontSize: 11, padding: 0 }}>
              <Heart size={12} strokeWidth={1.5} fill={liked ? C.accent : "none"} />
              {liked ? 1 : 0}
            </button>
            <div style={{ flex: 1 }} />
            {item.movie && (
              <Link to={`/film/${item.movie.tmdb_id}`} style={{ fontFamily: SANS, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.textMuted, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                Ver ficha <ArrowRight size={9} />
              </Link>
            )}
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
}
