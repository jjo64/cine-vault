import type { FilterType, EntryType, VaultUser, VaultEntry } from "./types";

export const FILTER_MAP: Record<FilterType, EntryType | null> = {
  TODO: null,
  VIDEOS: "video",
  IMÁGENES: "image",
  AUDIOS: "audio",
  "MOOD BOARDS": "moodboard",
  LISTAS: "list",
  RESEÑAS: "review",
};

export const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

// Mock Images
export const I = {
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

// Mock User
export const VAULT_USER: VaultUser = {
  username: "martinareyes",
  name: "Martina Reyes",
  avatar: I.avatar,
  tier: "VIP",
  entries: 24,
  bio: "Cinéfila sin excusas. Tarkovsky, Lynch, Akerman.",
};

// Mock Entries
export const ENTRIES: VaultEntry[] = [
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
