/**
 * CineVault — For You Dashboard · /for-you
 * "Tu Recomendación Diaria" — dashboard cinéfilo personalizado
 * Palette: #080808 bg · #111111 card · #D4AF7A accent
 * Typography: Cormorant Garamond (serif) + Syne (sans)
 */

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Bell,
  Search as SearchIcon,
  Heart,
  Star,
  Eye,
  Users,
  Sparkles,
  ArrowRight,
  Check,
  Plus,
  TrendingUp,
  Bookmark,
  Film,
  ChevronRight,
  X,
  UserPlus,
} from "lucide-react";

import { getCurrentUser, type AuthUser } from "../services/authServices";
import {
  fetchForYouFeed,
  fetchTonightMovie,
  fetchActivityFeed,
  fetchOnboardingStatus,
  type ActivityItem,
  type ForYouItem,
  type ForYouMovieItem,
} from "../services/socialServices";
import {
  fetchMovieDetail,
  type MovieDetailApi,
} from "../services/movieDetailServices";
import {
  fetchUserProfile,
  fetchWatchlist,
  type ProfileUser,
  type RichWatchlistEntry,
} from "../services/profileServices";
import { getStoredAccessToken } from "../services/authServices";

// ─── PALETTE ─────────────────────────────────────────────────
const C = {
  bg: "#080808",
  surface: "#111111",
  elevated: "#1A1A1A",
  border: "#252525",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  accentGlow: "rgba(212,175,122,0.12)",
  accentGlowStrong: "rgba(212,175,122,0.22)",
  text: "#E2E2E2",
  textSoft: "#7A7A7A",
  textMuted: "#3A3A3A",
  gold: "#C8A96E",
} as const;

const SERIF = "'Cormorant Garamond', serif";
const SANS = "'Syne', sans-serif";

const TMDB_BASE = "https://image.tmdb.org/t/p/";

// ─── HELPERS ────────────────────────────────────────────────
function Img({
  src,
  alt,
  style,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false);
  if (err) return <div style={{ ...style, background: C.elevated }} />;
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setErr(true)}
      {...rest}
    />
  );
}

function Grain() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 900,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
        opacity: 0.35,
      }}
    />
  );
}

