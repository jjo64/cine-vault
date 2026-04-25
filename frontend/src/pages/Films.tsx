/**
 * CineVault — Films Discovery · /films
 * Advanced search + filter · Grid / List view · Explore categories
 * Palette: #080808 bg · #111111 card · #D4AF7A accent
 * Typography: Cormorant Garamond (serif) · Syne (sans)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  Heart,
  BookOpen,
  Star,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Check,
  ArrowUpDown,
} from "lucide-react";
import {
  fetchPopularMovies,
  fetchUpcomingMovies,
  fetchTopRatedMovies,
  addToWatchlist,
  removeFromWatchlist,
  addToFavorites,
  removeFromFavorites,
  createReview,
} from "../services/movieDetailServices";
import {
  fetchMovieGenres,
  searchMovie,
  searchMulti,
} from "../services/searchServices";
import { getStoredAccessToken } from "../services/authServices";
import { followPerson, unfollowPerson } from "../services/personsServices";
import { createSlug } from "../utils/stringUtils";
import { ReviewLogModal } from "../features/movie-detail/components/ReviewLogModal";
import { UserPlus, UserCheck } from "lucide-react";

// ─── PALETTE & FONTS ─────────────────────────────────────────
const C = {
  bg: "#080808",
  surface: "#111111",
  elevated: "#181818",
  border: "#232323",
  borderHover: "#3a3a3a",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  accentGlow: "rgba(212,175,122,0.10)",
  accentGlowStrong: "rgba(212,175,122,0.22)",
  text: "#E2E2E2",
  textSoft: "#727272",
  textMuted: "#3C3C3C",
  gold: "#C8A96E",
} as const;
const SERIF = "'Cormorant Garamond', serif";
const SANS = "'Syne', sans-serif";

// ─── HELPERS ─────────────────────────────────────────────────
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
        opacity: 0.36,
      }}
    />
  );
}
function Stars({
  n,
  max = 5,
  size = 11,
}: {
  n: number;
  max?: number;
  size?: number;
}) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            fontSize: size,
            color: i < Math.round(n) ? C.gold : C.textMuted,
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── FILM DATA ────────────────────────────────────────────────
type Film = {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  director: string;
  genres: string[];
  country: string;
  duration: string;
  synopsis: string;
  rating: number; // community avg (1–5)
  myRating?: number;
  img: string;
  glowRgb: string; // dominant colour approximation
  watched?: boolean;
  liked?: boolean;
  mediaType?: "movie" | "tv" | "person";
  slug?: string;
};

function mapBackendToFilm(
  apiMovie: any,
  genresMap: Record<number, string>,
): Film {
  const defaultPoster =
    "https://images.unsplash.com/photo-1776197739075-e492fcd2cb46?w=500&q=80";
  const mediaType = apiMovie.media_type || "movie";

  if (mediaType === "person") {
    return {
      id: String(apiMovie.id),
      title: apiMovie.name || "Desconocido",
      originalTitle: apiMovie.name || "Desconocido",
      year: 0,
      director: apiMovie.known_for_department || "Cineasta",
      genres: [],
      country: "Internacional",
      duration: "",
      synopsis:
        apiMovie.known_for?.map((m: any) => m.title || m.name).join(", ") ||
        "Sin información.",
      rating: 0,
      img: apiMovie.profile_path
        ? `https://image.tmdb.org/t/p/w500${apiMovie.profile_path}`
        : "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=500&q=80",
      glowRgb: "80, 80, 100",
      mediaType: "person",
    };
  }

  const title = apiMovie.title || apiMovie.name || "Desconocida";
  const slug = `${apiMovie.id}-${createSlug(title)}`;

  return {
    id: String(apiMovie.id),
    title,
    originalTitle:
      apiMovie.original_title || apiMovie.original_name || "Desconocida",
    year:
      apiMovie.release_date || apiMovie.first_air_date
        ? parseInt(
            (apiMovie.release_date || apiMovie.first_air_date).split("-")[0],
          )
        : 0,
    director: apiMovie.director || "Variado",
    genres: (apiMovie.genre_ids || []).map(
      (id: number) => genresMap[id] || "Otro",
    ),
    country: "Internacional",
    duration: apiMovie.runtime ? `${apiMovie.runtime} min` : "120 min",
    synopsis: apiMovie.overview || "Sin descripción disponible.",
    rating: apiMovie.vote_average ? apiMovie.vote_average / 2 : 0,
    img: apiMovie.poster_path
      ? `https://image.tmdb.org/t/p/w500${apiMovie.poster_path}`
      : defaultPoster,
    glowRgb: "60, 60, 60",
    watched: false,
    liked: false,
    mediaType: mediaType as "movie" | "tv",
    slug,
  };
}

// ─── FILTER CONFIG ────────────────────────────────────────────
const GENRE_OPTIONS = [
  "Drama",
  "Sci-fi",
  "Romance",
  "Thriller",
  "Horror",
  "Slow cinema",
  "Experimental",
  "Documental",
  "Bélica",
  "Histórica",
  "Minimalismo",
  "Neo-noir",
];
const COUNTRY_OPTIONS = [
  "EE.UU.",
  "Francia",
  "Italia",
  "Suecia",
  "URSS",
  "Hong Kong",
  "Japón",
  "Bélgica",
  "Reino Unido",
  "Corea del Sur",
];
const YEAR_RANGES = [
  { label: "Antes de 1960", from: 1900, to: 1959 },
  { label: "1960–1979", from: 1960, to: 1979 },
  { label: "1980–1999", from: 1980, to: 1999 },
  { label: "2000–2015", from: 2000, to: 2015 },
  { label: "2016–hoy", from: 2016, to: 2099 },
];
const SORT_OPTIONS = [
  { id: "rating", label: "Mejor valoradas" },
  { id: "recent", label: "Más recientes" },
  { id: "discussed", label: "Más comentadas" },
  { id: "alpha", label: "Alfabético (A–Z)" },
];
type SortId = "rating" | "recent" | "discussed" | "alpha";

type Filters = {
  genres: string[];
  yearRange: string | null;
  country: string | null;
  sortBy: SortId;
};

// ─── NAVBAR ──────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
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
        background: scrolled ? "rgba(8,8,8,0.98)" : "rgba(8,8,8,0.80)",
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
      <div style={{ display: "flex", gap: 32 }}>
        {[
          { l: "Para vos", h: "/for-you" },
          { l: "Películas", h: "/films", a: true },
          { l: "Listas", h: "/lists" },
          { l: "Feed", h: "/feed" },
        ].map((it) => (
          <Link
            key={it.h}
            to={it.h}
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: it.a ? C.accent : C.textSoft,
              textDecoration: "none",
              fontFamily: SANS,
              borderBottom: it.a
                ? `1px solid ${C.accentDim}`
                : "1px solid transparent",
              paddingBottom: 2,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!it.a) e.currentTarget.style.color = C.text;
            }}
            onMouseLeave={(e) => {
              if (!it.a) e.currentTarget.style.color = C.textSoft;
            }}
          >
            {it.l}
          </Link>
        ))}
      </div>
      <Link to="/profile">
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.accentGlow}, ${C.elevated})`,
            border: `1.5px solid ${C.accentDim}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SERIF,
            fontSize: 14,
            color: C.accent,
          }}
        >
          M
        </div>
      </Link>
    </nav>
  );
}

// ─── FILTER DROPDOWN ─────────────────────────────────────────
function FilterDropdown({
  label,
  value,
  options,
  multi = false,
  selected,
  onSelect,
  onClear,
}: {
  label: string;
  value: string;
  options: string[];
  multi?: boolean;
  selected: string[];
  onSelect: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = selected.length > 0;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "9px 14px",
          background: active
            ? "rgba(212,175,122,0.1)"
            : "rgba(255,255,255,0.03)",
          border: `1px solid ${active ? C.accentDim : open ? C.borderHover : C.border}`,
          color: active ? C.accent : open ? C.text : C.textSoft,
          fontFamily: SANS,
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          cursor: "pointer",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}
      >
        <span>{active ? value : label}</span>
        {active && (
          <span
            style={{
              background: C.accent,
              color: "#080808",
              borderRadius: "50%",
              width: 15,
              height: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {selected.length}
          </span>
        )}
        <ChevronDown
          size={11}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              background: C.elevated,
              border: `1px solid ${C.border}`,
              minWidth: 200,
              zIndex: 300,
              maxHeight: 260,
              overflowY: "auto",
              boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
            }}
          >
            {active && (
              <button
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "9px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(212,175,122,0.06)",
                  border: "none",
                  borderBottom: `1px solid ${C.border}`,
                  color: C.accentDim,
                  fontFamily: SANS,
                  fontSize: 9,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <X size={9} /> Limpiar selección
              </button>
            )}
            {options.map((opt) => {
              const isSel = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    onSelect(opt);
                    if (!multi) setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: isSel
                      ? "rgba(212,175,122,0.08)"
                      : "transparent",
                    border: "none",
                    borderBottom: `1px solid ${C.border}`,
                    color: isSel ? C.accent : C.text,
                    fontFamily: SANS,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSel)
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSel)
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      border: `1px solid ${isSel ? C.accent : C.border}`,
                      background: isSel ? C.accentGlow : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {isSel && <Check size={9} color={C.accent} />}
                  </div>
                  {opt}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ACTIVE FILTER PILLS ─────────────────────────────────────
function ActiveFilterPills({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: Filters;
  onRemove: (key: keyof Filters, value?: string) => void;
  onClearAll: () => void;
}) {
  const pills: { key: keyof Filters; label: string; value?: string }[] = [];
  filters.genres.forEach((g) =>
    pills.push({ key: "genres", label: `Género: ${g}`, value: g }),
  );
  if (filters.yearRange)
    pills.push({ key: "yearRange", label: `Año: ${filters.yearRange}` });
  if (filters.country)
    pills.push({ key: "country", label: `País: ${filters.country}` });
  if (filters.sortBy !== "rating")
    pills.push({
      key: "sortBy",
      label: `Orden: ${SORT_OPTIONS.find((s) => s.id === filters.sortBy)?.label}`,
    });

  if (pills.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        paddingBottom: 16,
      }}
    >
      <span
        style={{
          fontFamily: SANS,
          fontSize: 9,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: C.textMuted,
          flexShrink: 0,
        }}
      >
        Filtros activos:
      </span>
      {pills.map((pill) => (
        <motion.div
          key={`${pill.key}-${pill.value ?? "v"}`}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.15 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 10px 5px 12px",
            background: "rgba(212,175,122,0.1)",
            border: `1px solid ${C.accentDim}`,
          }}
        >
          <span
            style={{
              fontFamily: SANS,
              fontSize: 10,
              color: C.accent,
              letterSpacing: "0.06em",
            }}
          >
            {pill.label}
          </span>
          <button
            onClick={() => onRemove(pill.key, pill.value)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.accentDim,
              display: "flex",
              alignItems: "center",
              padding: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.accentDim)}
          >
            <X size={10} />
          </button>
        </motion.div>
      ))}
      {pills.length > 1 && (
        <button
          onClick={onClearAll}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.textMuted,
            fontFamily: SANS,
            fontSize: 9,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.textSoft)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
        >
          <X size={9} /> Limpiar todo
        </button>
      )}
    </motion.div>
  );
}

// ─── VIEW TOGGLE ─────────────────────────────────────────────
function ViewToggle({
  view,
  onChange,
}: {
  view: "grid" | "list";
  onChange: (v: "grid" | "list") => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {(
        [
          { id: "grid" as const, icon: <LayoutGrid size={13} /> },
          { id: "list" as const, icon: <List size={13} /> },
        ] as { id: "grid" | "list"; icon: React.ReactNode }[]
      ).map((btn) => (
        <button
          key={btn.id}
          onClick={() => onChange(btn.id)}
          style={{
            width: 38,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              view === btn.id ? "rgba(212,175,122,0.12)" : "transparent",
            border: "none",
            cursor: "pointer",
            color: view === btn.id ? C.accent : C.textSoft,
            borderRight: btn.id === "grid" ? `1px solid ${C.border}` : "none",
            transition: "all 0.2s",
          }}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}

// ─── GRID CARD ────────────────────────────────────────────────
function GridCard({
  film,
  index,
  onLog,
}: {
  film: Film;
  index: number;
  onLog: (f: Film) => void;
}) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const [liked, setLiked] = useState(film.liked ?? false);
  const [watched, setWatched] = useState(film.watched ?? false);
  const [following, setFollowing] = useState(false);
  const token = getStoredAccessToken();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return window.dispatchEvent(new CustomEvent("open-auth-modal"));
    try {
      if (liked)
        await removeFromFavorites(
          token,
          Number(film.id),
          film.mediaType === "tv" ? "tv" : "movie",
        );
      else
        await addToFavorites(
          token,
          Number(film.id),
          film.mediaType === "tv" ? "tv" : "movie",
        );
      setLiked(!liked);
    } catch {}
  };

  const handleWatch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return window.dispatchEvent(new CustomEvent("open-auth-modal"));
    try {
      if (watched)
        await removeFromWatchlist(
          token,
          Number(film.id),
          film.mediaType === "tv" ? "tv" : "movie",
        );
      else
        await addToWatchlist(
          token,
          Number(film.id),
          film.mediaType === "tv" ? "tv" : "movie",
        );
      setWatched(!watched);
    } catch {}
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return window.dispatchEvent(new CustomEvent("open-auth-modal"));
    try {
      if (following) await unfollowPerson(token, Number(film.id));
      else await followPerson(token, Number(film.id), film.title);
      setFollowing(!following);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDiary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onLog(film);
  };

  const linkPath =
    film.mediaType === "person"
      ? `/person/${film.slug || film.id}`
      : film.mediaType === "tv"
        ? `/tv/${film.slug || film.id}`
        : `/movie/${film.slug || film.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, delay: (index % 5) * 0.05 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position: "relative", cursor: "pointer" }}
    >
      <Link
        to={linkPath}
        style={{
          textDecoration: "none",
          display: "block",
          position: "absolute",
          inset: 0,
          zIndex: 2,
        }}
      />

      {/* Ambient colour glow — bleeds out from bottom of poster */}
      <div
        style={{
          position: "absolute",
          bottom: -8,
          left: "5%",
          right: "5%",
          height: "55%",
          background: `radial-gradient(ellipse at 50% 100%, rgba(${film.glowRgb}, ${hov ? 0.45 : 0.22}) 0%, transparent 70%)`,
          filter: "blur(18px)",
          transition: "opacity 0.5s",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Poster */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "2/3",
          overflow: "hidden",
          border: `1px solid ${hov ? "rgba(212,175,122,0.25)" : C.border}`,
          transition: "border-color 0.3s, transform 0.35s",
          transform: hov ? "translateY(-4px)" : "none",
          zIndex: 1,
        }}
      >
        <Img
          src={film.img}
          alt={film.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: `saturate(${hov ? 0.75 : 0.55}) brightness(${hov ? 0.75 : 0.65})`,
            transition: "filter 0.4s, transform 0.5s",
            transform: hov ? "scale(1.04)" : "scale(1)",
          }}
        />

        {/* Glassmorphism hover overlay */}
        <AnimatePresence>
          {hov && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.22 }}
              onClick={() => navigate(linkPath)}
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(8,8,8,0.96) 0%, rgba(8,8,8,0.75) 45%, rgba(8,8,8,0.2) 75%, transparent 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "14px 12px",
                zIndex: 3,
              }}
            >
              {/* Quick actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 10,
                  position: "relative",
                  zIndex: 3,
                }}
              >
                {[
                  film.mediaType === "person"
                    ? {
                        icon: following ? (
                          <UserCheck size={13} />
                        ) : (
                          <UserPlus size={13} />
                        ),
                        active: following,
                        onClick: handleFollow,
                        title: following ? "Siguiendo" : "Seguir",
                      }
                    : {
                        icon: <Eye size={13} />,
                        active: watched,
                        onClick: handleWatch,
                        title: "Watchlist",
                      },
                  {
                    icon: <Heart size={13} fill={liked ? C.accent : "none"} />,
                    active: liked,
                    onClick: handleLike,
                    title: "Me gusta",
                  },
                  film.mediaType !== "person"
                    ? {
                        icon: <BookOpen size={13} />,
                        active: false,
                        onClick: handleDiary,
                        title: "Añadir al Diario",
                      }
                    : null,
                ]
                  .filter(Boolean)
                  .map((btn: any, bi) => (
                    <motion.button
                      key={bi}
                      onClick={btn.onClick}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.92 }}
                      title={btn.title}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: btn.active
                          ? "rgba(212,175,122,0.22)"
                          : "rgba(8,8,8,0.65)",
                        backdropFilter: "blur(12px)",
                        border: `1px solid ${btn.active ? C.accentDim : "rgba(255,255,255,0.18)"}`,
                        color: btn.active ? C.accent : "rgba(255,255,255,0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {btn.icon}
                    </motion.button>
                  ))}
              </div>

              {/* Rating dots */}
              <div
                style={{ display: "flex", justifyContent: "center", gap: 3 }}
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: 10,
                      color:
                        s <= Math.round(film.rating)
                          ? C.gold
                          : "rgba(255,255,255,0.2)",
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My rating badge */}
        {film.myRating && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(8,8,8,0.8)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${C.accentDim}`,
              padding: "3px 7px",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <span style={{ fontSize: 9, color: C.gold }}>★</span>
            <span style={{ fontFamily: SANS, fontSize: 9, color: C.accent }}>
              {film.myRating}.0
            </span>
          </div>
        )}
        {/* Watched badge */}
        {watched && !film.myRating && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "rgba(8,8,8,0.7)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${C.border}`,
              padding: "3px 6px",
            }}
          >
            <Eye size={9} color={C.textSoft} />
          </div>
        )}
      </div>

      {/* Card info below poster */}
      <div style={{ padding: "10px 2px 0", position: "relative", zIndex: 1 }}>
        <Link to={linkPath} style={{ textDecoration: "none" }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 14,
              color: C.text,
              lineHeight: 1.25,
              marginBottom: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {film.title}
          </div>
        </Link>
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 12,
            color: C.textSoft,
          }}
        >
          {film.director} {film.year > 0 && `· ${film.year}`}
        </div>
      </div>
    </motion.div>
  );
}

