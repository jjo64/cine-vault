import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Play, Clock, Eye, BookOpen, Film, Trophy, Flame, Plus } from "lucide-react";
import { C, SERIF, SANS } from "../../../constants";
import { movieHref, toPoster, relativeLabel, normalizeRating } from "../../../utils";
import { SectionLabel } from "../../shared/SectionLabel";
import styles from "../../HomeLogged.module.css";
import type { VaultEntry, DiaryEntry, ReviewEntry } from "../../../types";

interface SalaZoneProps {
  vault: VaultEntry[];
  diary: DiaryEntry[];
  reviews: ReviewEntry[];
  username: string;
  greetingName: string;
  watchlistLength: number;
}

export const SalaZone: React.FC<SalaZoneProps> = ({
  vault,
  diary,
  reviews,
  username,
  greetingName,
  watchlistLength
}) => {
  const profileHref = `/${encodeURIComponent((username || greetingName).trim().toLowerCase())}`;
  const myVaultHref = `${profileHref}/vault`;

  const vaultCards = useMemo(() => {
    return vault.slice(0, 3).map((item, index) => {
      const title = item.movie_info?.title || `Pelicula ${item.movie_id}`;
      const type = index % 3 === 0 ? "Reflexion" : index % 3 === 1 ? "Edit" : "Critica";
      return {
        id: item.movie_id,
        tmdbId: item.tmdb_id,
        type,
        title,
        mediaType: item.movie_info?.media_type || "movie",
        duration: ["12 min", "6 min", "18 min"][index % 3],
        views: 800 + index * 320,
        posterUrl: toPoster(item.movie_info?.poster_path),
      };
    });
  }, [vault]);

  const diaryHighlights = useMemo(() => {
    return diary.slice(0, 2).map((entry) => ({
      movieId: entry.movie_id,
      tmdbId: entry.tmdb_id,
      film: entry.movie_info?.title || `Pelicula ${entry.movie_id}`,
      text: entry.review?.content?.trim() || "Sin nota para esta entrada.",
      rating: normalizeRating(entry.review?.rating),
      date: relativeLabel(entry.watched_date || entry.review?.created_at || undefined),
      posterUrl: toPoster(entry.movie_info?.poster_path),
    }));
  }, [diary]);

  const weekStats = useMemo(() => {
    const normalizedProfile = encodeURIComponent((username || greetingName).trim().toLowerCase());
    const reviewHref = normalizedProfile ? `/${normalizedProfile}?tab=Reseñas` : "/profile?tab=Reseñas";

    return [
      { num: String(diary.length), label: "Peliculas", icon: <Film size={16} /> },
      { num: String(reviews.length), label: "Reseñas", icon: <BookOpen size={16} />, href: reviewHref },
      {
        num: String(Math.min(7, Math.max(1, Math.floor((diary.length + watchlistLength) / 2)))),
        label: "Dias de racha",
        icon: <Flame size={16} />,
      },
      { num: String(reviews.length * 40 + diary.length * 15), label: "Puntos", icon: <Trophy size={16} /> },
    ];
  }, [diary.length, reviews.length, watchlistLength, username, greetingName]);

  return (
    <motion.div
      key="sala"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ marginBottom: 48 }}
      >
        <SectionLabel link="Ver todo mi Vault" linkHref={myVaultHref}>
          Mi Vault
        </SectionLabel>
        {vaultCards.length > 0 ? (
          <div className={styles.vaultGrid}>
            {vaultCards.map((item) => (
              <Link
                key={item.id}
                to={movieHref(item.id, item.tmdbId, item.title, item.mediaType)}
                style={{ textDecoration: "none" }}
              >
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    cursor: "pointer",
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ aspectRatio: "16/9", position: "relative", overflow: "hidden" }}>
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: "saturate(0.45) brightness(0.62)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        fontSize: 9,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: C.accent,
                        background: "rgba(8,8,8,0.7)",
                        border: `1px solid ${C.accentDim}`,
                        padding: "2px 7px",
                        fontFamily: SANS,
                      }}
                    >
                      {item.type}
                    </div>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(8,8,8,0.6)", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Play size={11} fill="white" color="white" style={{ marginLeft: 2 }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontFamily: SERIF, fontSize: 15, color: C.text, lineHeight: 1.3, marginBottom: 5 }}>
                      {item.title}
                    </div>
                    <div style={{ display: "flex", gap: 12, fontFamily: SANS, fontSize: 10, color: C.textSoft }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={9} /> {item.duration}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Eye size={9} /> {item.views}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            style={{
              background: C.surface,
              border: `1px dashed ${C.border}`,
              padding: "48px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 32, color: C.accentDim }}>🎞️</div>
            <div style={{ fontFamily: SERIF, fontSize: 18, color: C.text }}>
              Tu Vault está vacío
            </div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: C.textSoft, maxWidth: 440, lineHeight: 1.6 }}>
              El Vault es tu galería y depósito de obras destacadas. Comienza a guardar las películas que te definen como cinéfilo para dar forma a tu vitrina.
            </div>
            <Link
              to={myVaultHref}
              style={{
                marginTop: 8,
                padding: "10px 20px",
                background: C.accent,
                border: "none",
                color: C.bg,
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <Plus size={12} strokeWidth={3} />
              <span>Subir / Agregar al Vault</span>
            </Link>
          </div>
        )}
      </motion.div>

      <div className={styles.twoCol}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ marginBottom: 48 }}
        >
          <SectionLabel link="Abrir diario" linkHref="/diary">
            Mi Diario
          </SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {diaryHighlights.length > 0 ? (
              diaryHighlights.map((entry) => (
                <motion.div
                  key={entry.movieId}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr",
                    gap: 16,
                    padding: "20px 0",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ aspectRatio: "2/3", borderRadius: 1, overflow: "hidden", border: `1px solid ${C.border}` }}>
                    <img
                      src={entry.posterUrl}
                      alt={entry.film}
                      style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.4)" }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                      <span style={{ fontFamily: SERIF, fontSize: 17, color: C.text }}>{entry.film}</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} style={{ fontSize: 10, color: s <= entry.rating ? C.gold : C.textMuted }}>★</span>
                        ))}
                      </div>
                      <span style={{ fontFamily: SANS, fontSize: 10, color: C.textMuted, marginLeft: "auto" }}>{entry.date}</span>
                    </div>
                    <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, lineHeight: 1.6, color: C.textSoft, margin: 0 }}>
                      {entry.text}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div
                style={{
                  padding: "36px 16px",
                  borderBottom: `1px solid ${C.border}`,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 24, color: C.accentDim }}>✍️</div>
                <div style={{ fontFamily: SERIF, fontSize: 16, color: C.text }}>
                  Tu Diario está vacío
                </div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: C.textSoft, maxWidth: 340, lineHeight: 1.5 }}>
                  Comienza a registrar las películas que ves en el día a día. Evalúa, puntúa y guarda tus apuntes personales sobre cada visionado.
                </div>
              </div>
            )}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-diary-search-modal"));
              }}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "12px",
                background: "transparent",
                border: `1px dashed ${C.border}`,
                color: C.textSoft,
                fontFamily: SANS,
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              <BookOpen size={12} /> Registrar nueva entrada en el diario
            </button>
          </div>
        </motion.div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <SectionLabel>Esta semana</SectionLabel>
            <div className={styles.statsGrid}>
              {weekStats.map((s) => {
                const content = (
                  <>
                    <div style={{ color: C.accentDim, marginBottom: 8, display: "flex", justifyContent: "center" }}>
                      {s.icon}
                    </div>
                    <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 300, color: C.text, lineHeight: 1 }}>
                      {s.num}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.textMuted, marginTop: 5 }}>
                      {s.label}
                    </div>
                  </>
                );

                return s.href ? (
                  <Link key={s.label} to={s.href} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "20px 16px", textAlign: "center", textDecoration: "none" }}>
                    {content}
                  </Link>
                ) : (
                  <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "20px 16px", textAlign: "center" }}>
                    {content}
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div style={{ marginTop: 32, padding: 24, background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: C.accent, fontFamily: SANS, marginBottom: 16 }}>
              Mis insignias
            </div>
            {[
              { icon: "🎞️", title: "Maratonista", desc: "5 peliculas en una semana" },
              { icon: "✍️", title: "Critica en desarrollo", desc: "50 reseñas escritas" },
              { icon: "🕯️", title: "Ritual nocturno", desc: "7 noches seguidas" },
            ].map((b) => (
              <div key={b.title} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{b.icon}</span>
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: C.text }}>{b.title}</div>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: C.textSoft }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