function Stars({ n, size = 12 }: { n: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            fontSize: size,
            color: i <= n ? C.gold : C.textMuted,
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────
function Navbar({ user }: { user: AuthUser | null }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const initials = user?.username
    ? user.username.slice(0, 1).toUpperCase()
    : "C";

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        background: scrolled ? "rgba(8,8,8,0.98)" : "rgba(8,8,8,0.8)",
        backdropFilter: "blur(24px)",
        borderBottom: `1px solid ${scrolled ? C.border : "transparent"}`,
        transition: "all 0.4s",
      }}
    >
      <Link
        to="/"
        style={{
          fontFamily: SERIF,
          fontSize: 20,
          fontWeight: 500,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: C.text,
          textDecoration: "none",
        }}
      >
        Cine<span style={{ color: C.accent }}>Vault</span>
      </Link>

      {/* Center nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {[
          { label: "Para vos", href: "/for-you", active: true },
          { label: "Feed", href: "/feed", active: false },
          { label: "Explorar", href: "/search", active: false },
          { label: "Mi Vault", href: "/home", active: false },
        ].map((item) => (
          <Link
            key={item.href}
            to={item.href}
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: item.active ? C.accent : C.textSoft,
              textDecoration: "none",
              fontFamily: SANS,
              borderBottom: item.active
                ? `1px solid ${C.accentDim}`
                : "1px solid transparent",
              paddingBottom: 2,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!item.active) e.currentTarget.style.color = C.text;
            }}
            onMouseLeave={(e) => {
              if (!item.active) e.currentTarget.style.color = C.textSoft;
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => navigate("/search")}
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            cursor: "pointer",
            color: C.textSoft,
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = C.accentDim;
            (e.currentTarget as HTMLElement).style.color = C.text;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = C.border;
            (e.currentTarget as HTMLElement).style.color = C.textSoft;
          }}
        >
          <SearchIcon size={13} />
        </button>
        <button
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            cursor: "pointer",
            color: C.textSoft,
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = C.accentDim;
            (e.currentTarget as HTMLElement).style.color = C.text;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = C.border;
            (e.currentTarget as HTMLElement).style.color = C.textSoft;
          }}
        >
          <Bell size={13} />
          <div
            style={{
              position: "absolute",
              top: 7,
              right: 7,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: C.accent,
            }}
          />
        </button>
        <Link to="/profile">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: user?.avatar_url
                ? `url(${user.avatar_url}) center/cover`
                : `linear-gradient(135deg, ${C.accentGlow}, ${C.elevated})`,
              border: `1.5px solid ${C.accentDim}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: SERIF,
              fontSize: 14,
              color: C.accent,
              overflow: "hidden",
            }}
          >
            {!user?.avatar_url && initials}
          </div>
        </Link>
      </div>
    </nav>
  );
}

// ─── DYNAMIC GLOW CARD ────────────────────────────────────────
function GlowCard({
  children,
  dominantColor,
  style,
  className,
}: {
  children: React.ReactNode;
  dominantColor?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [hov, setHov] = useState(false);
  const glow = dominantColor
    ? `rgba(${dominantColor}, ${hov ? 0.18 : 0.08})`
    : C.accentGlow;

  return (
    <div
      className={className}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hov ? C.accentDim : C.border}`,
        transition: "border-color 0.3s, box-shadow 0.4s, transform 0.3s",
        boxShadow: hov
          ? `0 0 0 1px rgba(${dominantColor || "212,175,122"}, 0.12), 0 8px 40px rgba(${dominantColor || "212,175,122"}, 0.15), inset 0 0 60px rgba(${dominantColor || "212,175,122"}, 0.03)`
          : `0 0 0 0px transparent`,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Ambient glow layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `radial-gradient(ellipse at 30% 70%, ${glow} 0%, transparent 65%)`,
          transition: "opacity 0.4s",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── DAILY HERO ───────────────────────────────────────────────
// ─── DAILY HERO ───────────────────────────────────────────────
function DailyHero({
  film,
  isNewUser,
}: {
  film: MovieDetailApi | null;
  isNewUser: boolean;
}) {
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

  // Genres
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
      {/* ── Blurred backdrop ── */}
      <div style={{ position: "absolute", inset: 0 }}>
        {backdrop && (
          <Img
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

      {/* ── Gradient overlays ── */}
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

      {/* ── Ambient gold glow ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 15% 80%, rgba(212,175,122, 0.15) 0%, transparent 55%)`,
        }}
      />

      {/* ── Grain on hero ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />

      {/* ── Content ── */}
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
        {/* Poster */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Link
            to={`/film/${film.id}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <div
              style={{
                aspectRatio: "2/3",
                overflow: "hidden",
                border: `1.5px solid ${C.accentDim}`,
                boxShadow: `0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,122, 0.2)`,
                transition: "transform 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform =
                  "scale(1.03) translateY(-4px)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              <Img
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

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
        >
          {/* Label */}
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

          {/* Basis */}
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

          {/* Title */}
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

          {/* Sub info */}
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

          {/* Genres */}
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

          {/* Synopsis */}
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

          {/* Rating bar */}
          {film.vote_average !== undefined && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <Stars n={Math.round(film.vote_average / 2)} size={14} />
              <span
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 15,
                  color: C.textSoft,
                }}
              >
                {(film.vote_average / 2).toFixed(1)} en CineVault
              </span>
              <div style={{ width: 1, height: 14, background: C.border }} />
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 10,
                  color: C.textMuted,
                  letterSpacing: "0.1em",
                }}
              >
                {film.vote_count?.toLocaleString()} reseñas
              </span>
            </div>
          )}

          {/* CTAs */}
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
              {saved ? (
                <>
                  <Check size={12} /> En mi Diario
                </>
              ) : (
                <>
                  <BookOpen size={12} /> Añadir al Diario
                </>
              )}
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
              {watched ? (
                <>
                  <Check size={12} /> Vista
                </>
              ) : (
                <>
                  <Eye size={12} /> Marcar como vista
                </>
              )}
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
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    C.accentDim;
                  (e.currentTarget as HTMLElement).style.color = C.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                  (e.currentTarget as HTMLElement).style.color = C.textSoft;
                }}
              >
                <ArrowRight size={15} />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
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
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ↓
        </motion.div>
        Tu dashboard
      </motion.div>
    </motion.section>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      style={{
        margin: "80px 40px 0",
        border: `1px solid ${C.border}`,
        background: C.surface,
        padding: "56px 48px",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 100%, ${C.accentGlow} 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(to right, transparent, ${C.accent}, transparent)`,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 48,
            color: C.accentDim,
            marginBottom: 20,
            lineHeight: 1,
          }}
        >
          ◈
        </div>
        <h2
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 32,
            color: C.text,
            margin: "0 0 12px",
          }}
        >
          Tu vault está vacío
        </h2>
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 18,
            color: C.textSoft,
            lineHeight: 1.7,
            margin: "0 auto 32px",
            maxWidth: 480,
          }}
        >
          Seguí algunos cinéfilos o registrá tus primeras 3 películas para
          desbloquear recomendaciones personalizadas.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            style={{
              padding: "13px 28px",
              background: C.accent,
              color: "#080808",
              border: "none",
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Users size={12} /> Descubrir miembros
          </motion.button>
          <Link to="/search">
            <motion.button
              whileHover={{ scale: 1.02 }}
              style={{
                padding: "13px 24px",
                background: "transparent",
                color: C.accent,
                border: `1px solid ${C.accentDim}`,
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Film size={12} /> Buscar películas
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ACTIVITY CARD (friend log) ───────────────────────────────
function ActivityCard({ item, index }: { item: ActivityItem; index: number }) {
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const color = "212,175,122";
  const MAX_CHARS = 140;
  const content = item.review?.content || "";
  const isLong = content.length > MAX_CHARS;
  const displayReview =
    expanded || !isLong ? content : content.slice(0, MAX_CHARS) + "…";

  const actionText = (type: string) => {
    switch (type) {
      case "review_published":
        return "reseñó";
      case "diary_entry":
        return "añadió al Diario";
      case "vault_added":
        return "añadió al Vault";
      case "watchlist_added":
        return "añadió a su Watchlist";
      case "review_liked":
        return "le gusta la reseña de";
      default:
        return "publicó";
    }
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime(); // eslint-disable-line react-hooks/purity
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
      <GlowCard
        dominantColor={color}
        style={{ marginBottom: 2, cursor: "default" }}
      >
        <div style={{ padding: "22px 24px" }}>
          {/* Header: user info */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr auto",
              gap: 12,
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                flexShrink: 0,
                background: item.user.avatar_url
                  ? `url(${item.user.avatar_url}) center/cover`
                  : `rgba(${color}, 0.12)`,
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
              {!item.user.avatar_url &&
                item.user.username.slice(0, 1).toUpperCase()}
            </div>

            {/* Name + action */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 4,
                }}
              >
                <Link
                  to={`/vault/${item.user.username}`}
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    color: C.text,
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.text)}
                >
                  {item.user.username}
                </Link>
                <span
                  style={{ fontFamily: SANS, fontSize: 11, color: C.textSoft }}
                >
                  {actionText(item.type)}
                </span>
                {item.movie && (
                  <Link
                    to={`/film/${item.movie.tmdb_id}`}
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 15,
                      color: C.accent,
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.8")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {item.movie.title || `Película #${item.movie.tmdb_id}`}
                  </Link>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {item.review?.rating && (
                  <Stars n={Math.round(item.review.rating / 2)} size={11} />
                )}
                <span
                  style={{ fontFamily: SANS, fontSize: 10, color: C.textMuted }}
                >
                  ·
                </span>
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 10,
                    color: C.textMuted,
                    letterSpacing: "0.06em",
                  }}
                >
                  {timeAgo(item.created_at)}
                </span>
              </div>
            </div>

            {/* Mini poster placeholder if not available */}
            {item.movie?.tmdb_id && (
              <Link
                to={`/film/${item.movie.tmdb_id}`}
                style={{ textDecoration: "none", flexShrink: 0 }}
              >
                <div
                  style={{
                    width: 42,
                    height: 63,
                    overflow: "hidden",
                    background: C.elevated,
                    border: `1px solid rgba(${color}, 0.3)`,
                    boxShadow: `0 4px 16px rgba(0,0,0,0.5), 0 0 12px rgba(${color}, 0.12)`,
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "none")
                  }
                >
                  {item.movie.poster_path ? (
                    <img
                      src={`${TMDB_BASE}w154${item.movie.poster_path}`}
                      alt={item.movie.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 8,
                        color: C.textMuted,
                      }}
                    >
                      Film
                    </div>
                  )}
                </div>
              </Link>
            )}
          </div>

          {/* Review snippet */}
          {content && (
            <>
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 16,
                  lineHeight: 1.68,
                  color: "rgba(226,226,226,0.65)",
                  margin: "0 0 4px",
                  borderLeft: `2px solid rgba(${color}, 0.3)`,
                  paddingLeft: 14,
                }}
              >
                {displayReview}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.accentDim,
                    fontFamily: SANS,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    padding: "4px 0 0 14px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = C.accentDim)
                  }
                >
                  {expanded ? "Ver menos" : "Ver más"}
                </button>
              )}
            </>
          )}

          {/* Footer actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginTop: 16,
              paddingTop: 14,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <button
              onClick={() => setLiked((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: liked ? C.accent : C.textSoft,
                fontFamily: SANS,
                fontSize: 11,
                transition: "color 0.2s",
                padding: 0,
              }}
            >
              <Heart
                size={12}
                strokeWidth={1.5}
                fill={liked ? C.accent : "none"}
              />
              {liked ? 1 : 0}
            </button>
            <div style={{ flex: 1 }} />
            {item.movie && (
              <Link
                to={`/film/${item.movie.tmdb_id}`}
                style={{
                  fontFamily: SANS,
                  fontSize: 9,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: C.textMuted,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = C.textMuted)
                }
              >
                Ver ficha <ArrowRight size={9} />
              </Link>
            )}
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
}

// ─── TRENDING WIDGET ─────────────────────────────────────────
function TrendingWidget({ items }: { items: ForYouItem[] }) {
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
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(212,175,122,0.025)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={13} color={C.accent} />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 9,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: C.accent,
              }}
            >
              Tendencias para ti
            </span>
          </div>
          <span
            style={{
              fontFamily: SANS,
              fontSize: 9,
              color: C.textMuted,
              letterSpacing: "0.08em",
            }}
          >
            Sugerido
          </span>
        </div>

        {/* Films list */}
        <div>
          {mediaItems.length === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center" }}>
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 15,
                  color: C.textSoft,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Aún no tenemos recomendaciones. Completá tu perfil para ver qué
                te sugerimos.
              </p>
            </div>
          ) : (
            mediaItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
              >
                <Link
                  to={`/film/${item.media.id}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "24px 44px 1fr auto",
                      gap: 12,
                      alignItems: "center",
                      padding: "12px 20px",
                      borderBottom:
                        i < mediaItems.length - 1
                          ? `1px solid ${C.border}`
                          : "none",
                      transition: "background 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.02)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {/* Rank */}
                    <span
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontSize: 16,
                        color: i === 0 ? C.accent : C.textMuted,
                        textAlign: "center",
                      }}
                    >
                      {i + 1}
                    </span>

                    {/* Poster */}
                    <div
                      style={{
                        width: 44,
                        height: 66,
                        overflow: "hidden",
                        border: `1px solid ${C.border}`,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                        flexShrink: 0,
                      }}
                    >
                      <Img
                        src={
                          item.media.poster_path
                            ? `${TMDB_BASE}w185${item.media.poster_path}`
                            : ""
                        }
                        alt={item.media.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: "saturate(0.5)",
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div>
                      <div
                        style={{
                          fontFamily: SANS,
                          fontSize: 12,
                          color: C.text,
                          marginBottom: 3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.media.title}
                      </div>
                      <div
                        style={{
                          fontFamily: SERIF,
                          fontStyle: "italic",
                          fontSize: 12,
                          color: C.textSoft,
                          marginBottom: 5,
                        }}
                      >
                        {item.media.year}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Stars
                          n={Math.round(item.media.vote_average / 2)}
                          size={9}
                        />
                        <span
                          style={{
                            fontFamily: SANS,
                            fontSize: 9,
                            color: C.textMuted,
                          }}
                        >
                          {item.media.reason}
                        </span>
                      </div>
                    </div>

                    {/* Trend badge */}
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 10,
                        color: "#5aab7a",
                        letterSpacing: "0.06em",
                        textAlign: "right",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 3,
                      }}
                    >
                      <span>{Math.round(item.media.vote_average * 10)}%</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}` }}
        >
          <Link
            to="/search"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: SANS,
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: C.textMuted,
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
          >
            Ver más tendencias <ChevronRight size={9} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── WATCHLIST WIDGET ─────────────────────────────────────────
