import { useEffect, useMemo, useState, type ReactNode } from "react";
import DOMPurify from "dompurify";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2,
  BookOpen,
  Check,
  Clock,
  Ellipsis,
  Film,
  Filter,
  Globe,
  Heart,
  Lock,
  Pin,
  PinOff,
  Play,
  Plus,
  Pencil,
  SortDesc,
  Trash,
  Trash2,
  Trophy,
  Upload,
} from "lucide-react";
import { C, SANS, SERIF, textClampOneLine } from "./theme";
import { Badge, Img, SectionHeader, Stars } from "./primitives";
import { IMG } from "./assets";
import type {
  DiaryTimelineItem,
  EnrichedMovie,
  ProfileStatsData,
  RecentlyWatchedItem,
  ReviewItem,
  UserListSummaryItem,
  WatchlistItem,
} from "./models";
import {
  deleteReview,
  removeFromWatchlist,
} from "../../services/movieDetailServices";
import {
  removeVaultSocialEntry,
  type VaultSocialEntry,
} from "../../services/profileServices";
import { getStoredAccessToken } from "../../services/authServices";
import { createSlug } from "../../utils/stringUtils";

const mediaHref = (
  movieId: number,
  title: string,
  tmdbId: number | null,
  mediaType?: "movie" | "tv" | null,
) => {
  const type = mediaType === "tv" ? "tv" : "movie";
  return `/${type}/${tmdbId ?? movieId}-${createSlug(title)}`;
};

const reviewHref = (review: ReviewItem) => {
  const type = review.mediaType === "tv" ? "tv" : "movie";
  const slug = `${review.tmdbId || review.movieId}-${createSlug(review.title)}`;
  const suffix =
    review.reviewSequence > 1 ? `/${review.reviewSequence - 1}` : "";
  return `/${review.username}/${type}/${slug}${suffix}`;
};

const PROFILE_STAR_SIZES = {
  cardMobile: 10,
  cardHover: 11,
  reviewCompact: 11,
  reviewDesktop: 12,
} as const;
import "./Profile.css";

import { fetchTonightMovie } from "../../services/socialServices";
import type { TonightResponse } from "../../services/socialServices";

function NightRec() {
  const [recommendation, setRecommendation] = useState<TonightResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    fetchTonightMovie()
      .then((data) => {
        setRecommendation(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          padding: "24px 28px",
          marginBottom: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 120,
        }}
      >
        <span
          style={{
            color: C.textSoft,
            fontFamily: SANS,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Clock size={14} /> Calculando sugerencia para esta noche...
        </span>
      </div>
    );
  }

  const movie = recommendation?.media;

  // Como la API nueva no nos devuelve runtimeMinutes de primera (dependiendo de tmdb),
  // mostramos el rating promedio o el "weather context"
  const tagLabel = movie?.vote_average
    ? `${movie.vote_average.toFixed(1)} ★ TMDB`
    : movie?.weather_context === "rainy"
      ? "Clima lluvioso"
      : movie?.weather_context || "Noche de cine";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="profile-night-rec"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.accent}`,
        padding: "24px 28px",
        marginBottom: 48,
        display: "flex",
        alignItems: "center",
        gap: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 200,
          height: "100%",
          background: `linear-gradient(90deg, ${C.accentGlow}, transparent)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: 54,
          flexShrink: 0,
          aspectRatio: "2/3",
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Img
          src={
            movie?.poster_path
              ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
              : IMG.cinema
          }
          alt={movie?.title || "Recomendación"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(0.5)",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: C.accent,
            marginBottom: 6,
            display: "block",
            fontFamily: SANS,
          }}
        >
          Esta noche, sin excusas
        </span>
        <div
          className="profile-night-rec-title"
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            lineHeight: 1.2,
            color: C.text,
          }}
        >
          {movie?.title || "No hay sugerencias"}
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.textSoft,
            marginTop: 4,
            fontFamily: SANS,
          }}
        >
          {movie
            ? `${movie.year || "Año desconocido"} · ${tagLabel} · ${movie.reason}`
            : "Agrega películas o actividad para tener recomendación automática."}
        </div>
      </div>

      <div
        className="profile-night-rec-actions"
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          position: "relative",
          zIndex: 1,
        }}
      >
        <button
          onClick={() => setWatched((value) => !value)}
          aria-pressed={watched}
          aria-label={
            watched ? "Quitar de vista" : "Marcar como vista esta noche"
          }
          style={{
            padding: "10px 18px",
            background: watched ? C.accentDim : C.accent,
            color: C.bg,
            border: "none",
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {watched ? (
            <>
              <Check size={11} /> Vista
            </>
          ) : (
            "Marcar como vista"
          )}
        </button>
        <div
          style={{
            fontSize: 11,
            color: C.gold,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontFamily: SANS,
            flexWrap: "wrap",
          }}
        >
          <Trophy size={11} /> +40 pts si la ves esta noche
        </div>
      </div>
    </motion.div>
  );
}


// FilmCard horizontal compacta solo para móvil en Resumen
function FilmCardMobile({
  film,
  delay = 0,
}: {
  film: RecentlyWatchedItem;
  delay?: number;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={() =>
        navigate(
          mediaHref(
            film.movieId,
            film.title,
            film.tmdbId,
            (film as any).mediaType,
          ),
        )
      }
      role="link"
      tabIndex={0}
      aria-label={`Ver película ${film.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(
            mediaHref(
              film.movieId,
              film.title,
              film.tmdbId,
              (film as any).mediaType,
            ),
          );
        }
      }}
      style={{
        cursor: "pointer",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        borderBottom: `1px solid ${C.border}`,
        paddingBottom: 12,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 48,
          height: 70,
          flexShrink: 0,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Img
          src={film.posterUrl}
          alt={film.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(0.7)",
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          textAlign: "left",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 16,
            fontWeight: 500,
            color: C.text,
            lineHeight: 1.2,
            marginBottom: 2,
            width: "100%",
            textAlign: "left",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {film.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: C.textSoft,
            fontFamily: SANS,
            marginBottom: 2,
          }}
        >
          {film.year || "—"} • {film.director}
        </div>
        <Stars rating={film.rating} size={PROFILE_STAR_SIZES.cardMobile} />
      </div>
    </motion.div>
  );
}

function FilmCard({
  film,
  delay = 0,
}: {
  film: RecentlyWatchedItem;
  delay?: number;
}) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() =>
        navigate(
          mediaHref(film.movieId, film.title, film.tmdbId, film.mediaType),
        )
      }
      role="link"
      tabIndex={0}
      aria-label={`Ver película ${film.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(
            mediaHref(
              film.movieId,
              film.title,
              film.tmdbId,
              (film as any).mediaType,
            ),
          );
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <div
        style={{
          aspectRatio: "2/3",
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
          marginBottom: 10,
          transform: hovered ? "translateY(-4px)" : "none",
          transition: "transform 0.3s ease",
        }}
      >
        <Img
          src={film.posterUrl}
          alt={film.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: hovered ? "saturate(1)" : "saturate(0.7)",
            transform: hovered ? "scale(1.04)" : "scale(1)",
            transition: "filter 0.4s ease, transform 0.4s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 50%)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 12,
          }}
        >
          <Stars rating={film.rating} size={PROFILE_STAR_SIZES.cardHover} />
        </div>
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: C.text,
          lineHeight: 1.3,
          marginBottom: 2,
          fontFamily: SERIF,
          ...textClampOneLine,
        }}
      >
        {film.title}
      </div>
      <div style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}>
        {film.year || "Año desconocido"}
      </div>
      <div
        style={{
          fontSize: 10,
          color: C.textMuted,
          fontStyle: "italic",
          fontFamily: SERIF,
          marginTop: 1,
        }}
      >
        {film.director}
      </div>
    </motion.div>
  );
}

