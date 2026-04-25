/**
 * CineVault — Vault Creativo (/vault/:username)
 * Galería de contenido cinematográfico creado por el usuario.
 */

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Play,
  Plus,
  ArrowLeft,
  Crown,
} from "lucide-react";
import { getCurrentUser, getStoredAccessToken } from "../services/authServices";
import {
  fetchDiary,
  fetchReviews,
  fetchVaultSocial,
  fetchUserProfileByUsername,
  type ProfileUser,
  type ReviewEntry,
  type RichDiaryEntry,
  type VaultSocialEntry,
} from "../services/profileServices";
import "./Vault.css";

// ─── PALETTE ─────────────────────────────────────────────────
const C = {
  bg: "#080808",
  surface: "#111111",
  elevated: "#1A1A1A",
  border: "#2A2A2A",
  accent: "#D4AF7A",
  accentDim: "#9A7A48",
  accentGlow: "rgba(212,175,122,0.15)",
  text: "#E2E2E2",
  textSoft: "#7A7A7A",
  textMuted: "#3A3A3A",
  gold: "#C8A96E",
} as const;

const SERIF = "'Playfair Display', 'Cormorant Garamond', serif";
const SANS = "'Syne', sans-serif";

// ─── TYPES ───────────────────────────────────────────────────
type EntryType = "image" | "video" | "audio" | "moodboard" | "list" | "review";
type MembershipTier = "VIP" | "PRO";

interface VaultEntry {
  id: number;
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

interface VaultUser {
  username: string;
  name: string;
  avatar: string;
  tier: MembershipTier;
  entries: number;
  bio: string;
}

// ─── IMAGE HELPER ─────────────────────────────────────────────
function Img({
  src,
  alt,
  style,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = useState(false);
  if (err) return <div style={{ ...style, background: C.elevated }} />;
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setErr(true)}
      {...rest}
    />
  );
}

// ─── MOCK IMAGES ─────────────────────────────────────────────
const I = {
  fog: "https://images.unsplash.com/photo-1563941433-b6a094653ed2?w=800&q=80",
  filmNoir:
    "https://images.unsplash.com/photo-1706460400799-bd339797d306?w=800&q=80",
  cinema:
    "https://images.unsplash.com/photo-1761502479994-3a5e07ec243e?w=800&q=80",
  blueTexture:
    "https://images.unsplash.com/photo-1769121803735-59cde1085231?w=800&q=80",
  nightCity:
    "https://images.unsplash.com/photo-1670782128814-c5a55b68f50d?w=800&q=80",
  projector:
    "https://images.unsplash.com/photo-1762541693135-fb989de961e1?w=800&q=80",
  portrait:
    "https://images.unsplash.com/photo-1761429944940-fe98ec7ba4cb?w=800&q=80",
  italy:
    "https://images.unsplash.com/photo-1753731622675-56904104f4a9?w=800&q=80",
  hongKong:
    "https://images.unsplash.com/photo-1742695760180-92c9a73ffdf2?w=800&q=80",
  mistyRoad:
    "https://images.unsplash.com/photo-1763713441172-37ed2f89b256?w=800&q=80",
  grain:
    "https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=800&q=80",
  audioWave:
    "https://images.unsplash.com/photo-1765408217331-6d73ee0fc260?w=800&q=80",
  filmReel:
    "https://images.unsplash.com/photo-1770982726697-309881d78cc1?w=800&q=80",
  darkRain:
    "https://images.unsplash.com/photo-1741079746677-5f25b2de7fa0?w=800&q=80",
  desolate:
    "https://images.unsplash.com/photo-1691573252567-6c1be35aae79?w=800&q=80",
  avatar:
    "https://images.unsplash.com/photo-1628070435838-19eb835ad70d?w=200&q=80",
};

// ─── MOCK DATA ───────────────────────────────────────────────
const VAULT_USER: VaultUser = {
  username: "martinareyes",
  name: "Martina Reyes",
  avatar: I.avatar,
  tier: "VIP",
  entries: 24,
  bio: "Cinéfila sin excusas. Tarkovsky, Lynch, Akerman.",
};

