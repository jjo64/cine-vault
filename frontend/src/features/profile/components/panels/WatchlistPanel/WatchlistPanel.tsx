import { useEffect, useState } from "react";
import { Filter, SortDesc, Trash } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { createSlug } from "../../../../../utils/stringUtils";
import { Img } from "../../primitives/primitives";
import { getStoredAccessToken } from "../../../../../services/authServices";
import { removeFromWatchlist } from "../../../../../services/movieDetailServices";
import type { WatchlistItem } from "../../../types";
import styles from "./WatchlistPanel.module.css";

const mediaHref = (
  movieId: number,
  title: string,
  tmdbId: number | null,
  mediaType?: "movie" | "tv" | null,
) => {
  const type = mediaType === "tv" ? "tv" : "movie";
  return `/${type}/${tmdbId ?? movieId}-${createSlug(title)}`;
};

interface WatchlistPanelProps {
  watchlistFilms: WatchlistItem[];
  canManage: boolean;
}

export function WatchlistPanel({
  watchlistFilms: initialFilms,
  canManage = false,
}: WatchlistPanelProps) {
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
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.panelHeader}>
          Watchlist{" "}
          <em className={styles.panelHeaderEm}>
            — {films.length} películas
          </em>
        </div>
        <div className={styles.actionsInline}>
          <button className={styles.actionBtn}>
            <Filter size={10} /> Filtrar
          </button>
          <button className={styles.actionBtn}>
            <SortDesc size={10} /> Ordenar
          </button>
        </div>
      </div>

      {/* Mobile View */}
      <div className={styles.mobileOnlyFlex}>
        {films.map((film, index) => (
          <motion.div
            key={film.movieId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() =>
              navigate(mediaHref(film.movieId, film.title, film.tmdbId, film.mediaType))
            }
            className={styles.mobileRow}
          >
            <div className={styles.mobilePoster}>
              <Img
                src={film.posterUrl}
                alt={film.title}
                className={styles.posterImg}
              />
            </div>
            <div className={styles.mobileMeta}>
              <div className={styles.mobileTitle}>
                {film.title}
              </div>
              <div className={styles.mobileSubtitle}>
                {film.year || "—"} · {film.director}
              </div>
            </div>
            {canManage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(film.movieId);
                }}
                className={styles.mobileDeleteBtn}
                aria-label="Quitar de la watchlist"
              >
                <Trash size={12} />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Desktop View */}
      <div className={styles.desktopGrid}>
        {films.map((film, index) => (
          <motion.div
            key={film.movieId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={styles.movieCard}
            onClick={() =>
              navigate(mediaHref(film.movieId, film.title, film.tmdbId, film.mediaType))
            }
          >
            <div className={styles.posterWrapper}>
              <Img
                src={film.posterUrl}
                alt={film.title}
                className={styles.posterImg}
              />
              {canManage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(film.movieId);
                  }}
                  className={styles.desktopDeleteBtn}
                  aria-label="Quitar de la watchlist"
                >
                  <Trash size={12} color="white" />
                </button>
              )}
            </div>
            <div className={styles.movieTitle}>
              {film.title}
            </div>
            <div className={styles.movieYear}>
              {film.year || "Año desconocido"}
            </div>
            <div className={styles.movieDirector}>
              {film.director}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
