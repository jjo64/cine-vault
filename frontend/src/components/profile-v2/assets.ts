import type { VaultMockItem } from "./models";

export const IMG = {
  avatar:
    "https://images.unsplash.com/photo-1628070435838-19eb835ad70d?w=400&q=80",
  filmNoir:
    "https://images.unsplash.com/photo-1706460400799-bd339797d306?w=800&q=80",
  fog: "https://images.unsplash.com/photo-1563941433-b6a094653ed2?w=800&q=80",
  cinema:
    "https://images.unsplash.com/photo-1761502479994-3a5e07ec243e?w=800&q=80",
  blueTexture:
    "https://images.unsplash.com/photo-1769121803735-59cde1085231?w=800&q=80",
  forest:
    "https://images.unsplash.com/photo-1759360383439-c3fdf352f1b6?w=800&q=80",
  nightCity:
    "https://images.unsplash.com/photo-1670782128814-c5a55b68f50d?w=800&q=80",
  projector:
    "https://images.unsplash.com/photo-1762541693135-fb989de961e1?w=800&q=80",
  womanPortrait:
    "https://images.unsplash.com/photo-1761429944940-fe98ec7ba4cb?w=800&q=80",
  italy:
    "https://images.unsplash.com/photo-1753731622675-56904104f4a9?w=800&q=80",
  hongKong:
    "https://images.unsplash.com/photo-1742695760180-92c9a73ffdf2?w=800&q=80",
  mistyRoad:
    "https://images.unsplash.com/photo-1763713441172-37ed2f89b256?w=800&q=80",
  grain:
    "https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=800&q=80",
} as const;

export const backdropImages = [
  IMG.filmNoir,
  IMG.fog,
  IMG.cinema,
  IMG.blueTexture,
  IMG.nightCity,
  IMG.projector,
];

export const vaultMockItems: VaultMockItem[] = [
  {
    id: 1,
    type: "Reflexion",
    title: "Por que Tarkovsky te cambia la vida",
    duration: "12 min",
    views: 234,
    img: IMG.mistyRoad,
  },
  {
    id: 2,
    type: "Edit",
    title: "Escenas que me partieron en dos",
    duration: "4 min",
    views: 89,
    img: IMG.nightCity,
  },
  {
    id: 3,
    type: "Critica",
    title: "Mulholland Dr. y la logica del sueno",
    duration: "18 min",
    views: 412,
    img: IMG.fog,
  },
  {
    id: 4,
    type: "Recomendacion",
    title: "Cinco peliculas para empezar en Godard",
    duration: "8 min",
    views: 156,
    img: IMG.projector,
  },
  {
    id: 5,
    type: "Reflexion",
    title: "El tiempo en el cine: Resnais y Marker",
    duration: "22 min",
    views: 98,
    img: IMG.blueTexture,
  },
  {
    id: 6,
    type: "Edit",
    title: "Planos secuencia que me detienen la vida",
    duration: "6 min",
    views: 311,
    img: IMG.cinema,
  },
];