const ENTRIES: VaultEntry[] = [
  {
    id: 1,
    type: "review",
    title: "Stalker: la Zona como espejo",
    film: "Stalker",
    likes: 312,
    comments: 47,
    img: I.fog,
    text: "Hay películas que ves y películas que te ven a vos. Stalker es de las segundas. Tarkovsky construye un espacio donde no importa si la Zona existe o no...",
  },
  {
    id: 2,
    type: "video",
    title: "Planos secuencia que me detienen la vida",
    film: "Múltiples",
    likes: 891,
    comments: 103,
    img: I.nightCity,
    duration: "6 min",
  },
  {
    id: 3,
    type: "image",
    title: "El cine como arquitectura del tiempo",
    film: "Nostalghia",
    likes: 204,
    comments: 28,
    img: I.mistyRoad,
  },
  {
    id: 4,
    type: "audio",
    title: "Wong Kar-wai y la nostalgia imposible",
    film: "In the Mood for Love",
    likes: 156,
    comments: 31,
    duration: "22 min",
    img: I.audioWave,
  },
  {
    id: 5,
    type: "moodboard",
    title: "Texturas de película: lo que se siente sin ver",
    film: undefined,
    likes: 445,
    comments: 62,
    imgs: [I.fog, I.filmNoir, I.grain, I.blueTexture, I.darkRain, I.desolate],
  },
  {
    id: 6,
    type: "list",
    title: "Cinco películas para empezar en Godard",
    film: undefined,
    likes: 278,
    comments: 54,
    posterCount: 5,
    posters: [I.cinema, I.projector, I.filmNoir, I.blueTexture, I.italy],
  },
  {
    id: 7,
    type: "video",
    title: "Mulholland Dr. — La lógica del sueño",
    film: "Mulholland Drive",
    likes: 1204,
    comments: 187,
    img: I.hongKong,
    duration: "18 min",
  },
  {
    id: 8,
    type: "image",
    title: "Bergman y el silencio como lenguaje",
    film: "Persona",
    likes: 334,
    comments: 41,
    img: I.portrait,
  },
  {
    id: 9,
    type: "review",
    title: "Jeanne Dielman: el tiempo como arma",
    film: "Jeanne Dielman",
    likes: 567,
    comments: 89,
    img: I.grain,
    text: "Chantal Akerman inventó el tiempo real como arma política. Tres horas y media de cocina, rutina y silencio que explotan sin que veas venir la explosión...",
  },
  {
    id: 10,
    type: "audio",
    title: "El sonido en Tarkovsky: silencio diseñado",
    film: "Stalker",
    likes: 98,
    comments: 14,
    duration: "14 min",
    img: I.audioWave,
  },
  {
    id: 11,
    type: "moodboard",
    title: "Neorrealismo italiano — palette visual",
    film: undefined,
    likes: 201,
    comments: 33,
    imgs: [I.italy, I.desolate, I.filmNoir, I.cinema],
  },
  {
    id: 12,
    type: "list",
    title: "Directoras que redefinen el tiempo",
    film: undefined,
    likes: 389,
    comments: 71,
    posterCount: 8,
    posters: [I.portrait, I.fog, I.mistyRoad, I.grain],
  },
];

type FilterType =
  | "TODO"
  | "VIDEOS"
  | "IMÁGENES"
  | "AUDIOS"
  | "MOOD BOARDS"
  | "LISTAS"
  | "RESEÑAS";

const FILTER_MAP: Record<FilterType, EntryType | null> = {
  TODO: null,
  VIDEOS: "video",
  IMÁGENES: "image",
  AUDIOS: "audio",
  "MOOD BOARDS": "moodboard",
  LISTAS: "list",
  RESEÑAS: "review",
};

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

function toTmdbImage(path?: string | null) {
  return path ? `${TMDB_IMG}${path}` : I.fog;
}