function WatchlistWidget({ items }: { items: RichWatchlistEntry[] }) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visible = items.filter((f) => !dismissed.has(f.movie_id)).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(212,175,122,0.025)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bookmark size={13} color={C.accent} />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 9,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: C.accent,
              }}
            >
              Watchlist · recordatorios
            </span>
          </div>
          <span style={{ fontFamily: SANS, fontSize: 9, color: C.textMuted }}>
            {visible.length} pendientes
          </span>
        </div>

        {/* Items */}
        <AnimatePresence>
          {visible.length === 0 ? (
            <div style={{ padding: "28px 20px", textAlign: "center" }}>
              <p
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 15,
                  color: C.textSoft,
                }}
              >
                Todo al día. Buen cinéfilo.
              </p>
            </div>
          ) : (
            visible.map((film, i) => (
              <motion.div
                key={film.movie_id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr auto",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "14px 20px",
                    borderBottom:
                      i < visible.length - 1 ? `1px solid ${C.border}` : "none",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* Poster */}
                  <Link
                    to={`/film/${film.tmdb_id}`}
                    style={{
                      textDecoration: "none",
                      display: "block",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 66,
                        overflow: "hidden",
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <Img
                        src={
                          film.movie_info?.poster_path
                            ? `${TMDB_BASE}w185${film.movie_info.poster_path}`
                            : ""
                        }
                        alt={film.movie_info?.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: "saturate(0.45)",
                        }}
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div>
                    <Link
                      to={`/film/${film.tmdb_id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        style={{
                          fontFamily: SANS,
                          fontSize: 12,
                          color: C.text,
                          marginBottom: 3,
                          lineHeight: 1.3,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = C.accent)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = C.text)
                        }
                      >
                        {film.movie_info?.title}
                      </div>
                    </Link>
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontSize: 12,
                        color: C.textSoft,
                        marginBottom: 7,
                      }}
                    >
                      Watchlist
                    </div>
                    {/* Trend score dummy */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 5,
                      }}
                    >
                      <div
                        style={{
                          height: 3,
                          width: 60,
                          background: C.border,
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `85%`,
                            background: C.accent,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: SANS,
                          fontSize: 9,
                          color: C.accentDim,
                        }}
                      >
                        85%
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 10,
                        color: C.textMuted,
                        letterSpacing: "0.04em",
                      }}
                    >
                      Recordatorio del Vault
                    </div>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() =>
                      setDismissed((prev) => new Set([...prev, film.movie_id]))
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: C.textMuted,
                      padding: 2,
                      flexShrink: 0,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = C.textSoft)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = C.textMuted)
                    }
                    title="Descartar"
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Footer CTA */}
        <div
          style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}` }}
        >
          <button
            style={{
              width: "100%",
              padding: "10px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: C.textSoft,
              fontFamily: SANS,
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.accentDim;
              (e.currentTarget as HTMLElement).style.color = C.accent;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.border;
              (e.currentTarget as HTMLElement).style.color = C.textSoft;
            }}
          >
            <Plus size={10} /> Ver toda mi watchlist
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── QUICK STATS WIDGET ───────────────────────────────────────
function QuickStatsWidget({ user }: { user: ProfileUser | null }) {
  const stats = [
    {
      icon: <Film size={14} color={C.accent} />,
      value: user?._count?.diary_entries?.toString() || "0",
      label: "películas vistas",
      sub: "En tu diario",
    },
    {
      icon: <Star size={14} color={C.gold} />,
      value: user?._count?.reviews?.toString() || "0",
      label: "reseñas publicadas",
      sub: "Opiniones",
    },
    {
      icon: <Heart size={14} color="#c0596e" />,
      value: user?._count?.watchlist?.toString() || "0",
      label: "en watchlist",
      sub: "Pendientes",
    },
    {
      icon: <Users size={14} color="#40a0e0" />,
      value:
        user?._count?.follows_follows_following_idTousers?.toString() || "0",
      label: "siguiendo",
      sub: "Cinéfilos",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{ marginBottom: 2 }}
    >
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          padding: "18px 20px",
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontSize: 9,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: C.accent,
            marginBottom: 16,
          }}
        >
          Tu actividad
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "12px 14px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${C.border}`,
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = C.accentDim)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = C.border)
              }
            >
              <div style={{ marginBottom: 8 }}>{s.icon}</div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 22,
                  color: C.text,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 9,
                  color: C.textSoft,
                  letterSpacing: "0.08em",
                  marginBottom: 3,
                }}
              >
                {s.label}
              </div>
              <div
                style={{ fontFamily: SANS, fontSize: 9, color: C.textMuted }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── FEED HEADER ─────────────────────────────────────────────
function FeedHeader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: C.accent,
            fontFamily: SANS,
          }}
        >
          Actividad de tu red
        </div>
        <div
          style={{
            height: 1,
            width: 40,
            background: `linear-gradient(to right, ${C.border}, transparent)`,
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link
          to="/feed"
          style={{
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.textSoft,
            textDecoration: "none",
            fontFamily: SANS,
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.textSoft)}
        >
          Feed completo <ArrowRight size={9} />
        </Link>
      </div>
    </div>
  );
}

