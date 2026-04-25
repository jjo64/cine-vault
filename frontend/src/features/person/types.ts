export type PersonDetail = {
  id: number;
  name: string;
  biography?: string;
  profile_path?: string | null;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  known_for_department?: string | null;
  popularity?: number;
};

export type CreditItem = {
  id: number;
  media_type?: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path?: string | null;
  character?: string;
  job?: string;
  department?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
  order?: number;
};

export type CombinedCredits = {
  cast?: CreditItem[];
  crew?: CreditItem[];
};

export type RoleTab = "crew" | "actor";
export type CrewTab = "director" | "writer" | "producer";

export type PersonStats = {
  fans: number;
  watchlists: number;
  avgRating: number;
  totalFilms: number;
};
