import { useEffect, useState } from "react";
import { Check, Clock, Heart, Play, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { createSlug } from "../../../../../utils/stringUtils";
import { fetchTonightMovie } from "../../../../../services/socialServices";
import type { TonightResponse } from "../../../../../services/socialServices";
import { Stars, Img, SectionHeader, Badge } from "../../primitives/primitives";
import { ReviewCard } from "../ReviewCard/ReviewCard";
import type {
  RecentlyWatchedItem,
  WatchlistItem,
  ReviewItem,
  EnrichedMovie,
} from "../../../types";
import type { VaultSocialEntry } from "../../../../../services/profileServices";
import styles from "./OverviewPanel.module.css";

const mediaHref = (
  movieId: number,
  title: string,
  tmdbId: number | null,
  mediaType?: "movie" | "tv" | null,
) => {
  const type = mediaType === "tv" ? "tv" : "movie";
  return `/${type}/${tmdbId ?? movieId}-${createSlug(title)}`;
};

function buildCuratedGallery(
  recentlyWatched: RecentlyWatchedItem[],
  watchlistFilms: WatchlistItem[],
  curatedMovieIds: number[],
  allDiaryFilms: RecentlyWatchedItem[] = [],
) {
  if (curatedMovieIds.length > 0) {
    const byId = new Map<number, EnrichedMovie>();
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

// Subcomponents
function NightRec() {
  const [recommendation, setRecommendation] = useState<TonightResponse | null>(null);
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
      <div className={styles.nightRecLoading}>
        <span className={styles.loadingSpan}>
          <Clock size={14} /> Calculando sugerencia para esta noche...
        </span>
      </div>
    );
  }

  const movie = recommendation?.media;
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
      className={styles.nightRec}
    >
      <div className={styles.nightRecOverlay} />

      <div className={styles.nightRecPoster}>
        <Img
          src={
            movie?.poster_path
              ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
              : "https://images.unsplash.com/photo-1761502479994-3a5e07ec243e?w=800&q=80"
          }
          alt={movie?.title || "Recomendación"}
          className={styles.nightRecImg}
        />
      </div>

      <div className={styles.nightRecInfo}>
        <span className={styles.nightRecTag}>
          Esta noche, sin excusas
        </span>
        <div className={styles.nightRecTitle}>
          {movie?.title || "No hay sugerencias"}
        </div>
        <div className={styles.nightRecDetails}>
          {movie
            ? `${movie.year || "Año desconocido"} · ${tagLabel} · ${movie.reason}`
            : "Agrega películas o actividad para tener recomendación automática."}
        </div>
      </div>

      <div className={styles.nightRecActions}>
        <button
          onClick={() => setWatched((value) => !value)}
          aria-pressed={watched}
          aria-label={
            watched ? "Quitar de vista" : "Marcar como vista esta noche"
          }
          className={`${styles.watchedBtn} ${watched ? styles.watchedActive : ""}`}
        >
          {watched ? (
            <>
              <Check size={11} /> Vista
            </>
          ) : (
            "Marcar como vista"
          )}
        </button>
        <div className={styles.ptsText}>
          <Trophy size={11} /> +40 pts si la ves esta noche
        </div>
      </div>
    </motion.div>
  );
}

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
        navigate(mediaHref(film.movieId, film.title, film.tmdbId, film.mediaType))
      }
      role="link"
      tabIndex={0}
      className={styles.filmCardMobile}
    >
      <div className={styles.filmCardMobilePoster}>
        <Img
          src={film.posterUrl}
          alt={film.title}
          className={styles.saturateImg}
        />
      </div>
      <div className={styles.filmCardMobileMeta}>
        <div className={styles.filmCardMobileTitle}>
          {film.title}
        </div>
        <div className={styles.filmCardMobileSubtitle}>
          {film.year || "—"} • {film.director}
        </div>
        <Stars rating={film.rating} size={10} />
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
        navigate(mediaHref(film.movieId, film.title, film.tmdbId, film.mediaType))
      }
      role="link"
      tabIndex={0}
      className={styles.filmCard}
    >
      <div className={`${styles.filmCardPoster} ${hovered ? styles.filmCardPosterHovered : ""}`}>
        <Img
          src={film.posterUrl}
          alt={film.title}
          className={`${styles.filmCardImg} ${hovered ? styles.filmCardImgHovered : ""}`}
        />
        <div className={`${styles.filmCardGlow} ${hovered ? styles.opacity1 : ""}`}>
          <Stars rating={film.rating} size={11} />
        </div>
      </div>
      <div className={styles.filmCardTitle}>
        {film.title}
      </div>
      <div className={styles.filmCardYear}>
        {film.year || "Año desconocido"}
      </div>
      <div className={styles.filmCardDirector}>
        {film.director}
      </div>
    </motion.div>
  );
}

