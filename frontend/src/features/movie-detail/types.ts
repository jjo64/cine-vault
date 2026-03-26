import { ReviewMode } from '../../../services/movieDetailServices';

export type AppReview = {
  id: number;
  userId: number;
  movieId: number;
  tmdbId: number | null;
  mode: ReviewMode;
  username: string;
  avatarUrl?: string | null;
  content: string;
  rating: number;
  veredicto?: string | null;
  dimensions: {
    direccion: number | null;
    guion: number | null;
    fotografia: number | null;
    actuaciones: number | null;
    bandaSonora: number | null;
  };
  quote?: {
    dialogo: string;
    personaje?: string | null;
  } | null;
  timestamps: Array<{ minuto: string; descripcion: string }>;
  contieneSpoilers: boolean;
  esCriticaLarga: boolean;
  tiempoLecturaMin: number | null;
  likes: number;
  createdAt: string;
  comments: Array<{
    id: number;
    userId: number;
    username: string;
    avatarUrl: string | null;
    content: string;
    createdAt: string;
  }>;
};

export type SimilarFilm = {
  id: number;
  title: string;
  year: number;
  img: string;
};

export type PlatformEntry = {
  name: string;
  type: string;
  url: string;
};

export type Viewer = {
  id: number;
  username: string;
  avatar_url?: string | null;
  membership?: string | null;
  role?: string | null;
};

export type SearchSuggestion = {
  id: number;
  title?: string;
  name?: string;
  media_type?: 'movie' | 'tv' | 'person';
  poster_path?: string | null;
  profile_path?: string | null;
};