function fromReviewsToVault(reviews: ReviewEntry[]): VaultEntry[] {
  return reviews.slice(0, 8).map((review) => ({
    id: 1000 + review.id,
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

function fromDiaryToVault(diary: RichDiaryEntry[]): VaultEntry[] {
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

function fromSocialToVault(entries: VaultSocialEntry[]): VaultEntry[] {
  return entries.map((entry) => {
    const baseImage =
      entry.cover_url || toTmdbImage(entry.movie_info?.poster_path || null);
    const mappedType: EntryType =
      entry.card_type === "video"
        ? "video"
        : entry.card_type === "list"
          ? "list"
          : "review";

    return {
      id: 5000 + entry.id,
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

function toVaultUser(
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

// ─── GRAIN OVERLAY ───────────────────────────────────────────
function GrainOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1000,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.3,
      }}
    />
  );
}

// ─── CARD COMPONENTS ─────────────────────────────────────────
function CardFooter({ entry, avatar }: { entry: VaultEntry; avatar: string }) {
  const typeLabel: Record<EntryType, string> = {
    image: "Imagen",
    video: "Video",
    audio: "Audio",
    moodboard: "Mood Board",
    list: "Lista",
    review: "Reseña",
  };
  const [liked, setLiked] = useState(false);
  return (
    <div
      style={{
        padding: "10px 14px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Img
          src={avatar}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      {entry.film && (
        <span
          style={{
            fontSize: 10,
            color: C.accent,
            fontFamily: SANS,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {entry.film}
        </span>
      )}
      <span
        style={{
          fontSize: 9,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: C.textMuted,
          border: `1px solid ${C.border}`,
          padding: "2px 7px",
          fontFamily: SANS,
          flexShrink: 0,
        }}
      >
        {typeLabel[entry.type]}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginLeft: "auto",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setLiked((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: liked ? C.accent : C.textSoft,
            padding: 0,
            transition: "color 0.2s",
          }}
        >
          <Heart size={11} fill={liked ? C.accent : "none"} />
          <span style={{ fontSize: 10, fontFamily: SANS }}>
            {entry.likes + (liked ? 1 : 0)}
          </span>
        </button>
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: C.textSoft,
            padding: 0,
          }}
        >
          <MessageCircle size={11} />
          <span style={{ fontSize: 10, fontFamily: SANS }}>
            {entry.comments}
          </span>
        </button>
      </div>
    </div>
  );
}

function ImageCard({ entry, avatar }: { entry: VaultEntry; avatar: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        marginBottom: 12,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ position: "relative", overflow: "hidden" }}>
        <Img
          src={entry.img}
          alt={entry.title}
          style={{
            width: "100%",
            display: "block",
            filter: hov ? "brightness(0.65)" : "brightness(0.85) saturate(0.7)",
            transition: "filter 0.35s",
            transform: hov ? "scale(1.03)" : "scale(1)",
            transformOrigin: "center",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(8,8,8,0.72)",
            opacity: hov ? 1 : 0,
            transition: "opacity 0.3s",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 16,
          }}
        >
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 16,
              fontStyle: "italic",
              color: C.text,
              lineHeight: 1.35,
            }}
          >
            {entry.title}
          </div>
          {entry.film && (
            <div
              style={{
                fontSize: 11,
                color: C.accent,
                fontFamily: SANS,
                marginTop: 4,
              }}
            >
              {entry.film}
            </div>
          )}
        </div>
      </div>
      <CardFooter entry={entry} avatar={avatar} />
    </div>
  );
}

function VideoCard({ entry, avatar }: { entry: VaultEntry; avatar: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        marginBottom: 12,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16/9",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <Img
          src={entry.img}
          alt={entry.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(0.4) brightness(0.55)",
            transform: hov ? "scale(1.03)" : "scale(1)",
            transition: "all 0.35s",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: `1.5px solid ${hov ? C.accent : "rgba(255,255,255,0.4)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
              background: hov ? C.accentGlow : "rgba(255,255,255,0.06)",
              transition: "all 0.25s",
            }}
          >
            <Play
              size={14}
              fill="white"
              color="white"
              style={{ marginLeft: 2 }}
            />
          </div>
        </div>
        {entry.duration && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 10,
              fontSize: 10,
              color: C.text,
              fontFamily: SANS,
              background: "rgba(8,8,8,0.85)",
              padding: "2px 6px",
            }}
          >
            {entry.duration}
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px 4px" }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 15,
            color: C.text,
            lineHeight: 1.35,
            marginBottom: 2,
          }}
        >
          {entry.title}
        </div>
      </div>
      <CardFooter entry={entry} avatar={avatar} />
    </div>
  );
}

function AudioCard({ entry, avatar }: { entry: VaultEntry; avatar: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const toggle = () => {
    setPlaying((v) => !v);
    if (!playing) {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setPlaying(false);
            return 0;
          }
          return p + 0.5;
        });
      }, 100);
    }
  };
  return (
    <div
      style={{
        background: C.elevated,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        marginBottom: 12,
        position: "relative",
      }}
    >
      <Img
        src={entry.img}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.15) saturate(0)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{ position: "relative", zIndex: 1, padding: "20px 18px 4px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <button
            onClick={toggle}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: `1.5px solid ${C.accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              cursor: "pointer",
              flexShrink: 0,
              color: C.accent,
            }}
          >
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill={C.accent}>
                <rect x="2" y="2" width="3" height="8" rx="0.5" />
                <rect x="7" y="2" width="3" height="8" rx="0.5" />
              </svg>
            ) : (
              <Play size={12} fill={C.accent} style={{ marginLeft: 1 }} />
            )}
          </button>
          {/* Waveform bars */}
          <div
            style={{
              flex: 1,
              display: "flex",
              gap: 2,
              alignItems: "center",
              height: 28,
            }}
          >
            {Array.from({ length: 28 }).map((_, i) => {
              const h = 4 + Math.abs(Math.sin(i * 0.9)) * 20;
              const filled = (i / 28) * 100 < progress;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}px`,
                    background: filled ? C.accent : C.textMuted,
                    borderRadius: 1,
                    transition: "background 0.1s",
                    opacity: filled ? 1 : 0.5,
                  }}
                />
              );
            })}
          </div>
          {entry.duration && (
            <span
              style={{
                fontSize: 10,
                color: C.textSoft,
                fontFamily: SANS,
                flexShrink: 0,
              }}
            >
              {entry.duration}
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 17,
            color: C.text,
            lineHeight: 1.35,
            marginBottom: 4,
          }}
        >
          {entry.title}
        </div>
      </div>
      <CardFooter entry={entry} avatar={avatar} />
    </div>
  );
}

function MoodboardCard({
  entry,
  avatar,
}: {
  entry: VaultEntry;
  avatar: string;
}) {
  const imgs = entry.imgs ?? [];
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2,
        }}
      >
        {imgs.slice(0, 6).map((src, i) => (
          <div key={i} style={{ aspectRatio: "1", overflow: "hidden" }}>
            <Img
              src={src}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "saturate(0.5) brightness(0.75)",
                transition: "filter 0.3s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLImageElement).style.filter =
                  "saturate(0.8) brightness(0.9)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLImageElement).style.filter =
                  "saturate(0.5) brightness(0.75)";
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 14px 4px" }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 15,
            color: C.text,
            lineHeight: 1.35,
          }}
        >
          {entry.title}
        </div>
      </div>
      <CardFooter entry={entry} avatar={avatar} />
    </div>
  );
}

function ListCard({ entry, avatar }: { entry: VaultEntry; avatar: string }) {
  const posters = entry.posters ?? [];
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {/* Stacked poster perspective effect */}
      <div
        style={{
          padding: "20px 16px 8px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", width: 80, height: 110 }}>
          {posters
            .slice(0, 3)
            .reverse()
            .map((src, i) => {
              const idx = 2 - i;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 72,
                    height: 100,
                    top: idx * 4,
                    left: idx * 4,
                    zIndex: idx + 1,
                    border: `2px solid ${C.bg}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
                    transform: `rotate(${(idx - 1) * 3}deg)`,
                    overflow: "hidden",
                  }}
                >
                  <Img
                    src={src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "saturate(0.6)",
                    }}
                  />
                </div>
              );
            })}
        </div>
      </div>
      <div style={{ padding: "8px 14px 4px" }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 17,
            color: C.text,
            lineHeight: 1.35,
            marginBottom: 4,
          }}
        >
          {entry.title}
        </div>
        <div style={{ fontSize: 10, color: C.textSoft, fontFamily: SANS }}>
          {entry.posterCount} películas
        </div>
      </div>
      <CardFooter entry={entry} avatar={avatar} />
    </div>
  );
}