function VaultCardMobile({
  item,
  delay = 0,
}: {
  item: VaultSocialEntry;
  delay?: number;
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
      className={styles.vaultCardMobile}
    >
      <div className={styles.vaultCardMobilePoster}>
        <Img
          src={
            item.movie_info?.poster_path
              ? `https://image.tmdb.org/t/p/w200${item.movie_info.poster_path}`
              : item.cover_url || "https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=800&q=80"
          }
          alt={item.title}
          className={styles.vaultCardMobileImg}
        />
        <div className={styles.vaultCardMobileOverlay}>
          <Play size={10} fill="white" color="white" />
        </div>
      </div>
      <div className={styles.vaultCardMobileMeta}>
        <div className={styles.vaultCardMobileTitle}>
          {item.title}
        </div>
        <div className={styles.vaultCardMobileSub}>
          {item.entry_type} · {item.duration_label || "Lectura"}
        </div>
      </div>
    </motion.div>
  );
}

function VaultCard({
  item,
  delay = 0,
}: {
  item: VaultSocialEntry;
  delay?: number;
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
      className={`${styles.vaultCard} ${hovered ? styles.vaultCardHovered : ""}`}
    >
      <div className={styles.vaultCardPoster}>
        <Img
          src={
            item.movie_info?.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.movie_info.poster_path}`
              : item.cover_url || "https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=800&q=80"
          }
          alt={item.title}
          className={`${styles.vaultCardImg} ${hovered ? styles.vaultCardImgHovered : ""}`}
        />
        <div className={styles.badgePos}>
          <Badge>{item.entry_type}</Badge>
        </div>
        <div className={`${styles.playBtn} ${hovered ? styles.playBtnHovered : ""}`}>
          <Play size={12} fill="white" color="white" style={{ marginLeft: 2 }} />
        </div>
      </div>
      <div className={styles.vaultCardInfo}>
        <div className={styles.vaultCardTitle}>
          {item.title}
        </div>
        <div className={styles.vaultCardStats}>
          <span className={styles.flexCenterGap}>
            <Clock size={10} />
            {item.duration_label || "Lectura"}
          </span>
          <span className={styles.flexCenterGap}>
            <Heart size={10} style={{ fill: "currentColor", stroke: "none" }} />
            {item.likes_count} likes
          </span>
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
    <div className={styles.watchlistStrip}>
      {watchlistFilms.slice(0, 8).map((film, index) => (
        <motion.div
          key={film.movieId}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04 }}
          className={styles.watchlistStripItem}
          onClick={() =>
            navigate(mediaHref(film.movieId, film.title, film.tmdbId, film.mediaType))
          }
        >
          <div className={styles.watchlistStripPoster}>
            <Img
              src={film.posterUrl}
              alt={film.title}
              className={styles.watchlistStripImg}
            />
          </div>
          <div className={styles.watchlistStripTitle}>
            {film.title}
          </div>
          <div className={styles.watchlistStripYear}>
            {film.year || "—"}
          </div>
        </motion.div>
      ))}
      <div className={styles.watchlistStripItem}>
        <div className={styles.watchlistStripPlaceholder}>
          <span className={styles.placeholderNum}>
            +{Math.max(0, watchlistFilms.length - 8)}
          </span>
        </div>
        <div className={styles.watchlistStripYear}>
          más...
        </div>
      </div>
    </div>
  );
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
    <div className={styles.curatedGalleryWrapper}>
      <div className={styles.curatedGalleryHeader}>
        <div>
          <div className={styles.curatedGalleryTitle}>
            Galería curada{" "}
            <em className={styles.curatedGalleryEm}>
              — {films.length} películas que me definen
            </em>
          </div>
          <div className={styles.curatedGallerySubtitle}>
            No las últimas que vi. Las que elegiría si tuviera que mostrarme.
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={onCurate}
            className={styles.btnCurate}
          >
            Curar galería
          </button>
        )}
      </div>

      {films.length === 0 && (
        <div className={styles.emptyGallery}>
          Aún no hay películas curadas.
        </div>
      )}

      <div className={styles.grid6}>
        {films.map((film, i) => (
          <motion.div
            key={film.movieId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.5 }}
            onMouseEnter={() => setHoveredId(film.movieId)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() =>
              navigate(mediaHref(film.movieId, film.title, film.tmdbId, film.mediaType))
            }
            className={styles.galleryItem}
            style={{ zIndex: hoveredId === film.movieId ? 20 : 1 }}
          >
            <div
              className={`${styles.galleryPoster} ${hoveredId === film.movieId ? styles.galleryPosterHovered : ""}`}
            >
              <Img
                src={film.posterUrl}
                alt={film.title}
                className={`${styles.galleryImg} ${hoveredId === film.movieId ? styles.galleryImgHovered : ""}`}
              />
              <div className={`${styles.galleryOverlay} ${hoveredId === film.movieId ? styles.opacity1 : ""}`}>
                <div className={styles.galleryNote}>
                  &quot;{curatedNotesByMovieId[film.movieId] || film.title}&quot;
                </div>
              </div>
              <div className={`${styles.galleryIndex} ${hoveredId === film.movieId ? styles.opacity0 : ""}`}>
                0{i + 1}
              </div>
            </div>
            <div className={styles.galleryText}>
              <div className={styles.galleryMovieTitle}>
                {film.title}
              </div>
              <div className={styles.galleryMovieMeta}>
                {film.director}, {film.year || "—"}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Main Panel Component
interface OverviewPanelProps {
  stats: any;
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
}: OverviewPanelProps) {
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
      <div className={`${styles.mobileOnly} ${styles.mobileFlexGap}`}>
        {recentlyWatched.slice(0, 4).map((film, index) => (
          <FilmCardMobile key={film.id} film={film} delay={index * 0.05} />
        ))}
      </div>
      <div className={`${styles.desktopGrid} ${styles.gridAuto} ${styles.mb48}`}>
        {recentlyWatched.map((film, index) => (
          <FilmCard key={film.id} film={film} delay={index * 0.05} />
        ))}
      </div>

      <SectionHeader
        title="Mi Vault"
        link="Ver todo"
        onLinkClick={() => onJumpToTab("Vault")}
      />
      <div className={`${styles.mobileOnly} ${styles.mobileFlexGapVault}`}>
        {vaultSocialEntries.slice(0, 3).map((item, index) => (
          <VaultCardMobile
            key={item.id}
            item={item}
            delay={index * 0.08}
          />
        ))}
      </div>
      <div className={`${styles.desktopGrid} ${styles.grid3} ${styles.mb48}`}>
        {vaultSocialEntries.slice(0, 3).map((item, index) => (
          <VaultCard
            key={item.id}
            item={item}
            delay={index * 0.08}
          />
        ))}
      </div>

      <SectionHeader
        title="Últimas reseñas"
        link="Ver todas"
        onLinkClick={() => onJumpToTab("Reseñas")}
      />
      <div className={styles.mb48}>
        <div className={styles.desktopOnly}>
          {reviewItems.slice(0, 3).map((review, index) => (
            <ReviewCard
              key={review.id}
              review={review}
              compact={false}
              delay={index * 0.05}
            />
          ))}
        </div>
        <div className={styles.mobileOnly}>
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
