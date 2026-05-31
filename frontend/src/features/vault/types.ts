import type {
  ProfileUser,
  ReviewEntry,
  RichDiaryEntry,
  VaultSocialEntry,
} from "../../services/profileServices";

export type EntryType = "image" | "video" | "audio" | "moodboard" | "list" | "review";
export type MembershipTier = "VIP" | "PRO";

export interface VaultEntry {
  id: number;
  originalId?: number;
  mediaType?: "movie" | "tv";
  tmdbId?: number | null;
  movieSlug?: string;
  type: EntryType;
  title: string;
  film?: string;
  likes: number;
  comments: number;
  img?: string;
  imgs?: string[];
  text?: string;
  duration?: string;
  posters?: string[];
  posterCount?: number;
}

export interface VaultUser {
  username: string;
  name: string;
  avatar: string;
  tier: MembershipTier;
  entries: number;
  bio: string;
}

export type FilterType =
  | "TODO"
  | "VIDEOS"
  | "IMÁGENES"
  | "AUDIOS"
  | "MOOD BOARDS"
  | "LISTAS"
  | "RESEÑAS";

export interface VaultStore {
  user: VaultUser;
  entries: VaultEntry[];
  isOwner: boolean;
  loading: boolean;
  loadError: string | null;
  activeFilter: FilterType;

  setLoading: (loading: boolean) => void;
  setLoadError: (error: string | null) => void;
  setOwner: (owner: boolean) => void;
  setVaultData: (user: VaultUser, entries: VaultEntry[]) => void;
  setActiveFilter: (filter: FilterType) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  resetStore: () => void;
}

export type { ProfileUser, ReviewEntry, RichDiaryEntry, VaultSocialEntry };
