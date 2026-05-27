import { useEffect } from "react";
import { searchMovies, searchUsers } from "../../../services/searchServices";
import {
  fetchMyWatchlist,
  fetchMyDiary,
} from "../../../services/movieDetailServices";
import { getStoredAccessToken } from "../../../services/authServices";
import { useSearchStore } from "../store/useSearchStore";
import {
  toFilmResult,
  toPersonResult,
  toUserResult,
  toPoster,
} from "../utils";
import type { PersonResult } from "../types";

export function useSearchData(query: string) {
  const page = useSearchStore((state) => state.page);
  const filmResults = useSearchStore((state) => state.filmResults);
  const setFilmResults = useSearchStore((state) => state.setFilmResults);
  const setPersonResults = useSearchStore((state) => state.setPersonResults);
  const setUserResults = useSearchStore((state) => state.setUserResults);
  const setIsSearching = useSearchStore((state) => state.setIsSearching);
  const setFetchError = useSearchStore((state) => state.setFetchError);
  const setMyWatchlist = useSearchStore((state) => state.setMyWatchlist);
  const setMyDiary = useSearchStore((state) => state.setMyDiary);

  // 1. Cargar Watchlist y Diario del usuario logueado (solo al montar)
  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) return;

    fetchMyWatchlist(token)
      .then((list) => setMyWatchlist(list.map((i) => i.movie_id)))
      .catch(() => {});
    fetchMyDiary(token)
      .then((res) => setMyDiary((res.diary || []).map((i) => i.movie_id)))
      .catch(() => {});
  }, [setMyWatchlist, setMyDiary]);

  // 2. Buscar películas, personas y usuarios al cambiar query o página
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setFilmResults([]);
      setPersonResults([]);
      setUserResults([]);
      return;
    }

    let active = true;
    setIsSearching(true);
    setFetchError(null);

    Promise.all([searchMovies(q, page), searchUsers(q, 16)])
      .then(([data, users]) => {
        if (!active) return;

        const rawResults = Array.isArray(data.results) ? data.results : [];
        const moviesAndTv = rawResults
          .filter((item) => item.media_type !== "person")
          .map(toFilmResult);

        const peopleFromPanel = Array.isArray(data.people_results)
          ? data.people_results.map(toPersonResult)
          : [];
        const peopleFromResults = rawResults
          .filter((item) => item.media_type === "person" && item.name)
          .slice(0, 8)
          .map((item) => ({
            id: item.id,
            name: item.name as string,
            role: item.known_for_department || "Persona",
            notable: [],
            img: toPoster(item.profile_path),
          }));

        const uniquePeople = new Map<number, PersonResult>();
        [...peopleFromPanel, ...peopleFromResults].forEach((person) => {
          uniquePeople.set(person.id, person);
        });

        setFilmResults(moviesAndTv);
        setPersonResults(Array.from(uniquePeople.values()));
        setUserResults(users.map(toUserResult));
      })
      .catch(() => {
        if (!active) return;
        setFetchError("No se pudieron cargar resultados. Intenta nuevamente.");
        setFilmResults([]);
        setPersonResults([]);
        setUserResults([]);
      })
      .finally(() => {
        if (active) setIsSearching(false);
      });

    return () => {
      active = false;
    };
  }, [query, page, setFilmResults, setPersonResults, setUserResults, setIsSearching, setFetchError]);

  return { filmResults };
}
