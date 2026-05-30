import { Pencil } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { createSlug } from "../../../../../utils/stringUtils";
import { Stars, Img } from "../../primitives/primitives";
import type { DiaryTimelineItem } from "../../../types";
import styles from "./DiaryPanel.module.css";

const mediaHref = (
  movieId: number,
  title: string,
  tmdbId: number | null,
  mediaType?: "movie" | "tv" | null,
) => {
  const type = mediaType === "tv" ? "tv" : "movie";
  return `/${type}/${tmdbId ?? movieId}-${createSlug(title)}`;
};

interface DiaryPanelProps {
  diaryTimeline: DiaryTimelineItem[];
}

export function DiaryPanel({ diaryTimeline }: DiaryPanelProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          Diario cinematográfico{" "}
          <em className={styles.subtitle}>
            — autobiografía en películas
          </em>
        </div>
        <div className={styles.introText}>
          No es un historial. Es una autobiografía en películas, con el momento
          y el estado de ánimo que tenías cuando las viste.
        </div>
      </div>

      <div className={styles.timelineWrapper}>
        <div className={styles.timelineLine} />

        {diaryTimeline.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
            className={styles.diaryRow}
          >
            <div className={styles.dateCol}>
              <div className={styles.dateLabel}>
                {entry.watchedDateLabel}
              </div>
            </div>

            <div className={styles.diaryDot} />

            <div className={styles.contentCol}>
              <div
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
                className={styles.card}
              >
                <div className={styles.cardFlex}>
                  <div className={styles.posterWrapper}>
                    <Img
                      src={entry.posterUrl}
                      alt={entry.title}
                      className={styles.posterImg}
                    />
                  </div>
                  <div className={styles.infoWrapper}>
                    <div className={styles.titleRow}>
                      <span className={styles.movieTitle}>
                        {entry.title}
                      </span>
                      <Stars rating={entry.rating} size={10} />
                    </div>
                    <div className={styles.movieMeta}>
                      {entry.director} · {entry.year || "—"}
                    </div>
                    <div className={styles.badgesRow}>
                      <span className={styles.moodBadge}>
                        {entry.moodLabel}
                      </span>
                      <span className={styles.stageBadge}>
                        {entry.stageLabel}
                      </span>
                    </div>
                    <div className={styles.noteText}>
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

        <div className={styles.addBtnRow}>
          <div />
          <div className={styles.addBtnCol}>
            <button className={styles.btnAddEntry}>
              <Pencil size={10} /> Agregar entrada al diario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
