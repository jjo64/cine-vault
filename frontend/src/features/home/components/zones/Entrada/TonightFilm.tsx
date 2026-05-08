import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Check, Trophy, ArrowRight } from "lucide-react";
import { C, SERIF, SANS } from "../../../constants";
import { movieHref } from "../../../utils";
import { SectionLabel } from "../../shared/SectionLabel";
import { SafeImg } from "../../shared/SafeImg";
import type { MovieMeta } from "../../../types";
import styles from "../../HomeLogged.module.css";

interface TonightFilmProps {
  tonightFilm: MovieMeta | null;
  watchedTonight: boolean;
  setWatchedTonight: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TonightFilm: React.FC<TonightFilmProps> = ({
  tonightFilm,
  watchedTonight,
  setWatchedTonight,
}) => {
  if (!tonightFilm) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ marginBottom: 56 }}
      >
        <SectionLabel link="Ver catalogo" linkHref="/search">
          Esta noche para vos
        </SectionLabel>
        <div
          style={{
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.textSoft,
            padding: 20,
          }}
        >
          Todavia no hay peliculas para recomendarte esta noche.
        </div>
      </motion.div>
    );
  }

  // Points calculation (mocked as in original)
  const points = 50; 

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      style={{ marginBottom: 56 }}
    >
      <SectionLabel link="Ver catalogo" linkHref="/search">
        Esta noche para vos
      </SectionLabel>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.accent}`,
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <SafeImg
            src={tonightFilm.backdropUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center center",
              filter: "saturate(0.28) brightness(0.33)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(8,8,8,0.96) 34%, rgba(8,8,8,0.76) 63%, rgba(8,8,8,0.45) 86%, rgba(8,8,8,0.24) 100%)",
            }}
          />
        </div>
        
        <div className={styles.tonightInner}>
          <Link
            to={movieHref(0, 0, tonightFilm.title)} // ID logic needs sync
            className={styles.tonightPoster}
            style={{ textDecoration: "none" }}
          >
            <div style={{ width: "100%", height: "100%" }}>
              <SafeImg
                src={tonightFilm.posterUrl}
                alt={tonightFilm.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "saturate(0.7)",
                }}
              />
            </div>
          </Link>
          <div style={{ maxWidth: 620, paddingTop: 10 }}>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 9,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: C.accent,
                marginBottom: 10,
                lineHeight: 1,
              }}
            >
              Recomendacion personal
            </div>
            <Link
              to={movieHref(0, 0, tonightFilm.title)}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: "clamp(26px,3vw,38px)",
                  fontWeight: 300,
                  lineHeight: 1.05,
                  color: C.text,
                  marginBottom: 4,
                  letterSpacing: "-0.01em",
                }}
              >
                {tonightFilm.title}
              </div>
            </Link>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.accent,
                marginBottom: 6,
              }}
            >
              {tonightFilm.director}
            </div>
            <div
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 16,
                color: C.textSoft,
                marginBottom: 14,
                lineHeight: 1.1,
              }}
            >
              {tonightFilm.year || "N/D"} · {tonightFilm.runtimeLabel}
            </div>
            <p
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 16,
                lineHeight: 1.65,
                color: "rgba(226,226,226,0.65)",
                margin: "0 0 18px",
                maxWidth: 520,
                minHeight: 78,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {tonightFilm.overview}
            </p>
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {tonightFilm.genres.map((g) => (
                <span
                  key={g}
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: C.textSoft,
                    border: `1px solid ${C.border}`,
                    padding: "3px 9px",
                    fontFamily: SANS,
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
            <div className={styles.tonightMetaRow}>
              <button
                onClick={() => setWatchedTonight((v) => !v)}
                aria-pressed={watchedTonight}
                style={{
                  padding: "10px 24px",
                  background: watchedTonight ? C.accentDim : C.accent,
                  color: C.bg,
                  border: "none",
                  fontFamily: SANS,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                {watchedTonight ? (
                  <>
                    <Check size={11} aria-hidden="true" /> Vista
                  </>
                ) : (
                  "Marcar como vista"
                )}
              </button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: C.gold,
                  fontFamily: SANS,
                  fontSize: 11,
                }}
              >
                <Trophy size={12} fill={C.gold} color={C.gold} /> +
                {points} pts esta noche
              </div>
            </div>
          </div>
          <Link
            to={movieHref(0, 0, tonightFilm.title)}
            className={styles.tonightActions}
            style={{
              textDecoration: "none",
              flexShrink: 0,
              alignSelf: "center",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.textSoft,
              }}
            >
              <ArrowRight size={12} />
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
