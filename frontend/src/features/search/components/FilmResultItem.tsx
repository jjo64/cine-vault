import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Clock, Globe, Bookmark } from "lucide-react";
import { createSlug } from "../../../utils/stringUtils";
import {
  addToWatchlist,
  removeFromWatchlist,
  addToDiary,
  removeFromDiary,
} from "../../../services/movieDetailServices";
import { getStoredAccessToken } from "../../../services/authServices";
import { Img } from "../../../components/shared/Img";
import { SkeletonPill } from "./shared/SkeletonPill";
import { useSearchStore } from "../store/useSearchStore";
import type { FilmResult } from "../types";
import styles from "./FilmResultItem.module.css";
import { C } from "../constants";

interface FilmResultItemProps {
  item: FilmResult;
  delay: number;
  isDetailsLoading: boolean;
}

export function FilmResultItem({
  item,
  delay,
  isDetailsLoading,
}: FilmResultItemProps) {
  const [diaryEntryId, setDiaryEntryId] = useState<number | null>(null);

  const vaulted = useSearchStore((state) => state.myDiary.includes(item.id));
  const bookmarked = useSearchStore((state) => state.myWatchlist.includes(item.id));

  const addToWatchlistStore = useSearchStore((state) => state.addToWatchlistStore);
  const removeFromWatchlistStore = useSearchStore((state) => state.removeFromWatchlistStore);
  const addToDiaryStore = useSearchStore((state) => state.addToDiaryStore);
  const removeFromDiaryStore = useSearchStore((state) => state.removeFromDiaryStore);

  const token = getStoredAccessToken();

  const href =
    item.mediaType === "tv"
      ? `/tv/${item.id}-${createSlug(item.title)}`
      : `/movie/${item.id}-${createSlug(item.title)}`;
  const visibleGenres = (item.genres || []).slice(0, 3);
  const runtimeLabel =
    typeof item.runtime === "number" && item.runtime > 0
      ? `${item.runtime} min`
      : null;

  return (
    <motion.div
      className={styles.cardLayout}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className={styles.hoverIndicator} />

      <Link
        to={href}
        aria-hidden="true"
        tabIndex={-1}
        className={styles.posterLink}
      >
        <div className={styles.posterContainer}>
          <Img
            src={item.img}
            alt=""
            className={styles.posterImg}
          />
        </div>
      </Link>

      <div className={styles.contentWrapper}>
        <div className={styles.titleRow}>
          <Link to={href} className={styles.titleLink}>
            <span className={styles.titleText}>{item.title}</span>
          </Link>
          <span className={styles.mediaTypeBadge}>
            {item.mediaType === "tv" ? "Serie" : "Película"}
          </span>
          {item.year ? <span className={styles.yearText}>{item.year}</span> : null}
        </div>

        {item.director ? <div className={styles.directorText}>{item.director}</div> : null}

        {item.originalTitle !== item.title && (
          <div className={styles.originalTitle}>{item.originalTitle}</div>
        )}

        <p className={styles.description}>{item.description}</p>

        <div className={styles.metaRow}>
          <div className={styles.tagsContainer}>
            {visibleGenres.map((genre) => (
              <span key={genre} className={styles.genreTag}>
                {genre}
              </span>
            ))}
            {isDetailsLoading && visibleGenres.length === 0 && (
              <>
                <span className={styles.skeletonTag}>
                  <SkeletonPill width={52} />
                </span>
                <span className={styles.skeletonTag}>
                  <SkeletonPill width={62} />
                </span>
              </>
            )}

            <span className={styles.infoLabel}>
              <Clock size={12} />{" "}
              {isDetailsLoading && !runtimeLabel ? (
                <SkeletonPill width={42} />
              ) : (
                runtimeLabel || "N/D"
              )}
            </span>
            <span className={styles.infoLabel}>
              <Globe size={12} />{" "}
              {isDetailsLoading && !item.country ? (
                <SkeletonPill width={64} />
              ) : (
                item.country || "N/D"
              )}
            </span>
          </div>

          <div className={styles.ratingContainer}>
            <span className={styles.ratingValue}>
              {item.rating ? item.rating.toFixed(1) : "—"}
            </span>
            <div className={styles.starsWrapper}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={styles.starChar}
                  style={{
                    color:
                      s <= Math.round(item.rating / 2)
                        ? C.gold
                        : "rgba(255,255,255,0.15)",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.actionsRow}>
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!token) {
                window.dispatchEvent(
                  new CustomEvent("open-auth-modal", {
                    detail: { mode: "login" },
                  }),
                );
                return;
              }
              try {
                if (vaulted) {
                  if (diaryEntryId) {
                    await removeFromDiary(token, diaryEntryId);
                    removeFromDiaryStore(item.id);
                    setDiaryEntryId(null);
                  }
                } else {
                  const res = await addToDiary(
                    token,
                    item.id,
                    undefined,
                    item.mediaType,
                  );
                  addToDiaryStore(item.id);
                  if (res && typeof res === "object" && "id" in res) {
                    setDiaryEntryId((res as { id: number }).id);
                  }
                }
              } catch (err) {
                console.error("Vault toggle error:", err);
              }
            }}
            aria-label={vaulted ? "Quitar de la bóveda" : "Añadir a la bóveda"}
            className={`${styles.vaultBtn} ${vaulted ? styles.active : ""}`}
          >
            {vaulted ? "✓ En Vault" : "+ Vault"}
          </button>
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!token) {
                window.dispatchEvent(
                  new CustomEvent("open-auth-modal", {
                    detail: { mode: "login" },
                  }),
                );
                return;
              }
              try {
                if (bookmarked) {
                  await removeFromWatchlist(token, item.id);
                  removeFromWatchlistStore(item.id);
                } else {
                  await addToWatchlist(token, item.id, item.mediaType);
                  addToWatchlistStore(item.id);
                }
              } catch (err) {
                console.error("Watchlist toggle error:", err);
              }
            }}
            aria-label={
              bookmarked
                ? "Quitar de la lista de seguimiento"
                : "Añadir de la lista de seguimiento"
            }
            className={`${styles.watchlistBtn} ${bookmarked ? styles.active : ""}`}
          >
            <Bookmark size={11} fill={bookmarked ? C.accent : "none"} />{" "}
            {bookmarked ? "En watchlist" : "Watchlist"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
export default FilmResultItem;
