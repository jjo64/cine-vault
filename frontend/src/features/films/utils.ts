import { createSlug } from "../../utils/stringUtils";
import type { Film } from "./types";

export function mapBackendToFilm(
  apiMovie: any,
  genresMap: Record<number, string>,
): Film {
  const defaultPoster =
    "https://images.unsplash.com/photo-1776197739075-e492fcd2cb46?w=500&q=80";
  const mediaType = apiMovie.media_type || "movie";

  if (mediaType === "person") {
    return {
      id: String(apiMovie.id),
      title: apiMovie.name || "Desconocido",
      originalTitle: apiMovie.name || "Desconocido",
      year: 0,
      director: apiMovie.known_for_department || "Cineasta",
      genres: [],
      country: "Internacional",
      duration: "",
      synopsis:
        apiMovie.known_for?.map((m: any) => m.title || m.name).join(", ") ||
        "Sin información.",
      rating: 0,
      img: apiMovie.profile_path
        ? `https://image.tmdb.org/t/p/w500${apiMovie.profile_path}`
        : "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=500&q=80",
      glowRgb: "80, 80, 100",
      mediaType: "person",
    };
  }

  const title = apiMovie.title || apiMovie.name || "Desconocida";
  const slug = `${apiMovie.id}-${createSlug(title)}`;

  return {
    id: String(apiMovie.id),
    title,
    originalTitle:
      apiMovie.original_title || apiMovie.original_name || "Desconocida",
    year:
      apiMovie.release_date || apiMovie.first_air_date
        ? parseInt(
            (apiMovie.release_date || apiMovie.first_air_date).split("-")[0],
          )
        : 0,
    director: apiMovie.director || "Variado",
    genres: (apiMovie.genre_ids || []).map(
      (id: number) => genresMap[id] || "Otro",
    ),
    country: "Internacional",
    duration: apiMovie.runtime ? `${apiMovie.runtime} min` : "120 min",
    synopsis: apiMovie.overview || "Sin descripción disponible.",
    rating: apiMovie.vote_average ? apiMovie.vote_average / 2 : 0,
    img: apiMovie.poster_path
      ? `https://image.tmdb.org/t/p/w500${apiMovie.poster_path}`
      : defaultPoster,
    glowRgb: "60, 60, 60",
    watched: false,
    liked: false,
    mediaType: mediaType as "movie" | "tv",
    slug,
  };
}
