import React from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Film } from "../types";
import { Img } from "../../../components/shared/Img";
import styles from "./ListRow.module.css";

interface ListRowProps {
  film: Film;
  index: number;
  onLog: (film: Film) => void;
}

export const ListRow: React.FC<ListRowProps> = ({ film }) => {
  const linkPath =
    film.mediaType === "tv"
      ? `/tv/${film.slug || film.id}`
      : film.mediaType === "person"
        ? `/person/${film.slug || film.id}`
        : `/movie/${film.slug || film.id}`;

  return (
    <Link to={linkPath} className={styles.row}>
      <Img src={film.img} alt={film.title} className={styles.poster} />
      
      <div>
        <h4 className={styles.title}>{film.title}</h4>
        <p className={styles.meta}>
          {film.director} {film.year > 0 && `· ${film.year}`} · {film.genres.join(", ")}
        </p>
      </div>

      <div className={styles.rating}>
        <Star size={12} fill="#D4AF7A" color="#D4AF7A" />
        <span className={styles.ratingValue}>{film.rating.toFixed(1)}</span>
      </div>
    </Link>
  );
};
