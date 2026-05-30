import type {
  SearchMovieResult,
  SearchPersonPanel,
  SearchUserResult,
} from "../../services/searchServices";
import type { UserResult, FilmResult, PersonResult } from "./types";
import { TMDB_IMG } from "./constants";

export function toUserResult(item: SearchUserResult): UserResult {
  const username = item.username || "usuario";
  return {
    id: item.id,
    username,
    handle: `@${username}`,
    films: Number(item._count?.reviews || 0),
    bio: item.bio?.trim() || "Cinéfilo de CineVault",
    avatar: username.slice(0, 1).toUpperCase(),
  };
}

export function toPoster(path?: string | null) {
  return path
    ? `${TMDB_IMG}${path}`
    : "https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=400&q=80";
}

export function toFilmResult(item: SearchMovieResult): FilmResult {
  const rawDate = item.release_date || item.first_air_date || "";
  const year = Number.parseInt(rawDate.slice(0, 4), 10);
  const title = item.title || item.name || "Sin título";
  const mediaType = item.media_type === "tv" ? "tv" : "movie";

  return {
    id: item.id,
    mediaType,
    title,
    originalTitle: item.original_title || item.original_name || title,
    year: Number.isNaN(year) ? null : year,
    director: item.director?.trim() || null,
    description: item.overview || "Sin sinopsis disponible.",
    rating: Math.max(
      0,
      Number(
        (item as SearchMovieResult & { vote_average?: number }).vote_average ||
          0,
      ),
    ),
    img: toPoster(item.poster_path),
    runtime: item.runtime ?? null,
    genres: Array.isArray(item.genres)
      ? item.genres.map((genre) => genre.name).filter(Boolean)
      : [],
    country:
      Array.isArray(item.production_countries) &&
      item.production_countries[0]?.name
        ? item.production_countries[0].name
        : null,
  };
}

export function toPersonResult(item: SearchPersonPanel): PersonResult {
  return {
    id: item.id,
    name: item.name,
    role: item.known_for_department || "Persona",
    notable: (item.known_for || [])
      .slice(0, 3)
      .map((entry) => entry.title || entry.name || "Sin título"),
    img: toPoster(item.profile_path),
  };
}

export function normalizeCountryName(raw?: string | null) {
  if (!raw) return null;
  if (raw === "United States of America") return "EE.UU.";
  if (raw === "United Kingdom") return "Reino Unido";
  if (raw === "Soviet Union") return "URSS";
  if (raw === "Russian Federation") return "Rusia";
  return raw;
}

export function getDirectorFromDetail(
  crew?: Array<{
    id: number;
    name: string;
    job?: string;
    profile_path?: string | null;
  }>,
) {
  if (!Array.isArray(crew)) return null;
  const director = crew.find(
    (person) => (person.job || "").toLowerCase() === "director",
  );
  return director?.name || null;
}