// VaultCard compacta horizontal para móvil en Resumen
function VaultCardMobile({
  item,
  delay = 0,
  onRemove,
  canManage = false,
}: {
  item: VaultSocialEntry;
  delay?: number;
  onRemove?: (id: number) => void;
  canManage?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={() =>
        item.movie_id &&
        navigate(mediaHref(item.movie_id, item.title, item.tmdb_id))
      }
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        cursor: "pointer",
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "10px 12px",
        overflow: "hidden",
        width: "100%",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 64,
          height: 40,
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
          borderRadius: 1,
        }}
      >
        <Img
          src={
            item.movie_info?.poster_path
              ? `https://image.tmdb.org/t/p/w200${item.movie_info.poster_path}`
              : item.cover_url || IMG.grain
          }
          alt={item.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(0.5) brightness(0.6)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <Play size={10} fill="white" color="white" />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 14,
            color: C.text,
            lineHeight: 1.3,
            marginBottom: 2,
            ...textClampOneLine,
          }}
        >
          {item.title}
        </div>
        <div style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>
          {item.entry_type} · {item.duration_label || "Lectura"}
        </div>
      </div>
      {canManage && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          style={{
            padding: 4,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: C.textMuted,
          }}
        >
          <Trash size={12} />
        </button>
      )}
    </motion.div>
  );
}

