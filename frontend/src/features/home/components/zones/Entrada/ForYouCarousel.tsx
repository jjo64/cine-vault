import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { C, SERIF, SANS } from "../../../constants";
import { movieHref, toPoster } from "../../../utils";
import { SectionLabel } from "../../shared/SectionLabel";
import { SafeImg } from "../../shared/SafeImg";

interface ForYouCarouselProps {
  forYouMovies: any[];
  lastMovieTitle?: string;
}

export const ForYouCarousel: React.FC<ForYouCarouselProps> = ({
  forYouMovies,
  lastMovieTitle,
}) => {
  if (forYouMovies.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      style={{ marginBottom: 56 }}
    >
      <SectionLabel link="Ver todo" linkHref="/for-you">
        Porque viste{" "}
        <em style={{ fontStyle: "italic", color: C.accent, marginLeft: 4 }}>
          {lastMovieTitle || "tu ultima pelicula"}
        </em>
      </SectionLabel>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 8,
          scrollbarWidth: "none",
        }}
      >
        {forYouMovies.map((film) => (
          <Link
            key={film.id}
            to={movieHref(film.id, film.tmdb_id, film.title)}
            style={{ textDecoration: "none", flexShrink: 0, width: 130 }}
          >
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ duration: 0.25 }}
            >
              <div
                style={{
                  aspectRatio: "2/3",
                  borderRadius: 1,
                  overflow: "hidden",
                  marginBottom: 10,
                  border: `1px solid ${C.border}`,
                }}
              >
                <SafeImg
                  src={toPoster(film.poster_path)}
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
                  fontFamily: SANS,
                  fontSize: 12,
                  color: C.text,
                  lineHeight: 1.3,
                  marginBottom: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                }}
              >
                {film.title}
              </div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 12,
                  color: C.textSoft,
                  textAlign: "left",
                  marginTop: 1,
                }}
              >
                {film.director || "TMDB"}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};