// ─── LIST ROW ─────────────────────────────────────────────────
function ListRow({
  film,
  index,
  onLog,
}: {
  film: Film;
  index: number;
  onLog: (f: Film) => void;
}) {
  const [hov, setHov] = useState(false);
  const [liked, setLiked] = useState(film.liked ?? false);
  const [watched, setWatched] = useState(film.watched ?? false);
  const [following, setFollowing] = useState(false);
  const token = getStoredAccessToken();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return window.dispatchEvent(new CustomEvent("open-auth-modal"));
    try {
      if (liked)
        await removeFromFavorites(
          token,
          Number(film.id),
          film.mediaType === "tv" ? "tv" : "movie",
        );
      else
        await addToFavorites(
          token,
          Number(film.id),
          film.mediaType === "tv" ? "tv" : "movie",
        );
      setLiked(!liked);
    } catch {}
  };

  const handleWatch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return window.dispatchEvent(new CustomEvent("open-auth-modal"));
    try {
      if (watched)
        await removeFromWatchlist(
          token,
          Number(film.id),
          film.mediaType === "tv" ? "tv" : "movie",
        );
      else
        await addToWatchlist(
          token,
          Number(film.id),
          film.mediaType === "tv" ? "tv" : "movie",
        );
      setWatched(!watched);
    } catch {}
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return window.dispatchEvent(new CustomEvent("open-auth-modal"));
    try {
      if (following) await unfollowPerson(token, Number(film.id));
      else await followPerson(token, Number(film.id), film.title);
      setFollowing(!following);
    } catch {}
  };

  const linkPath =
    film.mediaType === "person"
      ? `/person/${film.slug || film.id}`
      : film.mediaType === "tv"
        ? `/tv/${film.slug || film.id}`
        : `/movie/${film.slug || film.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.45, delay: index * 0.04 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "70px 1fr auto",
        gap: 20,
        padding: "18px 20px",
        background: hov ? "rgba(255,255,255,0.018)" : "transparent",
        borderBottom: `1px solid ${C.border}`,
        alignItems: "flex-start",
        transition: "background 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle per-row glow at left edge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: hov ? `rgba(${film.glowRgb}, 0.7)` : "transparent",
          transition: "background 0.3s",
        }}
      />

      {/* Poster */}
      <Link to={linkPath} style={{ textDecoration: "none", flexShrink: 0 }}>
        <div
          style={{
            width: 70,
            height: 105,
            overflow: "hidden",
            border: `1px solid ${hov ? "rgba(212,175,122,0.25)" : C.border}`,
            boxShadow: hov
              ? `0 4px 20px rgba(${film.glowRgb}, 0.25)`
              : "0 2px 8px rgba(0,0,0,0.5)",
            transition: "all 0.3s",
            position: "relative",
          }}
        >
          <Img
            src={film.img}
            alt={film.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: `saturate(${hov ? 0.7 : 0.5})`,
              transition: "filter 0.3s, transform 0.4s",
              transform: hov ? "scale(1.05)" : "scale(1)",
            }}
          />
        </div>
      </Link>

      {/* Main info */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            marginBottom: 4,
            flexWrap: "wrap",
          }}
        >
          <Link to={linkPath} style={{ textDecoration: "none" }}>
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 22,
                fontWeight: 400,
                color: hov ? C.text : "rgba(226,226,226,0.92)",
                lineHeight: 1.1,
                transition: "color 0.2s",
              }}
            >
              {film.title}
            </span>
          </Link>
          {film.year > 0 && (
            <span
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 15,
                color: C.textSoft,
              }}
            >
              {film.year}
            </span>
          )}
          <span style={{ fontFamily: SANS, fontSize: 10, color: C.textMuted }}>
            ·
          </span>
          <span style={{ fontFamily: SANS, fontSize: 10, color: C.textMuted }}>
            {film.duration}
          </span>
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 14,
            color: C.accentDim,
            marginBottom: 8,
          }}
        >
          {film.director}
          <span style={{ color: C.textMuted, marginLeft: 8 }}>
            {film.country}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          {film.genres.slice(0, 3).map((g) => (
            <span
              key={g}
              style={{
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.textMuted,
                border: `1px solid ${C.border}`,
                padding: "2px 8px",
                fontFamily: SANS,
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
            fontSize: 15,
            lineHeight: 1.68,
            color: "rgba(226,226,226,0.55)",
            margin: 0,
            maxWidth: 640,
          }}
        >
          {film.synopsis}
        </p>
      </div>

      {/* Right: ratings + actions */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 14,
          flexShrink: 0,
          minWidth: 100,
        }}
      >
        {/* Community rating */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: C.textMuted,
              marginBottom: 5,
            }}
          >
            Comunidad
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "flex-end",
            }}
          >
            <Stars n={film.rating} size={10} />
            <span
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 15,
                color: C.gold,
              }}
            >
              {film.rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* My rating */}
        {film.myRating && (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.textMuted,
                marginBottom: 5,
              }}
            >
              Mi nota
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "flex-end",
              }}
            >
              <Stars n={film.myRating} size={10} />
              <span
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 15,
                  color: C.accent,
                }}
              >
                {film.myRating}.0
              </span>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div
          style={{
            display: "flex",
            gap: 7,
            opacity: hov ? 1 : 0,
            transition: "opacity 0.2s",
            position: "relative",
            zIndex: 3,
          }}
        >
          {film.mediaType === "person" ? (
            <button
              onClick={handleFollow}
              style={{
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: following
                  ? "rgba(212,175,122,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${following ? C.accentDim : C.border}`,
                color: following ? C.accent : C.textSoft,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title="Seguir"
            >
              {following ? <UserCheck size={12} /> : <UserPlus size={12} />}
            </button>
          ) : (
            <button
              onClick={handleWatch}
              style={{
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: watched
                  ? "rgba(212,175,122,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${watched ? C.accentDim : C.border}`,
                color: watched ? C.accent : C.textSoft,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title="Watchlist"
            >
              <Eye size={12} />
            </button>
          )}
          <button
            onClick={handleLike}
            style={{
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: liked
                ? "rgba(212,175,122,0.12)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${liked ? C.accentDim : C.border}`,
              color: liked ? C.accent : C.textSoft,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            title="Me gusta"
          >
            <Heart
              size={12}
              fill={liked ? C.accent : "none"}
              strokeWidth={1.5}
            />
          </button>
          {film.mediaType !== "person" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLog(film);
              }}
              style={{
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.border}`,
                color: C.textSoft,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title="Añadir al Diario"
            >
              <BookOpen size={12} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── CATEGORY ROW ────────────────────────────────────────────
function CategoryRow({
  title,
  subtitle,
  films,
  showRank = false,
  badge,
}: {
  title: string;
  subtitle?: string;
  films: Film[];
  showRank?: boolean;
  badge?: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const drag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const startX = e.pageX - el.offsetLeft;
    const sl = el.scrollLeft;
    el.style.cursor = "grabbing";
    const move = (ev: MouseEvent) => {
      el.scrollLeft = sl - (ev.pageX - el.offsetLeft - startX);
    };
    const up = () => {
      el.style.cursor = "grab";
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6 }}
      style={{ marginBottom: 56 }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: subtitle ? 5 : 0,
            }}
          >
            <div
              style={{
                width: 3,
                height: 20,
                background: `linear-gradient(to bottom, ${C.accent}, ${C.accentDim})`,
              }}
            />
            <h2
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: 26,
                color: C.text,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && (
            <p
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 14,
                color: C.textSoft,
                margin: "0 0 0 15px",
                lineHeight: 1,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.textSoft,
            fontFamily: SANS,
            fontSize: 9,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.textSoft)}
        >
          Ver todo <ChevronRight size={10} />
        </button>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        onMouseDown={drag}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 8,
          scrollbarWidth: "none",
          cursor: "grab",
          userSelect: "none",
        }}
      >
        {films.map((film, i) => (
          <motion.div
            key={film.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            style={{ flexShrink: 0, width: 140, position: "relative" }}
          >
            {/* Glow */}
            <div
              style={{
                position: "absolute",
                bottom: -6,
                left: "5%",
                right: "5%",
                height: "50%",
                background: `radial-gradient(ellipse at 50% 100%, rgba(${film.glowRgb}, 0.28) 0%, transparent 70%)`,
                filter: "blur(14px)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            <Link
              to={
                film.mediaType === "tv"
                  ? `/tv/${film.slug || film.id}`
                  : film.mediaType === "person"
                    ? `/person/${film.slug || film.id}`
                    : `/movie/${film.slug || film.id}`
              }
              style={{
                textDecoration: "none",
                display: "block",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "2/3",
                  overflow: "hidden",
                  marginBottom: 10,
                  border: `1px solid ${C.border}`,
                  transition: "border-color 0.25s, transform 0.3s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(212,175,122,0.3)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                <Img
                  src={film.img}
                  alt={film.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "saturate(0.55) brightness(0.7)",
                    transition: "filter 0.3s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.filter =
                      "saturate(0.75) brightness(0.8)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.filter =
                      "saturate(0.55) brightness(0.7)")
                  }
                />

                {/* Rank overlay */}
                {showRank && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background:
                        "linear-gradient(to top, rgba(8,8,8,0.85), transparent)",
                      display: "flex",
                      alignItems: "flex-end",
                      padding: "8px 8px 6px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontSize: 28,
                        color: i < 3 ? C.accent : C.textSoft,
                        lineHeight: 1,
                        opacity: 0.9,
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>
                )}

                {/* Rating pill */}
                <div
                  style={{
                    position: "absolute",
                    top: 7,
                    left: 7,
                    background: "rgba(8,8,8,0.8)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${C.border}`,
                    padding: "2px 6px",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 8, color: C.gold }}>★</span>
                  <span
                    style={{ fontFamily: SANS, fontSize: 8, color: C.textSoft }}
                  >
                    {film.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: C.text,
                  lineHeight: 1.3,
                  marginBottom: 3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {film.title}
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 11,
                  color: C.textSoft,
                }}
              >
                {film.director}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ─── SORT DROPDOWN (inline) ───────────────────────────────────
