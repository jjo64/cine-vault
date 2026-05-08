import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Bookmark } from "lucide-react";
import { C, SANS, SERIF, TMDB_BASE } from "../constants";
import type { RichWatchlistEntry } from "../../../services/profileServices";

export function WatchlistWidget({ items }: { items: RichWatchlistEntry[] }) {
  const [dismissed] = useState<Set<number>>(new Set());
  const visible = items.filter((f) => !dismissed.has(f.movie_id)).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(212,175,122,0.025)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bookmark size={13} color={C.accent} />
            <span style={{ fontFamily: SANS, fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: C.accent }}>Watchlist · recordatorios</span>
          </div>
          <span style={{ fontFamily: SANS, fontSize: 9, color: C.textMuted }}>{visible.length} pendientes</span>
        </div>

        <AnimatePresence>
          {visible.length === 0 ? (
            <div style={{ padding: "28px 20px", textAlign: "center" }}>
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: C.textSoft }}>Todo al día. Buen cinéfilo.</p>
            </div>
          ) : (
            visible.map((film, i) => (
              <motion.div key={film.movie_id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.35 }}>
                <div style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 12, alignItems: "flex-start", padding: "14px 20px", borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : "none", transition: "background 0.2s" }}>
                  <Link to={`/film/${film.tmdb_id}`} style={{ textDecoration: "none", display: "block", flexShrink: 0 }}>
                    <div style={{ width: 44, height: 66, overflow: "hidden", border: `1px solid ${C.border}` }}>
                      <img src={film.movie_info?.poster_path ? `${TMDB_BASE}w185${film.movie_info.poster_path}` : ""} alt={film.movie_info?.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.45)" }} />
                    </div>
                  </Link>
                  <div>
                    <Link to={`/film/${film.tmdb_id}`} style={{ fontFamily: SANS, fontSize: 12, color: C.text, textDecoration: "none", display: "block", marginBottom: 2 }}>{film.movie_info?.title}</Link>
                    <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: C.textSoft }}>
                      Añadido {film.added_at ? new Date(film.added_at).toLocaleDateString() : "---"}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
