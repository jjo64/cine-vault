import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { TrendingUp, ChevronRight } from "lucide-react";
import { C, SANS, SERIF, TMDB_BASE } from "../constants";
import { Stars } from "./shared/Stars";
import type { ForYouItem, ForYouMovieItem } from "../../../services/socialServices";

export function TrendingWidget({ items }: { items: ForYouItem[] }) {
  const mediaItems = items
    .filter((i) => i.type === "media")
    .slice(0, 4) as ForYouMovieItem[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      style={{ marginBottom: 2 }}
    >
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(212,175,122,0.025)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={13} color={C.accent} />
            <span style={{ fontFamily: SANS, fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: C.accent }}>Tendencias para ti</span>
          </div>
          <span style={{ fontFamily: SANS, fontSize: 9, color: C.textMuted, letterSpacing: "0.08em" }}>Sugerido</span>
        </div>

        <div>
          {mediaItems.length === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center" }}>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: C.textSoft, lineHeight: 1.6, margin: 0 }}>
                Aún no tenemos recomendaciones. Completá tu perfil para ver qué te sugerimos.
              </p>
            </div>
          ) : (
            mediaItems.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}>
                <Link to={`/film/${item.media.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "24px 44px 1fr auto", gap: 12, alignItems: "center", padding: "12px 20px", borderBottom: i < mediaItems.length - 1 ? `1px solid ${C.border}` : "none", transition: "background 0.2s", cursor: "pointer" }}>
                    <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: i === 0 ? C.accent : C.textMuted, textAlign: "center" }}>{i + 1}</span>
                    <div style={{ width: 44, height: 66, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.4)", flexShrink: 0 }}>
                      <img src={item.media.poster_path ? `${TMDB_BASE}w185${item.media.poster_path}` : ""} alt={item.media.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.5)" }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: SANS, fontSize: 12, color: C.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.media.title}</div>
                      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: C.textSoft, marginBottom: 5 }}>{item.media.year}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Stars n={Math.round(item.media.vote_average / 2)} size={9} />
                        <span style={{ fontFamily: SANS, fontSize: 9, color: C.textMuted }}>{item.media.reason}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 10, color: "#5aab7a", letterSpacing: "0.06em", textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                      <span>{Math.round(item.media.vote_average * 10)}%</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}` }}>
          <Link to="/search" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: SANS, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: C.textMuted, textDecoration: "none" }}>
            Ver más tendencias <ChevronRight size={9} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