function ReviewCard({ entry, avatar }: { entry: VaultEntry; avatar: string }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {entry.img && (
        <div style={{ height: 80, overflow: "hidden", position: "relative" }}>
          <Img
            src={entry.img}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(0.3) brightness(0.4)",
            }}
          />
          {entry.film && (
            <div
              style={{
                position: "absolute",
                bottom: 10,
                left: 14,
                fontFamily: SANS,
                fontSize: 11,
                color: C.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {entry.film}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: "14px 16px 4px" }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 17,
            color: C.text,
            lineHeight: 1.3,
            marginBottom: 10,
          }}
        >
          {entry.title}
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 14,
            color: C.textSoft,
            lineHeight: 1.7,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {entry.text}
        </div>
      </div>
      <CardFooter entry={entry} avatar={avatar} />
    </div>
  );
}

function EntryCard({ entry, avatar }: { entry: VaultEntry; avatar: string }) {
  switch (entry.type) {
    case "image":
      return <ImageCard entry={entry} avatar={avatar} />;
    case "video":
      return <VideoCard entry={entry} avatar={avatar} />;
    case "audio":
      return <AudioCard entry={entry} avatar={avatar} />;
    case "moodboard":
      return <MoodboardCard entry={entry} avatar={avatar} />;
    case "list":
      return <ListCard entry={entry} avatar={avatar} />;
    case "review":
      return <ReviewCard entry={entry} avatar={avatar} />;
  }
}

