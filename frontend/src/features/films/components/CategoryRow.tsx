import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Star } from "lucide-react";
import type { Film } from "../types";
import { Img } from "../../../components/shared/Img";
import styles from "./CategoryRow.module.css";

interface CategoryRowProps {
  title: string;
  subtitle: string;
  films: Film[];
  showRank?: boolean;
  badge?: React.ReactNode;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  title,
  subtitle,
  films,
  showRank = false,
  badge,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const drag = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    const startX = e.pageX - el.offsetLeft;
    const scrollLeft = el.scrollLeft;

    const move = (e: MouseEvent) => {
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft - (x - startX);
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      el.style.cursor = "grab";
    };

    el.style.cursor = "grabbing";
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className={styles.section}
    >
      <div className={styles.header}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 className={styles.title}>{title}</h3>
            {badge}
          </div>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <button className={styles.viewAll}>
          Ver todo <ChevronRight size={10} />
        </button>
      </div>

      <div className={styles.scrollContainer} ref={scrollRef} onMouseDown={drag}>
        {films.map((film, i) => (
          <motion.div
            key={film.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className={styles.card}
          >
            <div
              className={styles.glow}
              style={{
                background: `radial-gradient(ellipse at 50% 100%, rgba(${film.glowRgb}, 0.2) 0%, transparent 70%)`,
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
              style={{ textDecoration: "none", display: "block", position: "relative", zIndex: 1 }}
            >
              <div className={styles.posterWrapper}>
                <Img src={film.img} alt={film.title} className={styles.image} />

                {showRank && (
                  <div className={styles.rankOverlay}>
                    <span className={`${styles.rankNumber} ${i < 3 ? styles.rankTop : ""}`}>
                      {i + 1}
                    </span>
                  </div>
                )}

                <div className={styles.ratingPill}>
                  <Star size={8} fill="#C8A96E" color="#C8A96E" />
                  <span style={{ fontSize: 8, color: "var(--color-text-soft)" }}>
                    {film.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              
              <div className={styles.filmTitle}>{film.title}</div>
              <div className={styles.filmDirector}>{film.director}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
