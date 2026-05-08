import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Sparkles,
  Check,
  BookOpen,
  Eye,
  ArrowRight,
} from "lucide-react";
import { C, SANS, SERIF, TMDB_BASE } from "../constants";
import { Stars } from "./shared/Stars";
import type { MovieDetailApi } from "../../../services/movieDetailServices";

interface DailyHeroProps {
  film: MovieDetailApi | null;
  isNewUser: boolean;
}

export function DailyHero({ film, isNewUser }: DailyHeroProps) {
  const [saved, setSaved] = useState(false);
  const [watched, setWatched] = useState(false);

  if (isNewUser || !film) return null;

  const year = film.release_date ? film.release_date.slice(0, 4) : "---";
  const duration = film.runtime
    ? `${Math.floor(film.runtime / 60)}h ${film.runtime % 60}m`
    : "---";
  const director =
    film.credits?.crew?.find((c) => c.job === "Director")?.name ||
    "Director desconocido";
  const backdrop = film.backdrop_path
    ? `${TMDB_BASE}original${film.backdrop_path}`
    : "";
  const poster = film.poster_path ? `${TMDB_BASE}w500${film.poster_path}` : "";
  const genres = (film.genres || []).map((g) => g.name);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        position: "relative",
        height: "92vh",
        minHeight: 560,
        overflow: "hidden",
        marginBottom: 0,
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(0.25) brightness(0.5) blur(2px)",
              transform: "scale(1.06)",
            }}
          />
        )}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0.3) 30%, rgba(8,8,8,0.65) 65%, rgba(8,8,8,1) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(8,8,8,0.8) 0%, rgba(8,8,8,0.2) 50%, rgba(8,8,8,0.0) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 15% 80%, rgba(212,175,122, 0.15) 0%, transparent 55%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0 40px 52px",
          display: "grid",
          gridTemplateColumns: "160px 1fr",
          gap: 36,
          alignItems: "flex-end",
          maxWidth: 1100,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link to={`/film/${film.id}`} style={{ textDecoration: "none", display: "block" }}>
            <div
              style={{
                aspectRatio: "2/3",
                overflow: "hidden",
                border: `1.5px solid ${C.accentDim}`,
                boxShadow: `0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,122, 0.2)`,
                transition: "transform 0.3s",
              }}
            >
              <img
                src={poster}
                alt={film.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "saturate(0.75)",
                }}
              />
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: 9,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: C.accent,
              fontFamily: SANS,
              marginBottom: 16,
              padding: "5px 12px",
              border: `1px solid rgba(212,175,122,0.25)`,
              background: "rgba(212,175,122,0.06)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Sparkles size={9} /> Tu recomendación diaria
          </div>

          <div
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 14,
              color: C.textSoft,
              marginBottom: 12,
            }}
          >
            Sugerencia de CineVault basada en tu perfil
          </div>

          <Link to={`/film/${film.id}`} style={{ textDecoration: "none" }}>
            <h1
              style={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontSize: "clamp(36px, 5vw, 64px)",
                lineHeight: 1.02,
                color: C.text,
                margin: "0 0 6px",
                letterSpacing: "-0.01em",
              }}
            >
              {film.title}
            </h1>
          </Link>

          <div
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 17,
              color: C.textSoft,
              marginBottom: 14,
            }}
          >
            {director} · {year} · {duration}
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {genres.map((g) => (
              <span
                key={g}
                style={{
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: C.textSoft,
                  border: `1px solid ${C.border}`,
                  padding: "3px 9px",
                  fontFamily: SANS,
                  background: "rgba(8,8,8,0.4)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {g}
              </span>
            ))}
          </div>

          <p
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 17,
              lineHeight: 1.7,
              color: "rgba(226,226,226,0.7)",
              margin: "0 0 26px",
              maxWidth: 560,
            }}
          >
            {film.overview}
          </p>

          {film.vote_average !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <Stars n={Math.round(film.vote_average / 2)} size={14} />
              <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: C.textSoft }}>
                {(film.vote_average / 2).toFixed(1)} en CineVault
              </span>
              <div style={{ width: 1, height: 14, background: C.border }} />
              <span style={{ fontFamily: SANS, fontSize: 10, color: C.textMuted, letterSpacing: "0.1em" }}>
                {film.vote_count?.toLocaleString()} reseñas
              </span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <motion.button
              onClick={() => setSaved((v) => !v)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "13px 28px",
                background: saved ? C.accentDim : C.accent,
                color: "#080808",
                border: "none",
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: `0 4px 20px rgba(212,175,122, 0.3)`,
              }}
            >
              {saved ? <><Check size={12} /> En mi Diario</> : <><BookOpen size={12} /> Añadir al Diario</>}
            </motion.button>

            <motion.button
              onClick={() => setWatched((v) => !v)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "13px 24px",
                background: "rgba(255,255,255,0.07)",
                color: watched ? C.accent : C.text,
                border: `1px solid ${watched ? C.accentDim : "rgba(255,255,255,0.15)"}`,
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              {watched ? <><Check size={12} /> Vista</> : <><Eye size={12} /> Marcar como vista</>}
            </motion.button>

            <Link to={`/film/${film.id}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                style={{
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${C.border}`,
                  color: C.textSoft,
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.2s",
                }}
              >
                <ArrowRight size={15} />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        style={{
          position: "absolute",
          bottom: 24,
          right: 40,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontFamily: SANS,
          fontSize: 9,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: C.textMuted,
        }}
      >
        <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>↓</motion.div>
        Tu dashboard
      </motion.div>
    </motion.section>
  );
}