function SortDropdown({
  value,
  onChange,
}: {
  value: SortId;
  onChange: (v: SortId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "9px 14px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${C.border}`,
          color: C.textSoft,
          fontFamily: SANS,
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = C.borderHover;
          (e.currentTarget as HTMLElement).style.color = C.text;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = C.border;
          (e.currentTarget as HTMLElement).style.color = C.textSoft;
        }}
      >
        <ArrowUpDown size={11} />
        {SORT_OPTIONS.find((s) => s.id === value)?.label}
        <ChevronDown
          size={10}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              background: C.elevated,
              border: `1px solid ${C.border}`,
              minWidth: 180,
              zIndex: 300,
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onChange(opt.id as SortId);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  background:
                    value === opt.id ? "rgba(212,175,122,0.08)" : "transparent",
                  border: "none",
                  borderBottom: `1px solid ${C.border}`,
                  color: value === opt.id ? C.accent : C.text,
                  fontFamily: SANS,
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (value !== opt.id)
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (value !== opt.id)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                {value === opt.id ? (
                  <Check size={10} color={C.accent} />
                ) : (
                  <div style={{ width: 10 }} />
                )}
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export function Films() {
  const [films, setFilms] = useState<Film[]>([]);
  const [upcoming, setUpcoming] = useState<Film[]>([]);
  const [topRated, setTopRated] = useState<Film[]>([]);
  const [cult, setCult] = useState<Film[]>([]);

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Diary Modal States
  const [logMovie, setLogMovie] = useState<Film | null>(null);
  const [reviewLogOpen, setReviewLogOpen] = useState(false);
  const [reviewLogSaving, setReviewLogSaving] = useState(false);
  const [reviewLogForm, setReviewLogForm] = useState({
    text: "",
    rating: 0,
    mode: "RAPIDO" as any,
    veredicto: "",
    contieneSpoilers: false,
    citaDialogo: "",
    citaPersonaje: "",
    timestamps: [] as any[],
    dimensions: {
      direccion: 0,
      guion: 0,
      fotografia: 0,
      actuaciones: 0,
      bandaSonora: 0,
    },
    liked: false,
    seenDate: new Date().toISOString().split("T")[0],
    seenBefore: false,
  });

  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<Filters>({
    genres: [],
    yearRange: null,
    country: null,
    sortBy: "rating",
  });
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    if (query.trim()) setIsTyping(true);
    else setIsTyping(false);

    const searchTimeout = setTimeout(async () => {
      try {
        const genreList = await fetchMovieGenres();
        const map: Record<number, string> = {};
        genreList.forEach((g) => (map[g.id] = g.name));

        if (query.trim()) {
          setIsLoading(true);
          setIsTyping(false);

          // If it's a genre name, maybe prioritize that?
          const matchedGenre = genreList.find(
            (g) => g.name.toLowerCase() === query.toLowerCase(),
          );

          let res;
          if (matchedGenre) {
            res = await searchMovie(query, 1, [matchedGenre.id]);
          } else if (/^\d{4}$/.test(query.trim())) {
            // If exactly 4 digits, try searching as year? Handled by ranked mostly.
            res = await searchMulti(query);
          } else {
            res = await searchMulti(query);
          }

          if (active) {
            setFilms((res.results || []).map((m) => mapBackendToFilm(m, map)));
            setIsLoading(false);
          }
        } else {
          setIsLoading(true);
          const popRes = await fetchPopularMovies();
          if (active) {
            const mappedPop = (popRes.results || []).map((m) =>
              mapBackendToFilm(m, map),
            );
            setFilms(mappedPop);
            setCult([...mappedPop].reverse().slice(0, 10));
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.error(e);
        setIsLoading(false);
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(searchTimeout);
    };
  }, [query]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const genreList = await fetchMovieGenres();
        const map: Record<number, string> = {};
        genreList.forEach((g) => (map[g.id] = g.name));

        const [upRes, topRes, cultRes] = await Promise.all([
          fetchUpcomingMovies(),
          fetchTopRatedMovies(),
          searchMovie("cult classics", 1),
        ]);

        setUpcoming((upRes.results || []).map((m) => mapBackendToFilm(m, map)));
        setTopRated(
          (topRes.results || []).map((m) => mapBackendToFilm(m, map)),
        );
        setCult(
          (cultRes.results || [])
            .slice(0, 10)
            .map((m) => mapBackendToFilm(m, map)),
        );
      } catch (e) {}
    }
    loadCategories();
  }, []);

  // Derived film list
  const visibleFilms = (() => {
    let list = [...films];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.director.toLowerCase().includes(q) ||
          f.genres.some((g) => g.toLowerCase().includes(q)) ||
          String(f.year).includes(q),
      );
    }
    if (filters.genres.length) {
      list = list.filter((f) =>
        filters.genres.some((g) =>
          f.genres.map((x) => x.toLowerCase()).includes(g.toLowerCase()),
        ),
      );
    }
    if (filters.yearRange) {
      const yr = YEAR_RANGES.find((y) => y.label === filters.yearRange);
      if (yr) list = list.filter((f) => f.year >= yr.from && f.year <= yr.to);
    }
    if (filters.country) {
      list = list.filter((f) =>
        f.country.toLowerCase().includes(filters.country!.toLowerCase()),
      );
    }
    if (filters.sortBy === "rating") list.sort((a, b) => b.rating - a.rating);
    else if (filters.sortBy === "recent") list.sort((a, b) => b.year - a.year);
    else if (filters.sortBy === "alpha")
      list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  })();

  function updateFilter(key: keyof Filters, value: any) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }
  function toggleGenre(g: string) {
    setFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(g)
        ? prev.genres.filter((x) => x !== g)
        : [...prev.genres, g],
    }));
  }
  function removeFilter(key: keyof Filters, value?: string) {
    if (key === "genres" && value) {
      setFilters((prev) => ({
        ...prev,
        genres: prev.genres.filter((g) => g !== value),
      }));
    } else if (key === "sortBy") {
      setFilters((prev) => ({ ...prev, sortBy: "rating" }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: key === "genres" ? [] : null }));
    }
  }
  const clearAllFilters = () => {
    setFilters({
      genres: [],
      yearRange: null,
      country: null,
      sortBy: "rating",
    });
  };

  const handleOpenLog = (film: Film) => {
    setLogMovie(film);
    setReviewLogForm((p) => ({ ...p, liked: film.liked || false }));
    setReviewLogOpen(true);
  };

  const handleSaveReviewLog = async () => {
    const token = getStoredAccessToken();
    if (!token || !logMovie) return;
    setReviewLogSaving(true);
    try {
      await createReview(token, {
        movie_id: Number(logMovie.id),
        media_type: logMovie.mediaType === "tv" ? "tv" : "movie",
        mode: reviewLogForm.mode,
        content: reviewLogForm.text,
        rating: reviewLogForm.rating,
        veredicto: reviewLogForm.veredicto,
        contiene_spoilers: reviewLogForm.contieneSpoilers,
        cita_dialogo: reviewLogForm.citaDialogo,
        cita_personaje: reviewLogForm.citaPersonaje,
        timestamps: reviewLogForm.timestamps,
        rating_direccion: reviewLogForm.dimensions.direccion,
        rating_guion: reviewLogForm.dimensions.guion,
        rating_fotografia: reviewLogForm.dimensions.fotografia,
        rating_actuaciones: reviewLogForm.dimensions.actuaciones,
        rating_banda_sonora: reviewLogForm.dimensions.bandaSonora,
      });
      setReviewLogOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewLogSaving(false);
    }
  };

  const hasActiveFilters =
    filters.genres.length > 0 ||
    filters.yearRange ||
    filters.country ||
    filters.sortBy !== "rating";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <Grain />
      <Navbar />

      <div style={{ paddingTop: 60 }}>
        {/* ── PAGE HEADER + SEARCH BLOCK ── */}
        <div
          style={{
            padding: "44px 40px 0",
            borderBottom: `1px solid ${C.border}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background grid texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.015) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.01) 40px)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 200,
              background: `radial-gradient(ellipse at 15% 100%, ${C.accentGlow} 0%, transparent 55%)`,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: 1160,
              margin: "0 auto",
            }}
          >
            {/* Title row */}
            <div style={{ marginBottom: 32 }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  fontFamily: SANS,
                  fontSize: 9,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: C.accent,
                  marginBottom: 12,
                }}
              >
                La Vitrina · Catálogo
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08 }}
                style={{
                  fontFamily: SERIF,
                  fontWeight: 300,
                  fontSize: "clamp(36px, 5vw, 56px)",
                  color: C.text,
                  margin: "0 0 8px",
                  lineHeight: 1.0,
                }}
              >
                Catálogo de Películas
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.18 }}
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 16,
                  color: C.textSoft,
                  margin: 0,
                }}
              >
                {films.length.toLocaleString()} películas indexadas. Filtrá,
                buscá, descubrí.
              </motion.p>
            </div>

            {/* ── SEARCH BAR ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
              style={{ marginBottom: 16 }}
            >
              <div style={{ position: "relative", maxWidth: 680 }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: 18,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: searchFocused ? C.accent : C.textSoft,
                    pointerEvents: "none",
                    transition: "color 0.2s",
                  }}
                />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Título, director, género, año…"
                  style={{
                    width: "100%",
                    padding: "14px 48px 14px 48px",
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${searchFocused ? C.accentDim : C.border}`,
                    color: C.text,
                    fontFamily: SERIF,
                    fontSize: 18,
                    outline: "none",
                    boxSizing: "border-box",
                    letterSpacing: "0.02em",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: searchFocused
                      ? `0 0 0 3px ${C.accentGlow}`
                      : "none",
                  }}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    style={{
                      position: "absolute",
                      right: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: C.textSoft,
                      display: "flex",
                      alignItems: "center",
                      padding: 2,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = C.textSoft)
                    }
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>

            {/* ── FILTER ROW ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                paddingBottom: 20,
                position: "relative",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: C.textMuted,
                  fontFamily: SANS,
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginRight: 4,
                }}
              >
                <SlidersHorizontal size={11} /> Filtrar por
              </div>

              <FilterDropdown
                label="Género"
                value={
                  filters.genres.length === 1
                    ? filters.genres[0]
                    : `${filters.genres.length} géneros`
                }
                options={GENRE_OPTIONS}
                multi
                selected={filters.genres}
                onSelect={toggleGenre}
                onClear={() => updateFilter("genres", [])}
              />
              <FilterDropdown
                label="Período"
                value={filters.yearRange ?? ""}
                options={YEAR_RANGES.map((y) => y.label)}
                selected={filters.yearRange ? [filters.yearRange] : []}
                onSelect={(v) => updateFilter("yearRange", v)}
                onClear={() => updateFilter("yearRange", null)}
              />
              <FilterDropdown
                label="País"
                value={filters.country ?? ""}
                options={COUNTRY_OPTIONS}
                selected={filters.country ? [filters.country] : []}
                onSelect={(v) => updateFilter("country", v)}
                onClear={() => updateFilter("country", null)}
              />

              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={clearAllFilters}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 12px",
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    color: C.textSoft,
                    fontFamily: SANS,
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "#ff4444";
                    (e.currentTarget as HTMLElement).style.color = "#ff7777";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      C.border;
                    (e.currentTarget as HTMLElement).style.color = C.textSoft;
                  }}
                >
                  <X size={9} /> Limpiar filtros
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>

        {/* ── RESULTS TOOLBAR ── */}
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 0",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {/* Active filter pills */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <AnimatePresence>
                {hasActiveFilters && (
                  <ActiveFilterPills
                    filters={filters}
                    onRemove={removeFilter}
                    onClearAll={clearAllFilters}
                  />
                )}
              </AnimatePresence>

              {/* Result count when no pills */}
              {!hasActiveFilters && (
                <span
                  style={{
                    fontFamily: SANS,
                    fontSize: 10,
                    color: C.textMuted,
                    letterSpacing: "0.1em",
                  }}
                >
                  {visibleFilms.length} películas
                  {query ? ` para "${query}"` : ""}
                </span>
              )}
            </div>

            {/* Right: sort + view toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <SortDropdown
                value={filters.sortBy}
                onChange={(v) => updateFilter("sortBy", v)}
              />
              <ViewToggle view={view} onChange={setView} />
            </div>
          </div>

          {/* ── GRID / LIST VIEW ── */}
          <AnimatePresence mode="wait">
            {visibleFilms.length === 0 && !isLoading && !isTyping ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: "64px 0",
                  textAlign: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <p
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 22,
                    color: C.textSoft,
                    marginBottom: 12,
                  }}
                >
                  No hay películas con esos filtros.
                </p>
                <button
                  onClick={clearAllFilters}
                  style={{
                    padding: "11px 24px",
                    background: "transparent",
                    border: `1px solid ${C.accentDim}`,
                    color: C.accent,
                    fontFamily: SANS,
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Reiniciar búsqueda
                </button>
              </motion.div>
            ) : isLoading || isTyping ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: "64px 0", textAlign: "center" }}
              >
                <div
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 18,
                    color: C.textSoft,
                  }}
                >
                  Buscando en la boveda...
                </div>
              </motion.div>
            ) : view === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "30px 20px",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {visibleFilms.map((film, i) => (
                  <GridCard
                    key={film.id + i}
                    film={film}
                    index={i}
                    onLog={handleOpenLog}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  marginBottom: 60,
                  overflow: "hidden",
                }}
              >
                {/* List header row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "70px 1fr auto",
                    gap: 20,
                    padding: "10px 20px",
                    borderBottom: `1px solid ${C.border}`,
                    background: "rgba(255,255,255,0.015)",
                  }}
                >
                  <div />
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 9,
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: C.textMuted,
                    }}
                  >
                    Película
                  </div>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 9,
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      color: C.textMuted,
                      minWidth: 100,
                      textAlign: "right",
                    }}
                  >
                    Rating
                  </div>
                </div>
                {visibleFilms.map((film, i) => (
                  <ListRow
                    key={film.id + i}
                    film={film}
                    index={i}
                    onLog={handleOpenLog}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── EXPLORE CATEGORIES ── */}
          <div
            style={{
              borderTop: `1px solid ${C.border}`,
              paddingTop: 56,
              marginTop: view === "list" ? 0 : -16,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ marginBottom: 40 }}
            >
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 9,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: C.accent,
                  marginBottom: 4,
                }}
              >
                Explorar
              </div>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontWeight: 300,
                  fontSize: 32,
                  color: C.text,
                  margin: 0,
                }}
              >
                Descubrir por categoría
              </h2>
            </motion.div>

            <CategoryRow
              title="Próximos estrenos"
              subtitle="Lo que no te podés perder este año"
              films={upcoming}
            />

            <CategoryRow
              title="Mejor valoradas en CineVault"
              subtitle="Las más aclamadas por la comunidad cinéfila"
              films={topRated}
              showRank
              badge={
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 9px",
                    background: C.accentGlow,
                    border: `1px solid ${C.accentDim}`,
                  }}
                >
                  <Star size={9} fill={C.gold} color={C.gold} />
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 8,
                      color: C.gold,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    Top rated
                  </span>
                </div>
              }
            />

            <CategoryRow
              title="Clásicos de culto"
              subtitle="Incomprendidas en su tiempo. Veneradas para siempre"
              films={cult}
            />
          </div>
        </div>
      </div>
      {/* ── LOG MODAL ── */}
      <ReviewLogModal
        open={reviewLogOpen}
        movie={
          logMovie
            ? ({
                id: Number(logMovie.id),
                title: logMovie.title,
                poster_path: logMovie.img.includes("/p/w500")
                  ? logMovie.img.split("/p/w500")[1]
                  : null,
              } as any)
            : null
        }
        text={reviewLogForm.text}
        rating={reviewLogForm.rating}
        mode={reviewLogForm.mode}
        veredicto={reviewLogForm.veredicto}
        contieneSpoilers={reviewLogForm.contieneSpoilers}
        citaDialogo={reviewLogForm.citaDialogo}
        citaPersonaje={reviewLogForm.citaPersonaje}
        timestamps={reviewLogForm.timestamps}
        dimensions={reviewLogForm.dimensions}
        liked={reviewLogForm.liked}
        seenDate={reviewLogForm.seenDate}
        seenBefore={reviewLogForm.seenBefore}
        saving={reviewLogSaving}
        onClose={() => setReviewLogOpen(false)}
        onTextChange={(val) => setReviewLogForm((p) => ({ ...p, text: val }))}
        onRatingChange={(val) =>
          setReviewLogForm((p) => ({ ...p, rating: val }))
        }
        onModeChange={(val) => setReviewLogForm((p) => ({ ...p, mode: val }))}
        onVeredictoChange={(val) =>
          setReviewLogForm((p) => ({ ...p, veredicto: val }))
        }
        onContieneSpoilersChange={(val) =>
          setReviewLogForm((p) => ({ ...p, contieneSpoilers: val }))
        }
        onCitaDialogoChange={(val) =>
          setReviewLogForm((p) => ({ ...p, citaDialogo: val }))
        }
        onCitaPersonajeChange={(val) =>
          setReviewLogForm((p) => ({ ...p, citaPersonaje: val }))
        }
        onDimensionsChange={(key, val) =>
          setReviewLogForm((p) => ({
            ...p,
            dimensions: { ...p.dimensions, [key]: val },
          }))
        }
        onAddTimestamp={() =>
          setReviewLogForm((p) => ({
            ...p,
            timestamps: [...p.timestamps, { minuto: "", descripcion: "" }],
          }))
        }
        onTimestampChange={(idx, field, val) =>
          setReviewLogForm((p) => ({
            ...p,
            timestamps: p.timestamps.map((t, i) =>
              i === idx ? { ...t, [field]: val } : t,
            ),
          }))
        }
        onRemoveTimestamp={(idx) =>
          setReviewLogForm((p) => ({
            ...p,
            timestamps: p.timestamps.filter((_, i) => i !== idx),
          }))
        }
        onToggleLike={() =>
          setReviewLogForm((p) => ({ ...p, liked: !p.liked }))
        }
        onSeenDateChange={(val) =>
          setReviewLogForm((p) => ({ ...p, seenDate: val }))
        }
        onSeenBeforeChange={(val) =>
          setReviewLogForm((p) => ({ ...p, seenBefore: val }))
        }
        onSave={handleSaveReviewLog}
      />
    </div>
  );
}