// ─── NEW USER EMPTY FEED ─────────────────────────────────────
function EmptyFeed({ isNewUser }: { isNewUser: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        border: `1px solid ${C.border}`,
        background: C.surface,
        padding: "64px 32px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 100%, ${C.accentGlow} 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 40,
            color: C.accentDim,
            marginBottom: 16,
            lineHeight: 1,
          }}
        >
          {isNewUser ? "◈" : "≋"}
        </div>
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 18,
            color: C.textSoft,
            lineHeight: 1.75,
            margin: "0 auto 28px",
            maxWidth: 440,
          }}
        >
          {isNewUser
            ? "Tu vault está vacío. Seguí algunos cinéfilos o registrá tus primeras 3 películas para desbloquear recomendaciones personalizadas."
            : "Todo está muy tranquilo por aquí... Seguí a más personas para ver qué están viendo o empezá vos la conversación."}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            style={{
              padding: "11px 24px",
              background: C.accent,
              color: "#080808",
              border: "none",
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <UserPlus size={11} /> Descubrir miembros
          </motion.button>
          {!isNewUser && (
            <Link to="/search">
              <motion.button
                whileHover={{ scale: 1.02 }}
                style={{
                  padding: "11px 22px",
                  background: "transparent",
                  color: C.accent,
                  border: `1px solid ${C.accentDim}`,
                  fontFamily: SANS,
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Film size={11} /> Buscar películas
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export function ForYou() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [watchlist, setWatchlist] = useState<RichWatchlistEntry[]>([]);
  const [heroMovie, setHeroMovie] = useState<MovieDetailApi | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [recommendations, setRecommendations] = useState<ForYouItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get current user and basic recommendations
      const user = await getCurrentUser().catch(() => null);
      setCurrentUser(user);

      const token = getStoredAccessToken();

      if (user) {
        // Fetch full profile, watchlist AND onboarding status
        const [prof, wl, onboarding] = await Promise.all([
          fetchUserProfile(user.id, token),
          fetchWatchlist(user.id, token, true),
          fetchOnboardingStatus().catch(() => ({ needs_onboarding: false })),
        ]);
        setProfile(prof);
        setWatchlist(wl);

        // A user is considered "New" if:
        // 1. Explicitly needs onboarding (no taste profile)
        // 2. OR has absolutely no cinematic footprint (count sum is 0)
        const interactionCount =
          (prof._count?.reviews || 0) +
          (prof._count?.diary_entries || 0) +
          (prof._count?.watchlist || 0);

        setIsNewUser(onboarding.needs_onboarding || interactionCount === 0);
      }

      const tonight = await fetchTonightMovie().catch(() => null);

      if (tonight && tonight.media) {
        try {
          const fullMovie = await fetchMovieDetail(tonight.media.id.toString());
          setHeroMovie(fullMovie);
        } catch {
          setHeroMovie({
            id: tonight.media.id,
            title: tonight.media.title,
            release_date: tonight.media.year?.toString(),
            vote_average: tonight.media.vote_average || 0,
            poster_path: tonight.media.poster_path,
          } as MovieDetailApi);
        }
      }

      // 2. Get activity feed and personalized feed
      const [act, recomms] = await Promise.all([
        fetchActivityFeed("friends").catch(() => ({ items: [] })),
        fetchForYouFeed().catch(() => ({ items: [] })),
      ]);

      setActivities(act.items);
      setRecommendations(recomms.items);
    } catch (err) {
      console.error("Error fetching For You data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !currentUser) {
    return (
      <div
        style={{
          background: C.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 24,
            color: C.accentDim,
          }}
        >
          Preparando tu Vault...
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <Grain />
      <Navbar user={currentUser} />

      {/* Hero */}
      {!isNewUser && heroMovie ? (
        <DailyHero film={heroMovie} isNewUser={isNewUser} />
      ) : (
        <div style={{ height: 60 }} />
      )}

      {/* New user empty hero */}
      {isNewUser && <EmptyState />}

      {/* Main content */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isNewUser ? "48px 40px 80px" : "40px 40px 80px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {/* ── LEFT: Community Feed ── */}
          <div>
            <FeedHeader />
            {activities.length === 0 ? (
              <EmptyFeed isNewUser={isNewUser} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {activities.map((item, i) => (
                  <ActivityCard key={item.id} item={item} index={i} />
                ))}

                {/* Load more */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  style={{ paddingTop: 24 }}
                >
                  <button
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "transparent",
                      border: `1px solid ${C.border}`,
                      color: C.textSoft,
                      fontFamily: SANS,
                      fontSize: 9,
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        C.accentDim;
                      (e.currentTarget as HTMLElement).style.color = C.accent;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        C.border;
                      (e.currentTarget as HTMLElement).style.color = C.textSoft;
                    }}
                  >
                    Cargar más actividad <ChevronRight size={10} />
                  </button>
                </motion.div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Widgets ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              position: "sticky",
              top: 80,
            }}
          >
            <QuickStatsWidget user={profile} />
            <div style={{ height: 8 }} />
            <TrendingWidget items={recommendations} />
            <div style={{ height: 8 }} />
            <WatchlistWidget items={watchlist} />

            {/* Discover people CTA */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ marginTop: 10 }}
            >
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  padding: "20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse at 50% 100%, ${C.accentGlow} 0%, transparent 60%)`,
                    pointerEvents: "none",
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 9,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: C.accent,
                      marginBottom: 10,
                    }}
                  >
                    Descubrí cinéfilos
                  </div>
                  <p
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 14,
                      color: C.textSoft,
                      lineHeight: 1.65,
                      margin: "0 0 16px",
                    }}
                  >
                    Conectá con personas que ven el mismo cine que vos.
                  </p>
                  <button
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      background: C.accentGlow,
                      border: `1px solid ${C.accentDim}`,
                      color: C.accent,
                      fontFamily: SANS,
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        C.accentGlowStrong;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        C.accentGlow;
                    }}
                  >
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

export default ForYou;
