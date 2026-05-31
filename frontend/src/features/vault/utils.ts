import type {
  VaultEntry,
  VaultUser,
  ProfileUser,
  ReviewEntry,
  RichDiaryEntry,
  VaultSocialEntry,
} from "./types";
import { TMDB_IMG, I, VAULT_USER } from "./constants";
import { createSlug } from "../../utils/stringUtils";

export function toTmdbImage(path?: string | null): string {
  return path ? `${TMDB_IMG}${path}` : I.fog;
}

export function fromReviewsToVault(reviews: ReviewEntry[]): VaultEntry[] {
  return reviews.slice(0, 8).map((review) => ({
    id: 1000 + review.id,
    originalId: review.id,
    type: "review" as const,
    title: `Reseña #${review.id}`,
    film: review.movies_ref?.tmdb_id
      ? `TMDB ${review.movies_ref.tmdb_id}`
      : undefined,
    likes: review.likes ?? 0,
    comments: 0,
    img: I.grain,
    text: review.content || "Sin extracto disponible.",
    duration: undefined,
    posters: undefined,
    posterCount: undefined,
    imgs: undefined,
  }));
}

export function fromDiaryToVault(diary: RichDiaryEntry[]): VaultEntry[] {
  const entries: VaultEntry[] = [];
  const visuals = diary.slice(0, 12);

  visuals.forEach((item, idx) => {
    const image = toTmdbImage(item.movie_info?.poster_path || null);
    const title = item.movie_info?.title || `Entrada de diario ${idx + 1}`;

    if (idx % 4 === 0) {
      entries.push({
        id: 2000 + idx,
        type: "image",
        title,
        film: title,
        likes: 0,
        comments: 0,
        img: image,
      });
      return;
    }

    if (idx % 4 === 1) {
      entries.push({
        id: 2000 + idx,
        type: "video",
        title: `Clip: ${title}`,
        film: title,
        likes: 0,
        comments: 0,
        img: image,
        duration: "5 min",
      });
      return;
    }

    if (idx % 4 === 2) {
      entries.push({
        id: 2000 + idx,
        type: "audio",
        title: `Audio nota: ${title}`,
        film: title,
        likes: 0,
        comments: 0,
        img: I.audioWave,
        duration: "12 min",
      });
      return;
    }

    const collage = [
      image,
      toTmdbImage(
        diary[(idx + 1) % visuals.length]?.movie_info?.poster_path || null,
      ),
      toTmdbImage(
        diary[(idx + 2) % visuals.length]?.movie_info?.poster_path || null,
      ),
      I.blueTexture,
    ];

    entries.push({
      id: 2000 + idx,
      type: "moodboard",
      title: `Mood board: ${title}`,
      likes: 0,
      comments: 0,
      imgs: collage,
    });
  });

  if (visuals.length > 0) {
    entries.push({
      id: 2999,
      type: "list",
      title: "Lista curada del diario",
      likes: 0,
      comments: 0,
      posterCount: Math.min(visuals.length, 8),
      posters: visuals
        .slice(0, 5)
        .map((item) => toTmdbImage(item.movie_info?.poster_path || null)),
    });
  }

  return entries;
}

export function fromSocialToVault(entries: VaultSocialEntry[]): VaultEntry[] {
  return entries.map((entry) => {
    const baseImage =
      entry.cover_url || toTmdbImage(entry.movie_info?.poster_path || null);
    const mappedType: "video" | "list" | "review" =
      entry.card_type === "video"
        ? "video"
        : entry.card_type === "list"
          ? "list"
          : "review";

    return {
      id: 5000 + entry.id,
      originalId: entry.id,
      mediaType: entry.media_type,
      tmdbId: entry.tmdb_id,
      movieSlug: entry.movie_info?.title ? createSlug(entry.movie_info.title) : "",
      type: mappedType,
      title: entry.title,
      film: entry.movie_info?.title || undefined,
      likes: entry.likes_count || 0,
      comments: entry.comments_count || 0,
      img: baseImage,
      text: entry.content || undefined,
      duration: entry.duration_label || undefined,
      posters: mappedType === "list" ? [baseImage] : undefined,
      posterCount: mappedType === "list" ? 1 : undefined,
      imgs: undefined,
    };
  });
}

export function toVaultUser(
  profile: ProfileUser | null,
  entriesCount: number,
): VaultUser {
  if (!profile) {
    return {
      username: VAULT_USER.username,
      name: VAULT_USER.name,
      avatar: VAULT_USER.avatar,
      tier: "PRO",
      entries: entriesCount,
      bio: VAULT_USER.bio,
    };
  }

  return {
    username: profile.username,
    name: profile.username,
    avatar: profile.avatar_url || I.avatar,
    tier: "PRO",
    entries: entriesCount,
    bio: profile.bio || "Sin bio disponible.",
  };
}
