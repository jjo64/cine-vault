export type Film = {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  director: string;
  genres: string[];
  country: string;
  duration: string;
  synopsis: string;
  rating: number; // community avg (1–5)
  myRating?: number;
  img: string;
  glowRgb: string; // dominant colour approximation
  watched?: boolean;
  liked?: boolean;
  mediaType?: "movie" | "tv" | "person";
  slug?: string;
};

export type SortId = "rating" | "recent" | "discussed" | "alpha";

export type Filters = {
  genres: string[];
  yearRange: string | null;
  country: string | null;
  sortBy: SortId;
};

export type YearRange = {
  label: string;
  from: number;
  to: number;
};