function VaultCard({
  item,
  delay = 0,
  onRemove,
  canManage = false,
}: {
  item: VaultSocialEntry;
  delay?: number;
  onRemove?: (id: number) => void;
  canManage?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() =>
        item.movie_id &&
        navigate(mediaHref(item.movie_id, item.title, item.tmdb_id))
      }
      style={{
        background: C.surface,
        border: `1px solid ${hovered ? C.accentDim : C.border}`,
        cursor: "pointer",
        transform: hovered ? "translateY(-3px)" : "none",
        transition: "border-color 0.3s, transform 0.3s",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          aspectRatio: "16/9",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={
            item.movie_info?.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.movie_info.poster_path}`
              : item.cover_url || IMG.grain
          }
          alt={item.title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: hovered
              ? "saturate(0.7) brightness(0.8)"
              : "saturate(0.4) brightness(0.6)",
            transition: "filter 0.4s",
          }}
        />
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <Badge>{item.entry_type}</Badge>
        </div>
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: `1px solid ${hovered ? C.accent : "rgba(255,255,255,0.3)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            background: hovered ? C.accentGlow : "rgba(255,255,255,0.05)",
            transition: "all 0.2s",
          }}
        >
          <Play
            size={12}
            fill="white"
            color="white"
            style={{ marginLeft: 2 }}
          />
        </div>
        {canManage && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash size={12} color="white" />
          </button>
        )}
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 17,
            fontWeight: 400,
            lineHeight: 1.3,
            color: C.text,
            marginBottom: 4,
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.textSoft,
            display: "flex",
            gap: 12,
            alignItems: "center",
            fontFamily: SANS,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={10} />
            {item.duration_label || "Lectura"}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Heart size={10} />
            {item.likes_count} likes
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ReviewCard({
  review,
  delay = 0,
  compact = false,
  pinned = false,
  actionsSlot,
}: {
  review: ReviewItem;
  delay?: number;
  compact?: boolean;
  pinned?: boolean;
  actionsSlot?: ReactNode;
}) {
  const navigate = useNavigate();
  const openReviewThread = () => navigate(reviewHref(review));
  const richText = review.text
    .replace(
      /<b>/g,
      `<strong style="color:${C.text};font-style:normal;font-weight:500">`,
    )
    .replace(/<\/b>/g, "</strong>");

  const safeHtml =
    typeof window !== "undefined"
      ? DOMPurify.sanitize(richText ?? "", {
          ALLOWED_TAGS: ["b", "i", "em", "strong", "br", "p", "span"],
          ALLOWED_ATTR: [],
        })
      : (richText ?? "");

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        onClick={openReviewThread}
        role="link"
        tabIndex={0}
        aria-label={`Ver reseña completa de ${review.title}`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openReviewThread();
          }
        }}
        style={{
          borderBottom: `1px solid ${C.border}`,
          borderTop: pinned ? `1px solid ${C.accentDim}` : "none",
          borderLeft: pinned ? `2px solid ${C.accent}` : "none",
          borderRight: pinned ? `1px solid ${C.accentDim}` : "none",
          borderBottomColor: pinned ? C.accentDim : C.border,
          background: pinned ? "rgba(212,175,122,0.05)" : "transparent",
          padding: "16px 0",
          width: "100%",
          cursor: "pointer",
          position: "relative",
        }}
      >
        {actionsSlot ? (
          <div style={{ position: "absolute", right: 0, top: 10, zIndex: 4 }}>
            {actionsSlot}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          {/* Póster */}
          <div
            style={{
              width: 56,
              height: 84,
              flexShrink: 0,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Img
              src={review.posterUrl}
              alt={review.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "saturate(0.6)",
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 18,
                fontWeight: 400,
                color: C.text,
                textAlign: "left",
                display: "block",
                marginBottom: 4,
                width: "100%",
                ...textClampOneLine,
              }}
            >
              {review.title}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Stars rating={review.rating} size={11} />
              <span
                style={{ fontSize: 11, color: C.textMuted, fontFamily: SANS }}
              >
                {review.createdAtLabel}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: SERIF,
            fontSize: 16,
            fontStyle: "italic",
            color: C.textSoft,
            lineHeight: 1.6,
            display: "block",
            textAlign: "left",
            width: "100%",
            whiteSpace: "normal",
            wordBreak: "break-word",
            marginBottom: 16,
            minHeight: "min-content",
            overflow: "visible",
          }}
        >
          {review.text}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {review.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.textSoft,
                border: `1px solid ${C.border}`,
                padding: "3px 8px",
                fontFamily: SANS,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onClick={openReviewThread}
      role="link"
      tabIndex={0}
      aria-label={`Ver reseña completa de ${review.title}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openReviewThread();
        }
      }}
      style={{
        borderBottom: `1px solid ${pinned ? C.accentDim : C.border}`,
        borderTop: pinned ? `1px solid ${C.accentDim}` : "none",
        borderLeft: pinned ? `2px solid ${C.accent}` : "none",
        borderRight: pinned ? `1px solid ${C.accentDim}` : "none",
        background: pinned ? "rgba(212,175,122,0.05)" : "transparent",
        padding: "24px 0",
        display: "grid",
        gridTemplateColumns: "56px 1fr",
        gap: 20,
        cursor: "pointer",
        position: "relative",
      }}
    >
      {actionsSlot ? (
        <div style={{ position: "absolute", right: 0, top: 10, zIndex: 4 }}>
          {actionsSlot}
        </div>
      ) : null}
      <div style={{ aspectRatio: "2/3", borderRadius: 1, overflow: "hidden" }}>
        <Img
          src={review.posterUrl}
          alt={review.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(0.6)",
          }}
        />
      </div>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 8,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 20,
              fontWeight: 400,
              color: C.text,
            }}
          >
            {review.title}
          </div>
          <Stars
            rating={review.rating}
            size={PROFILE_STAR_SIZES.reviewDesktop}
          />
          <span
            style={{
              fontSize: 11,
              color: C.textMuted,
              marginLeft: "auto",
              fontFamily: SANS,
            }}
          >
            {review.createdAtLabel}
          </span>
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 16,
            fontStyle: "italic",
            color: C.textSoft,
            lineHeight: 1.7,
            maxWidth: 680,
          }}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
        <div
          style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}
        >
          {review.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: C.textSoft,
                border: `1px solid ${C.border}`,
                padding: "3px 10px",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: SANS,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function WatchlistStrip({
  watchlistFilms,
}: {
  watchlistFilms: WatchlistItem[];
}) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        paddingBottom: 8,
        marginBottom: 48,
        scrollbarWidth: "none",
      }}
    >
      {watchlistFilms.slice(0, 8).map((film, index) => (
        <motion.div
          key={film.movieId}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04 }}
          style={{ flexShrink: 0, width: 80, cursor: "pointer" }}
          onClick={() =>
            navigate(
              mediaHref(film.movieId, film.title, film.tmdbId, film.mediaType),
            )
          }
        >
          <div
            style={{
              aspectRatio: "2/3",
              borderRadius: 1,
              overflow: "hidden",
              marginBottom: 6,
              transition: "transform 0.3s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-3px)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            <Img
              src={film.posterUrl}
              alt={film.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "saturate(0.6)",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 10,
              color: C.text,
              fontFamily: SANS,
              ...textClampOneLine,
            }}
          >
            {film.title}
          </div>
          <div style={{ fontSize: 9, color: C.textSoft, fontFamily: SANS }}>
            {film.year || "—"}
          </div>
        </motion.div>
      ))}
      <div style={{ flexShrink: 0, width: 80, cursor: "pointer" }}>
        <div
          style={{
            aspectRatio: "2/3",
            borderRadius: 1,
            background: C.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 24,
              fontWeight: 300,
              color: C.textSoft,
            }}
          >
            +{Math.max(0, watchlistFilms.length - 8)}
          </span>
        </div>
        <div style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>
          más...
        </div>
      </div>
    </div>
  );
}

function buildCuratedGallery(
  recentlyWatched: RecentlyWatchedItem[],
  watchlistFilms: WatchlistItem[],
  curatedMovieIds: number[],
  allDiaryFilms: RecentlyWatchedItem[] = [],
) {
  if (curatedMovieIds.length > 0) {
    const byId = new Map<number, EnrichedMovie>();
    // Prefer all diary films as source if provided
    const sourcePool =
      allDiaryFilms.length > 0 ? allDiaryFilms : recentlyWatched;
    for (const film of [...sourcePool, ...watchlistFilms]) {
      byId.set(film.movieId, film);
    }

    return curatedMovieIds
      .map((movieId) => byId.get(movieId))
      .filter((film): film is EnrichedMovie => Boolean(film))
      .slice(0, 6);
  }

  const seen = new Set<number>();
  const curated: EnrichedMovie[] = [];

  for (const film of [...recentlyWatched, ...watchlistFilms]) {
    if (seen.has(film.movieId)) continue;
    seen.add(film.movieId);
    curated.push(film);
    if (curated.length === 6) break;
  }

  return curated;
}

function CuratedGallery({
  films,
  curatedNotesByMovieId,
  canEdit,
  onCurate,
}: {
  films: EnrichedMovie[];
  curatedNotesByMovieId: Record<number, string>;
  canEdit: boolean;
  onCurate: () => void;
}) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  if (films.length === 0 && !canEdit) return null;

  return (
    <div style={{ marginBottom: 52 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 26,
              fontWeight: 400,
              color: C.text,
              lineHeight: 1.2,
            }}
          >
            Galería curada{" "}
            <em
              style={{ color: C.textSoft, fontStyle: "italic", fontSize: 20 }}
            >
              — {films.length} películas que me definen
            </em>
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.textMuted,
              fontFamily: SERIF,
              fontStyle: "italic",
              marginTop: 6,
            }}
          >
            No las últimas que vi. Las que elegiría si tuviera que mostrarme.
          </div>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={onCurate}
            style={{
              padding: "8px 16px",
              background: "transparent",
              color: C.textSoft,
              border: `1px solid ${C.border}`,
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            Curar galería
          </button>
        ) : null}
      </div>

      {films.length === 0 ? (
        <div
          style={{
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.textSoft,
            padding: "12px 14px",
          }}
        >
          Aún no hay películas curadas.
        </div>
      ) : null}

      <div className="profile-grid-6" style={{ overflow: "visible" }}>
        {films.map((film, i) => (
          <motion.div
            key={film.movieId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.5 }}
            onMouseEnter={() => setHoveredId(film.movieId)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() =>
              navigate(
                mediaHref(
                  film.movieId,
                  film.title,
                  film.tmdbId,
                  (film as any).mediaType,
                ),
              )
            }
            style={{
              cursor: "pointer",
              position: "relative",
              zIndex: hoveredId === film.movieId ? 20 : 1,
            }}
          >
            <div
              style={{
                aspectRatio: "2/3",
                borderRadius: 2,
                overflow: "hidden",
                marginBottom: 10,
                border: `1px solid ${hoveredId === film.movieId ? C.accentDim : C.border}`,
                boxShadow:
                  hoveredId === film.movieId
                    ? `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${C.accentDim}`
                    : "0 4px 20px rgba(0,0,0,0.4)",
                transform:
                  hoveredId === film.movieId
                    ? "translateY(-6px) scale(1.01)"
                    : "none",
                transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                position: "relative",
              }}
            >
              <Img
                src={film.posterUrl}
                alt={film.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter:
                    hoveredId === film.movieId
                      ? "saturate(0.9) brightness(0.85)"
                      : "saturate(0.65) brightness(0.75)",
                  transform:
                    hoveredId === film.movieId ? "scale(1.06)" : "scale(1)",
                  transition: "filter 0.4s, transform 0.4s",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.2) 50%, transparent 100%)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: 10,
                  opacity: hoveredId === film.movieId ? 1 : 0,
                  transition: "opacity 0.3s",
                }}
              >
                <div
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 12,
                    color: C.text,
                    lineHeight: 1.4,
                    textAlign: "center",
                  }}
                >
                  &quot;{curatedNotesByMovieId[film.movieId] || film.title}
                  &quot;
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  color: C.accentDim,
                  fontFamily: SANS,
                  opacity: hoveredId === film.movieId ? 0 : 0.6,
                  transition: "opacity 0.2s",
                }}
              >
                0{i + 1}
              </div>
            </div>
            <div style={{ textAlign: "left", paddingLeft: 2 }}>
              <div
                style={{
                  fontSize: 11,
                  color: C.text,
                  fontFamily: SANS,
                  ...textClampOneLine,
                }}
              >
                {film.title}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: C.textMuted,
                  fontFamily: SERIF,
                  fontStyle: "italic",
                }}
              >
                {film.director}, {film.year || "—"}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function OverviewPanel({
  stats: _stats,
  recentlyWatched,
  watchlistFilms,
  reviewItems,
  vaultSocialEntries = [],
  curatedMovieIds,
  curatedNotesByMovieId,
  allDiaryFilms,
  canEditCurated,
  onCurateGallery,
  onJumpToTab,
}: {
  stats: ProfileStatsData;
  recentlyWatched: RecentlyWatchedItem[];
  watchlistFilms: WatchlistItem[];
  reviewItems: ReviewItem[];
  vaultSocialEntries?: VaultSocialEntry[];
  curatedMovieIds: number[];
  curatedNotesByMovieId: Record<number, string>;
  allDiaryFilms: RecentlyWatchedItem[];
  canEditCurated: boolean;
  onCurateGallery: () => void;
  onJumpToTab: (tab: "Vault" | "Watchlist" | "Reseñas" | "Diario") => void;
}) {
  void _stats;
  const curatedGallery = buildCuratedGallery(
    recentlyWatched,
    watchlistFilms,
    curatedMovieIds,
    allDiaryFilms,
  );
  return (
    <div>
      <CuratedGallery
        films={curatedGallery}
        curatedNotesByMovieId={curatedNotesByMovieId}
        canEdit={canEditCurated}
        onCurate={onCurateGallery}
      />
      <NightRec />

      <SectionHeader
        title="Vistas recientemente"
        link="Ver historial"
        onLinkClick={() => onJumpToTab("Diario")}
      />
      <div
        className="profile-mobile-only profile-mobile-only-flex"
        style={{ flexDirection: "column", gap: 10, marginBottom: 48 }}
      >
        {recentlyWatched.slice(0, 4).map((film, index) => (
          <FilmCardMobile key={film.id} film={film} delay={index * 0.05} />
        ))}
      </div>
      <div
        className="profile-desktop-grid profile-grid-auto"
        style={{ marginBottom: 48 }}
      >
        {recentlyWatched.map((film, index) => (
          <FilmCard key={film.id} film={film} delay={index * 0.05} />
        ))}
      </div>

      <SectionHeader
        title="Mi Vault"
        link="Ver todo"
        onLinkClick={() => onJumpToTab("Vault")}
      />
      <div
        className="profile-mobile-only profile-mobile-only-flex"
        style={{ flexDirection: "column", gap: 8, marginBottom: 48 }}
      >
        {vaultSocialEntries.slice(0, 3).map((item, index) => (
          <VaultCardMobile
            key={item.id}
            item={item}
            delay={index * 0.08}
            canManage={canEditCurated}
          />
        ))}
      </div>
      <div
        className="profile-desktop-grid profile-grid-3"
        style={{ marginBottom: 48 }}
      >
        {vaultSocialEntries.slice(0, 3).map((item, index) => (
          <VaultCard
            key={item.id}
            item={item}
            delay={index * 0.08}
            canManage={canEditCurated}
          />
        ))}
      </div>

      <SectionHeader
        title="Últimas reseñas"
        link="Ver todas"
        onLinkClick={() => onJumpToTab("Reseñas")}
      />
      <div style={{ marginBottom: 48 }}>
        <div className="profile-desktop-only">
          {reviewItems.slice(0, 3).map((review, index) => (
            <ReviewCard
              key={review.id}
              review={review}
              compact={false}
              delay={index * 0.05}
            />
          ))}
        </div>
        <div className="profile-mobile-only">
          {reviewItems.slice(0, 3).map((review, index) => (
            <ReviewCard
              key={review.id}
              review={review}
              compact={true}
              delay={index * 0.05}
            />
          ))}
        </div>
      </div>

      <SectionHeader
        title="Watchlist"
        em={`— ${watchlistFilms.length} pendientes`}
        link="Ver completa"
        onLinkClick={() => onJumpToTab("Watchlist")}
      />
      <WatchlistStrip watchlistFilms={watchlistFilms} />
    </div>
  );
}

const VAULT_FILTERS = ["Todo", "Reflexion", "Edit", "Critica", "Recomendacion"];

export function VaultPanel({
  vaultItems: initialItems = [],
  canManage = false,
}: {
  vaultItems?: VaultSocialEntry[];
  canManage?: boolean;
}) {
  const [filter, setFilter] = useState("Todo");
  const [localItems, setLocalItems] = useState(initialItems);

  useEffect(() => {
    setLocalItems(initialItems);
  }, [initialItems]);

  const filtered =
    filter === "Todo"
      ? localItems
      : localItems.filter(
          (item) => item.entry_type.toLowerCase() === filter.toLowerCase(),
        );

  const handleDeleteEntry = async (id: number) => {
    const token = getStoredAccessToken();
    if (!token) return;
    try {
      await removeVaultSocialEntry(token, id);
      setLocalItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting vault entry:", err);
    }
  };

  return (
    <div>
      <div
        className="profile-night-rec"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 28,
          padding: 0,
          border: "none",
        }}
      >
        <div
          className="profile-panel-header"
          style={{ fontFamily: SERIF, color: C.text }}
        >
          Mi Vault{" "}
          <em
            className="profile-panel-header-em"
            style={{ fontStyle: "italic", color: C.textSoft }}
          >
            — {localItems.length} publicaciones
          </em>
        </div>
        <button
          style={{
            padding: "9px 20px",
            background: C.accent,
            color: C.bg,
            border: "none",
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Upload size={11} /> Subir al Vault
        </button>
      </div>

      <div className="profile-scroll-filters">
        {VAULT_FILTERS.map((filterName) => (
          <button
            key={filterName}
            onClick={() => setFilter(filterName)}
            aria-pressed={filter === filterName}
            style={{
              padding: "6px 16px",
              background: filter === filterName ? C.accent : "transparent",
              color: filter === filterName ? C.bg : C.textSoft,
              border: `1px solid ${filter === filterName ? C.accent : C.border}`,
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            {filterName}
          </button>
        ))}
      </div>

      <div className="profile-desktop-grid profile-grid-3">
        {filtered.map((item, index) => (
          <VaultCard
            key={item.id}
            item={item}
            delay={index * 0.06}
            canManage={canManage}
            onRemove={handleDeleteEntry}
          />
        ))}
      </div>
    </div>
  );
}

export function WatchlistPanel({
  watchlistFilms: initialFilms,
  canManage = false,
}: {
  watchlistFilms: WatchlistItem[];
  canManage?: boolean;
}) {
  const navigate = useNavigate();
  const [films, setFilms] = useState(initialFilms);

  useEffect(() => {
    setFilms(initialFilms);
  }, [initialFilms]);

  const handleDelete = async (id: number) => {
    const token = getStoredAccessToken();
    if (!token) return;
    try {
      await removeFromWatchlist(token, id);
      setFilms((prev) => prev.filter((f) => f.movieId !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div
        className="profile-night-rec"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 28,
          padding: 0,
          border: "none",
        }}
      >
        <div
          className="profile-panel-header"
          style={{ fontFamily: SERIF, color: C.text }}
        >
          Watchlist{" "}
          <em
            className="profile-panel-header-em"
            style={{ fontStyle: "italic", color: C.textSoft }}
          >
            — {films.length} películas
          </em>
        </div>
        <div className="profile-panel-actions-inline">
          <button
            style={{
              padding: "7px 14px",
              background: "transparent",
              color: C.textSoft,
              border: `1px solid ${C.border}`,
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Filter size={10} /> Filtrar
          </button>
          <button
            style={{
              padding: "7px 14px",
              background: "transparent",
              color: C.textSoft,
              border: `1px solid ${C.border}`,
              fontFamily: SANS,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <SortDesc size={10} /> Ordenar
          </button>
        </div>
      </div>

      <div
        className="profile-mobile-only profile-mobile-only-flex"
        style={{ flexDirection: "column", gap: 0 }}
      >
        {films.map((film, index) => {
          return (
            <motion.div
              key={film.movieId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() =>
                navigate(
                  mediaHref(
                    film.movieId,
                    film.title,
                    film.tmdbId,
                    film.mediaType,
                  ),
                )
              }
              style={{
                cursor: "pointer",
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "10px 0",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 64,
                  flexShrink: 0,
                  borderRadius: 2,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <Img
                  src={film.posterUrl}
                  alt={film.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "saturate(0.7)",
                    transition: "filter 0.3s",
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: SERIF,
                    fontSize: 14,
                    color: C.text,
                    lineHeight: 1.3,
                    marginBottom: 2,
                    ...textClampOneLine,
                  }}
                >
                  {film.title}
                </div>
                <div
                  style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}
                >
                  {film.year || "—"} · {film.director}
                </div>
              </div>
              {canManage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(film.movieId);
                  }}
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <Trash size={12} color={C.textMuted} />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="profile-desktop-grid profile-grid-auto">
        {films.map((film, index) => {
          return (
            <motion.div
              key={film.movieId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              style={{ cursor: "pointer", position: "relative" }}
              onClick={() =>
                navigate(
                  mediaHref(
                    film.movieId,
                    film.title,
                    film.tmdbId,
                    film.mediaType,
                  ),
                )
              }
            >
              <div
                style={{
                  aspectRatio: "2/3",
                  borderRadius: 2,
                  overflow: "hidden",
                  marginBottom: 10,
                  position: "relative",
                }}
              >
                <Img
                  src={film.posterUrl}
                  alt={film.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "saturate(0.7)",
                    transition: "filter 0.3s",
                  }}
                />
                {canManage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(film.movieId);
                    }}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash size={12} color="white" />
                  </button>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.text,
                  fontFamily: SANS,
                  lineHeight: 1.3,
                  marginBottom: 2,
                  ...textClampOneLine,
                }}
              >
                {film.title}
              </div>
              <div
                style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}
              >
                {film.year || "Año desconocido"}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: C.textMuted,
                  fontStyle: "italic",
                  fontFamily: SERIF,
                }}
              >
                {film.director}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function HistoryPanel({
  recentlyWatched,
}: {
  recentlyWatched: RecentlyWatchedItem[];
}) {
  return (
    <div>
      <div className="profile-panel-actions-row">
        <div
          className="profile-panel-header"
          style={{ fontFamily: SERIF, color: C.text }}
        >
          Historial{" "}
          <em
            className="profile-panel-header-em"
            style={{ fontStyle: "italic", color: C.textSoft }}
          >
            — {recentlyWatched.length} vistas recientes
          </em>
        </div>
      </div>

      <div
        className="profile-mobile-only profile-mobile-only-flex"
        style={{ flexDirection: "column", gap: 10 }}
      >
        {recentlyWatched.map((film, index) => (
          <FilmCardMobile key={film.id} film={film} delay={index * 0.03} />
        ))}
      </div>
      <div className="profile-desktop-grid profile-grid-auto">
        {recentlyWatched.map((film, index) => (
          <FilmCard key={film.id} film={film} delay={index * 0.04} />
        ))}
      </div>
    </div>
  );
}

export function DiaryPanel({
  diaryTimeline,
}: {
  diaryTimeline: DiaryTimelineItem[];
}) {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <div
          className="profile-panel-header"
          style={{ fontFamily: SERIF, color: C.text }}
        >
          Diario cinematográfico{" "}
          <em
            className="profile-panel-header-em"
            style={{ fontStyle: "italic", color: C.textSoft }}
          >
            — autobiografía en películas
          </em>
        </div>
        <div
          style={{
            fontSize: 14,
            color: C.textMuted,
            fontFamily: SERIF,
            fontStyle: "italic",
            lineHeight: 1.6,
            marginTop: 8,
          }}
        >
          No es un historial. Es una autobiografía en películas, con el momento
          y el estado de ánimo que tenías cuando las viste.
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <div
          className="profile-diary-timeline-line"
          style={{
            position: "absolute",
            left: 148,
            top: 12,
            bottom: 40,
            width: 1,
            background: `linear-gradient(to bottom, ${C.accent}66, ${C.accentDim}33 70%, transparent)`,
          }}
        />

        {diaryTimeline.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
            className="profile-diary-row"
            style={{
              display: "grid",
              gridTemplateColumns: "148px 1fr",
              gap: 0,
              marginBottom: 36,
              position: "relative",
            }}
          >
            <div
              style={{ paddingRight: 28, textAlign: "right", paddingTop: 20 }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.textSoft,
                  fontFamily: SANS,
                  lineHeight: 1.5,
                }}
              >
                {entry.watchedDateLabel}
              </div>
            </div>

            <div
              className="profile-diary-dot"
              style={{
                position: "absolute",
                left: 141,
                top: 22,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: C.bg,
                border: `2px solid ${C.accent}`,
                zIndex: 2,
                boxShadow: `0 0 8px ${C.accentGlow}`,
              }}
            />

            <div style={{ paddingLeft: 36 }}>
              <div
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = C.accentDim)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = C.border)
                }
                onClick={() =>
                  navigate(
                    mediaHref(
                      entry.movieId,
                      entry.title,
                      entry.tmdbId || 0,
                      entry.mediaType,
                    ),
                  )
                }
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  padding: "20px 24px",
                  transition: "border-color 0.2s",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{ display: "flex", gap: 18, alignItems: "flex-start" }}
                >
                  <div
                    style={{
                      width: 54,
                      flexShrink: 0,
                      aspectRatio: "2/3",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  >
                    <Img
                      src={entry.posterUrl}
                      alt={entry.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: "saturate(0.5)",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 12,
                        marginBottom: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: SERIF,
                          fontSize: 20,
                          color: C.text,
                          lineHeight: 1.2,
                        }}
                      >
                        {entry.title}
                      </span>
                      <Stars rating={entry.rating} size={10} />
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.textSoft,
                        fontFamily: SANS,
                        marginBottom: 12,
                      }}
                    >
                      {entry.director} · {entry.year || "—"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 14,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          padding: "3px 10px",
                          border: `1px solid rgba(212,175,122,0.35)`,
                          color: C.accent,
                          fontFamily: SANS,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        {entry.moodLabel}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "3px 10px",
                          border: `1px solid ${C.border}`,
                          color: C.textSoft,
                          fontFamily: SANS,
                          letterSpacing: "0.08em",
                        }}
                      >
                        {entry.stageLabel}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontSize: 15,
                        color: C.textSoft,
                        lineHeight: 1.7,
                      }}
                    >
                      {entry.note
                        ? `"${entry.note}"`
                        : "Sin nota escrita todavía."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "148px 1fr",
            gap: 0,
            marginTop: 8,
          }}
        >
          <div />
          <div style={{ paddingLeft: 36 }}>
            <button
              style={{
                padding: "11px 24px",
                background: "transparent",
                color: C.accent,
                border: `1px solid ${C.accentDim}`,
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Pencil size={10} /> Agregar entrada al diario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReviewsPanel({
  reviewItems,
  canManageReviews = false,
}: {
  reviewItems: ReviewItem[];
  canManageReviews?: boolean;
}) {
  const [sort, setSort] = useState("Reciente");
  const [menuReviewId, setMenuReviewId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const [hiddenReviewIds, setHiddenReviewIds] = useState<Set<number>>(
    new Set(),
  );
  const [pinnedReviewIds, setPinnedReviewIds] = useState<Set<number>>(
    new Set(),
  );

  const storageKey = useMemo(() => {
    const owner = (reviewItems[0]?.username || "perfil").toLowerCase();
    return `cinevault:pinned-reviews:${owner}`;
  }, [reviewItems]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setPinnedReviewIds(new Set());
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const ids = parsed
          .map((entry) => Number(entry))
          .filter((entry) => Number.isFinite(entry));
        setPinnedReviewIds(new Set(ids));
      }
    } catch {
      setPinnedReviewIds(new Set());
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(Array.from(pinnedReviewIds)),
      );
    } catch {
      // noop
    }
  }, [pinnedReviewIds, storageKey]);

  const visibleReviews = useMemo(
    () => reviewItems.filter((entry) => !hiddenReviewIds.has(entry.id)),
    [reviewItems, hiddenReviewIds],
  );

  const sortedReviews = useMemo(() => {
    const base = [...visibleReviews];
    if (sort === "Rating") base.sort((a, b) => b.rating - a.rating);
    else if (sort === "Película")
      base.sort((a, b) => a.title.localeCompare(b.title));

    base.sort(
      (a, b) =>
        Number(pinnedReviewIds.has(b.id)) - Number(pinnedReviewIds.has(a.id)),
    );
    return base;
  }, [visibleReviews, sort, pinnedReviewIds]);

  const handleDeleteReview = async (reviewId: number) => {
    const token = getStoredAccessToken();
    if (!token) return;

    setDeletingReviewId(reviewId);
    try {
      await deleteReview(token, reviewId);
      setHiddenReviewIds((prev) => {
        const next = new Set(prev);
        next.add(reviewId);
        return next;
      });
      setPinnedReviewIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
      setMenuReviewId(null);
    } finally {
      setDeletingReviewId(null);
    }
  };

  const togglePinReview = (reviewId: number) => {
    setPinnedReviewIds((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
    setMenuReviewId(null);
  };

  return (
    <div>
      <div className="profile-panel-actions-row">
        <div
          className="profile-panel-header"
          style={{ fontFamily: SERIF, color: C.text }}
        >
          Reseñas{" "}
          <em
            className="profile-panel-header-em"
            style={{ fontStyle: "italic", color: C.textSoft }}
          >
            — {visibleReviews.length} escritas
          </em>
        </div>
        <div
          className="profile-night-rec-actions"
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          {["Reciente", "Rating", "Película"].map((sortName) => (
            <button
              key={sortName}
              onClick={() => setSort(sortName)}
              aria-pressed={sort === sortName}
              style={{
                padding: "6px 14px",
                background: sort === sortName ? C.elevated : "transparent",
                color: sort === sortName ? C.text : C.textSoft,
                border: `1px solid ${C.border}`,
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {sortName}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="profile-desktop-only">
          {sortedReviews.map((review, index) => (
            <ReviewCard
              key={review.id}
              review={review}
              delay={index * 0.07}
              compact={false}
              pinned={pinnedReviewIds.has(review.id)}
              actionsSlot={
                canManageReviews ? (
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      aria-label="Acciones de reseña"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuReviewId((prev) =>
                          prev === review.id ? null : review.id,
                        );
                      }}
                      style={{
                        border: `1px solid ${C.border}`,
                        background: C.bg,
                        color: C.textSoft,
                        width: 30,
                        height: 30,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Ellipsis size={14} />
                    </button>
                    {menuReviewId === review.id ? (
                      <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: 34,
                          right: 0,
                          minWidth: 170,
                          border: `1px solid ${C.border}`,
                          background: C.surface,
                          zIndex: 20,
                          boxShadow: "0 12px 24px rgba(0,0,0,0.35)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => togglePinReview(review.id)}
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: C.text,
                            padding: "10px 12px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            fontFamily: SANS,
                            fontSize: 11,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          {pinnedReviewIds.has(review.id) ? (
                            <PinOff size={13} />
                          ) : (
                            <Pin size={13} />
                          )}
                          {pinnedReviewIds.has(review.id)
                            ? "Quitar anclado"
                            : "Anclar reseña"}
                        </button>
                        <button
                          type="button"
                          disabled={deletingReviewId === review.id}
                          onClick={() => void handleDeleteReview(review.id)}
                          style={{
                            width: "100%",
                            border: "none",
                            borderTop: `1px solid ${C.border}`,
                            background: "transparent",
                            color: "#d99898",
                            padding: "10px 12px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor:
                              deletingReviewId === review.id
                                ? "default"
                                : "pointer",
                            fontFamily: SANS,
                            fontSize: 11,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            opacity: deletingReviewId === review.id ? 0.7 : 1,
                          }}
                        >
                          <Trash2 size={13} />
                          {deletingReviewId === review.id
                            ? "Eliminando..."
                            : "Eliminar reseña"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null
              }
            />
          ))}
        </div>
        <div className="profile-mobile-only">
          {sortedReviews.map((review, index) => (
            <ReviewCard
              key={review.id}
              review={review}
              delay={index * 0.07}
              compact={true}
              pinned={pinnedReviewIds.has(review.id)}
              actionsSlot={
                canManageReviews ? (
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      aria-label="Acciones de reseña"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuReviewId((prev) =>
                          prev === review.id ? null : review.id,
                        );
                      }}
                      style={{
                        border: `1px solid ${C.border}`,
                        background: C.bg,
                        color: C.textSoft,
                        width: 30,
                        height: 30,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Ellipsis size={14} />
                    </button>
                    {menuReviewId === review.id ? (
                      <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: 34,
                          right: 0,
                          minWidth: 170,
                          border: `1px solid ${C.border}`,
                          background: C.surface,
                          zIndex: 20,
                          boxShadow: "0 12px 24px rgba(0,0,0,0.35)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => togglePinReview(review.id)}
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: C.text,
                            padding: "10px 12px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            fontFamily: SANS,
                            fontSize: 11,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          {pinnedReviewIds.has(review.id) ? (
                            <PinOff size={13} />
                          ) : (
                            <Pin size={13} />
                          )}
                          {pinnedReviewIds.has(review.id)
                            ? "Quitar anclado"
                            : "Anclar reseña"}
                        </button>
                        <button
                          type="button"
                          disabled={deletingReviewId === review.id}
                          onClick={() => void handleDeleteReview(review.id)}
                          style={{
                            width: "100%",
                            border: "none",
                            borderTop: `1px solid ${C.border}`,
                            background: "transparent",
                            color: "#d99898",
                            padding: "10px 12px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor:
                              deletingReviewId === review.id
                                ? "default"
                                : "pointer",
                            fontFamily: SANS,
                            fontSize: 11,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            opacity: deletingReviewId === review.id ? 0.7 : 1,
                          }}
                        >
                          <Trash2 size={13} />
                          {deletingReviewId === review.id
                            ? "Eliminando..."
                            : "Eliminar reseña"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null
              }
            />
          ))}
        </div>
      </div>
      <button
        className="profile-night-rec-actions"
        style={{
          marginTop: 32,
          padding: "12px 28px",
          background: "transparent",
          color: C.accent,
          border: `1px solid ${C.accentDim}`,
          fontFamily: SANS,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <BookOpen size={12} /> Escribir nueva reseña
      </button>
    </div>
  );
}

export function ListsPanel({
  userLists,
}: {
  userLists: UserListSummaryItem[];
}) {
  const navigate = useNavigate();

  return (
    <div>
      <div
        className="profile-night-rec"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 28,
          padding: 0,
          border: "none",
        }}
      >
        <div
          className="profile-panel-header"
          style={{ fontFamily: SERIF, color: C.text }}
        >
          Listas{" "}
          <em
            className="profile-panel-header-em"
            style={{ fontStyle: "italic", color: C.textSoft }}
          >
            — {userLists.length} creadas
          </em>
        </div>
        <button
          className="profile-night-rec-actions"
          onClick={() => navigate("/lists")}
          style={{
            padding: "9px 20px",
            background: "transparent",
            color: C.accent,
            border: `1px solid ${C.accentDim}`,
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={11} /> Nueva lista
        </button>
      </div>

      {userLists.length === 0 && (
        <div
          style={{ color: C.textSoft, fontFamily: SERIF, fontStyle: "italic" }}
        >
          Todavía no tienes listas creadas.
        </div>
      )}

      <div className="profile-grid-2 profile-grid-3 profile-grid-auto">
        {userLists.map((list, index) => (
          <motion.div
            key={list.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              cursor: "pointer",
              overflow: "hidden",
              transition: "border-color 0.2s, transform 0.3s",
            }}
            whileHover={{ borderColor: C.accentDim, y: -3 }}
            onClick={() => navigate("/lists")}
          >
            <div
              style={{
                aspectRatio: "16/7",
                background:
                  "linear-gradient(135deg, rgba(212,175,122,0.18), rgba(10,10,10,0.9))",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: SANS,
                  color: C.accent,
                  letterSpacing: "0.14em",
                  fontSize: 11,
                  textTransform: "uppercase",
                }}
              >
                Lista personalizada
              </span>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: SERIF,
                    fontSize: 20,
                    fontWeight: 400,
                    color: C.text,
                    lineHeight: 1.2,
                  }}
                >
                  {list.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: C.textSoft,
                    flexShrink: 0,
                    marginLeft: 12,
                  }}
                >
                  {list.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                  <span style={{ fontSize: 10, fontFamily: SANS }}>
                    {list.itemsCount} films
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  color: C.textSoft,
                  lineHeight: 1.5,
                }}
              >
                {list.description || "Sin descripción"}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ActivityStats() {
  const monthData = [
    { month: "Oct", count: 8 },
    { month: "Nov", count: 14 },
    { month: "Dic", count: 11 },
    { month: "Ene", count: 6 },
    { month: "Feb", count: 19 },
    { month: "Mar", count: 12 },
  ];
  const max = Math.max(...monthData.map((m) => m.count));

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <BarChart2 size={13} color={C.accent} />
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.textSoft,
            fontFamily: SANS,
          }}
        >
          Actividad 2025
        </span>
      </div>
      <div
        style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60 }}
      >
        {monthData.map(({ month, count }) => (
          <div
            key={month}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: "100%",
                background: C.accent,
                opacity: 0.4 + (count / max) * 0.6,
                height: `${(count / max) * 48}px`,
                borderRadius: 1,
                transition: "all 0.3s",
              }}
            />
            <span
              style={{
                fontSize: 9,
                color: C.textMuted,
                fontFamily: SANS,
                letterSpacing: "0.1em",
              }}
            >
              {month}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: C.textSoft,
          fontFamily: SANS,
        }}
      >
        <span style={{ color: C.text }}>70</span> películas este año · mejor
        mes: <span style={{ color: C.text }}>Febrero</span>
      </div>
    </div>
  );
}

function GenreSidebar({
  recentlyWatched,
  reviewItems,
}: {
  recentlyWatched: RecentlyWatchedItem[];
  reviewItems: ReviewItem[];
}) {
  const radar = useMemo(() => {
    const total = Math.max(1, recentlyWatched.length);
    const highRated = recentlyWatched.filter((film) => film.rating >= 4).length;
    const classics = recentlyWatched.filter(
      (film) => film.year !== null && film.year < 2000,
    ).length;
    const oldCinema = recentlyWatched.filter(
      (film) => film.year !== null && film.year < 1985,
    ).length;
    const reviewWeight = Math.min(1, reviewItems.length / 10);

    const clamp = (value: number) => Math.max(0.2, Math.min(0.95, value));

    return [
      {
        label: "Autor",
        short: "Autor",
        value: clamp(0.35 + (classics / total) * 0.5),
      },
      {
        label: "Drama",
        short: "Drama",
        value: clamp(0.4 + reviewWeight * 0.45),
      },
      {
        label: "Contemplativo",
        short: "Cont.",
        value: clamp(0.3 + (highRated / total) * 0.55),
      },
      {
        label: "Noir",
        short: "Noir",
        value: clamp(0.2 + (oldCinema / total) * 0.45),
      },
      {
        label: "Sci-fi",
        short: "Sci-fi",
        value: clamp(0.25 + ((total % 5) / 5) * 0.35),
      },
      {
        label: "Riesgo",
        short: "Riesgo",
        value: clamp(0.28 + Math.min(1, total / 12) * 0.42),
      },
    ];
  }, [recentlyWatched, reviewItems]);

  const svgSize = 200;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const maxR = 68;
  const n = radar.length;

  const getCoords = (i: number, val: number) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * maxR * val,
      y: cy + Math.sin(angle) * maxR * val,
    };
  };

  const getLabelCoords = (i: number) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * (maxR + 20),
      y: cy + Math.sin(angle) * (maxR + 20),
    };
  };

  const textAnchor = (i: number): "middle" | "start" | "end" => {
    const cos = Math.cos((i / n) * 2 * Math.PI - Math.PI / 2);
    if (Math.abs(cos) < 0.15) return "middle";
    return cos > 0 ? "start" : "end";
  };

  const polygonPoints = radar
    .map((g, i) => {
      const p = getCoords(i, g.value);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: C.textSoft,
          fontFamily: SANS,
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Film size={11} color={C.accent} /> Radar competitivo
      </div>
      <div
        style={{
          fontSize: 11,
          color: C.textMuted,
          fontFamily: SERIF,
          fontStyle: "italic",
          marginBottom: 12,
        }}
      >
        Tu huella cinematográfica en esta temporada
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={{ overflow: "visible" }}
      >
        {gridLevels.map((level) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const p = getCoords(i, level);
            return `${p.x},${p.y}`;
          }).join(" ");
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke={level === 1.0 ? C.border : C.textMuted}
              strokeWidth={level === 1.0 ? 0.8 : 0.5}
              strokeDasharray={level < 1 ? "2,3" : undefined}
              opacity={level === 1.0 ? 0.6 : 0.3}
            />
          );
        })}

        {radar.map((_, i) => {
          const end = getCoords(i, 1.0);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke={C.border}
              strokeWidth="0.7"
              opacity="0.5"
            />
          );
        })}

        <polygon
          points={polygonPoints}
          fill="rgba(212,175,122,0.12)"
          stroke={C.accent}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {radar.map((g, i) => {
          const p = getCoords(i, g.value);
          return (
            <circle key={g.label} cx={p.x} cy={p.y} r="3.5" fill={C.accent}>
              <title>
                {g.label}: {Math.round(g.value * 100)}%
              </title>
            </circle>
          );
        })}

        {radar.map((g, i) => {
          const lp = getLabelCoords(i);
          return (
            <text
              key={g.label}
              x={lp.x}
              y={lp.y}
              textAnchor={textAnchor(i)}
              dominantBaseline="middle"
              style={{ fontSize: "8.5px", fill: C.textSoft, fontFamily: SANS }}
            >
              {g.short}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function AchievementsSidebar({ userBadges = [] }: { userBadges?: any[] }) {
  if (!userBadges || userBadges.length === 0) return null;

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        padding: "20px 24px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: C.textSoft,
          fontFamily: SANS,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Trophy size={12} color={C.gold} /> Logros recientes
      </div>
      {userBadges.slice(0, 5).map((ub) => {
        const badge = ub.badges;
        return (
          <div
            key={ub.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {badge.icon_url?.startsWith("http") ? (
                <img
                  src={badge.icon_url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    filter: "brightness(0.9) saturate(0.8)",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerText = "🏆";
                    }
                  }}
                />
              ) : (
                <span style={{ fontSize: 20, lineHeight: 1 }}>
                  {badge.icon_url || "🏆"}
                </span>
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: C.text,
                  fontFamily: SANS,
                  marginBottom: 2,
                }}
              >
                {badge.name}
              </div>
              <div
                style={{ fontSize: 11, color: C.textSoft, fontFamily: SANS }}
              >
                {badge.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProfileSidebar({
  recentlyWatched,
  reviewItems,
  userBadges,
}: {
  recentlyWatched: RecentlyWatchedItem[];
  reviewItems: ReviewItem[];
  userBadges?: any[];
}) {
  return (
    <aside className="profile-desktop-only">
      <div style={{ position: "sticky", top: 60 }}>
        <ActivityStats />
        <GenreSidebar
          recentlyWatched={recentlyWatched}
          reviewItems={reviewItems}
        />
        <AchievementsSidebar userBadges={userBadges} />
      </div>
    </aside>
  );
}
// TODO: npm install dompurify @types/dompurify
