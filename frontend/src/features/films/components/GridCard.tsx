import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Bookmark, Eye, Star } from "lucide-react";
import type { Film } from "../types";
import { Img } from "../../../components/shared/Img";
import styles from "./GridCard.module.css";

interface GridCardProps {
  film: Film;
  index: number;
  onLog: (film: Film) => void;
}

export const GridCard: React.FC<GridCardProps> = ({ film, index, onLog }) => {
  const linkPath =
    film.mediaType === "tv"
      ? `/tv/${film.slug || film.id}`
      : film.mediaType === "person"
        ? `/person/${film.slug || film.id}`
        : `/movie/${film.slug || film.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5) }}
      className={styles.card}
    >
      <div className={styles.posterContainer}>
        <Link to={linkPath} style={{ textDecoration: "none" }}>
          <Img src={film.img} alt={film.title} className={styles.image} />

          <div className={styles.ratingPill}>
            <Star size={8} fill="#D4AF7A" color="#D4AF7A" />
            <span className={styles.ratingValue}>{film.rating.toFixed(1)}</span>
          </div>

          <div className={styles.overlay}>
            <div className={styles.actions} onClick={(e) => e.preventDefault()}>
              <button className={styles.actionBtn}>
                <Heart size={16} fill={film.liked ? "currentColor" : "none"} />
              </button>
              <button className={styles.actionBtn}>
                <Bookmark size={16} />
              </button>
              <button className={styles.actionBtn}>
                <Eye size={16} />
              </button>
            </div>
            <button
              className={styles.logBtn}
              onClick={(e) => {
                e.preventDefault();
                onLog(film);
              }}
            >
              LOG OR REVIEW
            </button>
          </div>
        </Link>
      </div>

      <div className={styles.info}>
        <Link to={linkPath} style={{ textDecoration: "none" }}>
          <h3 className={styles.title}>{film.title}</h3>
          <p className={styles.director}>
            {film.director} {film.year > 0 && `· ${film.year}`}
          </p>
        </Link>
      </div>
    </motion.div>
  );
};
