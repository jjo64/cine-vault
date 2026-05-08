import { useState, useEffect } from "react";
import type { Film } from "../types";
import { mapBackendToFilm } from "../utils";
import {
  fetchPopularMovies,
  fetchUpcomingMovies,
  fetchTopRatedMovies,
} from "../../../services/movieDetailServices";
import {
  fetchMovieGenres,
  searchMovie,
  searchMulti,
} from "../../../services/searchServices";

export function useFilmsData(query: string) {
  const [films, setFilms] = useState<Film[]>([]);
  const [upcoming, setUpcoming] = useState<Film[]>([]);
  const [topRated, setTopRated] = useState<Film[]>([]);
  const [cult, setCult] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Search logic with debouncing
  useEffect(() => {
    let active = true;
    if (query.trim()) setIsTyping(true);
    else setIsTyping(false);

    const searchTimeout = setTimeout(async () => {
      try {
        const genreList = await fetchMovieGenres();
        const map: Record<number, string> = {};
        genreList.forEach((g) => (map[g.id] = g.name));

        if (query.trim()) {
          setIsLoading(true);
          setIsTyping(false);

          const matchedGenre = genreList.find(
            (g) => g.name.toLowerCase() === query.toLowerCase(),
          );

          let res;
          if (matchedGenre) {
            res = await searchMovie(query, 1, [matchedGenre.id]);
          } else {
            res = await searchMulti(query);
          }

          if (active) {
            setFilms((res.results || []).map((m) => mapBackendToFilm(m, map)));
            setIsLoading(false);
          }
        } else {
          setIsLoading(true);
          const popRes = await fetchPopularMovies();
          if (active) {
            const mappedPop = (popRes.results || []).map((m) =>
              mapBackendToFilm(m, map),
            );
            setFilms(mappedPop);
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.error(e);
        setIsLoading(false);
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(searchTimeout);
    };
  }, [query]);

  // Initial categories loading
  useEffect(() => {
    async function loadCategories() {
      try {
        const genreList = await fetchMovieGenres();
        const map: Record<number, string> = {};
        genreList.forEach((g) => (map[g.id] = g.name));

        const [upRes, topRes, cultRes] = await Promise.all([
          fetchUpcomingMovies(),
          fetchTopRatedMovies(),
          searchMovie("cult classics", 1),
        ]);

        setUpcoming((upRes.results || []).map((m) => mapBackendToFilm(m, map)));
        setTopRated(
          (topRes.results || []).map((m) => mapBackendToFilm(m, map)),
        );
        setCult(
          (cultRes.results || [])
            .slice(0, 10)
            .map((m) => mapBackendToFilm(m, map)),
        );
      } catch (e) {
        console.error("Error loading categories:", e);
      }
    }
    loadCategories();
  }, []);

  return { films, upcoming, topRated, cult, isLoading, isTyping };
}