// ─── PAGE ────────────────────────────────────────────────────
export function Vault() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<VaultUser>(VAULT_USER);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterType>("TODO");
  const filters: FilterType[] = [
    "TODO",
    "VIDEOS",
    "IMÁGENES",
    "AUDIOS",
    "MOOD BOARDS",
    "LISTAS",
    "RESEÑAS",
  ];

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const token = getStoredAccessToken();
        const profile = username
          ? await fetchUserProfileByUsername(username, token)
          : null;
        const viewer = await getCurrentUser().catch(() => null);

        if (!active) return;

        const owner = Boolean(
          viewer &&
          profile &&
          viewer.username.toLowerCase() === profile.username.toLowerCase(),
        );
        setIsOwner(owner);

        if (!profile) {
          setUser(VAULT_USER);
          setEntries(ENTRIES);
          return;
        }

        const socialRes = await fetchVaultSocial(profile.id, token, owner);

        if (!active) return;

        let mapped = Array.isArray(socialRes.items)
          ? fromSocialToVault(socialRes.items)
          : [];

        if (!mapped.length) {
          const [diaryRes, reviewsRes] = await Promise.all([
            fetchDiary(profile.id, token, owner),
            fetchReviews(profile.id, token, owner),
          ]);

          const diaryEntries = Array.isArray(diaryRes.diary)
            ? diaryRes.diary
            : [];
          const reviewEntries = Array.isArray(reviewsRes) ? reviewsRes : [];
          mapped = [
            ...fromReviewsToVault(reviewEntries),
            ...fromDiaryToVault(diaryEntries),
          ];
        }

        mapped = mapped.sort((a, b) => b.id - a.id);

        setEntries(mapped);
        setUser(toVaultUser(profile, mapped.length));
      } catch {
        if (!active) return;
        setLoadError("No se pudo cargar el vault para este usuario.");
        setUser(VAULT_USER);
        setEntries(ENTRIES);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [username]);

  const filtered =
    activeFilter === "TODO"
      ? entries
      : entries.filter((e) => e.type === FILTER_MAP[activeFilter]);

  const profileLink = user.username ? `/${user.username}` : "/profile";

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        fontFamily: SANS,
      }}
    >
      <GrainOverlay />

      {/* Top nav */}
      <nav
        className="vault-navbar"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <Link
          to={profileLink}
          style={{
            color: C.textSoft,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: SANS,
          }}
        >
          <ArrowLeft size={13} /> Perfil
        </Link>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 18,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: C.text,
          }}
        >
          Cine<span style={{ color: C.accent }}>Vault</span>
        </div>
        <Bookmark size={16} color={C.textSoft} style={{ cursor: "pointer" }} />
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="vault-header"
        style={{ display: "flex", alignItems: "flex-end", gap: 28 }}
      >
        {/* Avatar */}
        <div
          style={{ width: 88, height: 88, flexShrink: 0, position: "relative" }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 0,
              border: `1.5px solid ${C.accent}`,
              overflow: "hidden",
            }}
          >
            <Img
              src={user.avatar}
              alt={user.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: -6,
              right: -6,
              background: C.accent,
              color: C.bg,
              fontFamily: SANS,
              fontSize: 8,
              letterSpacing: "0.15em",
              padding: "3px 7px",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Crown size={8} /> {user.tier}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 38,
              fontWeight: 400,
              color: C.text,
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            {user.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.textSoft,
              fontFamily: SANS,
              marginBottom: 8,
              letterSpacing: "0.1em",
            }}
          >
            @{user.username}
          </div>
          <div
            style={{
              fontSize: 13,
              color: C.textSoft,
              fontFamily: SERIF,
              fontStyle: "italic",
            }}
          >
            {user.bio}
          </div>
        </div>

        {/* Stats + actions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 14,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 30,
                fontWeight: 300,
                color: C.text,
              }}
            >
              {user.entries}
            </span>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.textSoft,
                marginLeft: 8,
                fontFamily: SANS,
              }}
            >
              entradas
            </span>
          </div>
          {!isOwner ? (
            <button
              style={{
                padding: "9px 22px",
                background: C.accent,
                color: C.bg,
                border: "none",
                fontFamily: SANS,
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Seguir
            </button>
          ) : (
            <div
              style={{
                fontSize: 11,
                color: C.textMuted,
                fontFamily: SANS,
                fontStyle: "italic",
              }}
            >
              Tu vault
            </div>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <div
        className="vault-filters-wrap"
        style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}
      >
        <div className="vault-type-tabs" style={{ gap: 0 }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: "14px 20px",
                background: "none",
                border: "none",
                borderBottom:
                  activeFilter === f
                    ? `2px solid ${C.accent}`
                    : "2px solid transparent",
                color: activeFilter === f ? C.text : C.textSoft,
                fontFamily: SANS,
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginBottom: -1,
                transition: "all 0.2s",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="vault-content">
        {loading && (
          <div
            style={{
              color: C.textSoft,
              fontFamily: SANS,
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            Cargando vault...
          </div>
        )}
        {loadError && (
          <div
            style={{
              color: "#C97B7B",
              fontFamily: SANS,
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            {loadError}
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 0",
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 20,
                  color: C.textSoft,
                }}
              >
                Este vault está vacío. Toda gran colección empieza con una
                decisión.
              </div>
            ) : (
              <ResponsiveMasonry columnsCountBreakPoints={{ 640: 2, 1024: 3 }}>
                <Masonry gutter="0px">
                  {filtered.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ padding: "0 6px" }}
                    >
                      <EntryCard entry={entry} avatar={user.avatar} />
                    </motion.div>
                  ))}
                </Masonry>
              </ResponsiveMasonry>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating add button (owner only) */}
      {isOwner && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          style={{
            position: "fixed",
            bottom: 32,
            right: 32,
            zIndex: 200,
            padding: "13px 22px",
            background: C.accent,
            color: C.bg,
            border: "none",
            fontFamily: SANS,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: `0 4px 24px rgba(212,175,122,0.4)`,
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={13} /> Agregar al vault
        </motion.button>
      )}
    </div>
  );
}
