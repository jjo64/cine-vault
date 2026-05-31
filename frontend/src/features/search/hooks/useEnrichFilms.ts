import { useEffect, useRef } from "react";
import { fetchMovieDetail } from "../../../services/movieDetailServices";
import { useSearchStore } from "../store/useSearchStore";
import { getDirectorFromDetail, normalizeCountryName } from "../utils";
import type { FilmDetails, FilmResult } from "../types";

export function useEnrichFilms(visibleFilms: FilmResult[] = []) {
  const setEnrichedFilms = useSearchStore((state) => state.setEnrichedFilms);
  const setLoadingFilmDetails = useSearchStore(
    (state) => state.setLoadingFilmDetails,
  );

  const detailsCacheRef = useRef<Map<number, FilmDetails>>(new Map());
  const inflightDetailsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const movieIdsToEnrich = visibleFilms
      .filter((film) => film.mediaType === "movie")
      .map((film) => film.id);
    if (movieIdsToEnrich.length === 0) return;

    let active = true;

    movieIdsToEnrich.forEach((movieId) => {
      if (detailsCacheRef.current.has(movieId)) return;
      if (inflightDetailsRef.current.has(movieId)) return;

      inflightDetailsRef.current.add(movieId);

      setLoadingFilmDetails((prev) => ({ ...prev, [movieId]: true }));

      fetchMovieDetail(String(movieId))
        .then((detail) => {
          if (!active) return;
          const details: FilmDetails = {
            director: getDirectorFromDetail(detail.credits?.crew),
            runtime: detail.runtime ?? null,
            genres: Array.isArray(detail.genres)
              ? detail.genres.map((genre) => genre.name).filter(Boolean)
              : [],
            country: normalizeCountryName(
              detail.production_countries?.[0]?.name || null,
            ),
          };
          detailsCacheRef.current.set(movieId, details);
          setEnrichedFilms((prev) => ({ ...prev, [movieId]: details }));
        })
        .catch(() => {
          if (!active) return;
        })
        .finally(() => {
          inflightDetailsRef.current.delete(movieId);
          if (!active) return;
          setLoadingFilmDetails((prev) => {
            const next = { ...prev };
            delete next[movieId];
            return next;
          });
        });
    });

    return () => {
      active = false;
    };
  }, [visibleFilms, setEnrichedFilms, setLoadingFilmDetails]);
}
export default useEnrichFilms;
