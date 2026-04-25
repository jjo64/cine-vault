import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
}

interface MovieSectionProps {
  title: string;
  endpoint: string;
}

import { createSlug } from "../utils/stringUtils";

const MovieSection: React.FC<MovieSectionProps> = ({ title, endpoint }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`);
        if (!res.ok) {
          setMovies([]);
          return;
        }
        const data = await res.json();
        setMovies(Array.isArray(data?.results) ? data.results : []);
      } catch (error) {
        setMovies([]);
        console.error(`Error fetching ${title}:`, error);
      }
    };
    fetchMovies();
  }, [endpoint, title]);

  return (
    <section
      className="movie-section"
      style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}
    >
      <h2
        className="section-title"
        style={{
          fontSize: "16px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          marginBottom: "20px",
          color: "rgba(255,255,255,0.9)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "10px",
        }}
      >
        {title}
      </h2>

      <div
        className="movie-row"
        ref={containerRef}
        style={{
          display: "flex",
          gap: "15px",
          overflowX: "auto",
          paddingBottom: "20px",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE 10+
        }}
      >
        {movies.slice(0, 10).map((movie) => (
          <Link
            key={movie.id}
            to={`/movie/${movie.id}-${createSlug(movie.title)}`}
            className="movie-card"
            style={{
              flex: "0 0 auto",
              textDecoration: "none",
              position: "relative",
              transition: "transform 0.2s",
            }}
          >
            <div
              style={{
                position: "relative",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <img
                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                alt={movie.title}
                loading="lazy"
                width={140}
                height={210}
                style={{
                  width: "140px",
                  height: "210px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <div
                className="hover-overlay"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  opacity: 0,
                  transition: "opacity 0.2s",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: "10px",
                }}
              >
                <span
                  style={{
                    color: "#00e054",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  ★ {movie.vote_average.toFixed(1)}
                </span>
              </div>
            </div>
            <style>{`
                            .movie-card:hover .hover-overlay { opacity: 1; }
                            .movie-card:hover { transform: translateY(-5px); }
                            .movie-row::-webkit-scrollbar { display: none; }
                        `}</style>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default MovieSection;
