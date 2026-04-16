/**
 * @file mentiras.services.ts
 * @description Capa de servicios para la sección lúdica "Mentiras Cinematográficas".
 * Gestiona rankings de películas que los usuarios suelen "fingir" haber visto (shame) 
 * o aquellas que, pese a su dificultad, tienen un índice de finalización sorprendente.
 */

// --- Definición de Tipos de Dominio ---

/**
 * Representa una película en el ranking de "La Gran Mentira" (films no terminados).
 */
type ShameFilm = {
  id: number
  title: string
  director: string
  year: number
  poster: string
  shamePct: number // Porcentaje estimado de abandono/mentira
  confession: string // Cita representativa de un usuario
  voterCount: number
}

/**
 * Representa una película en el ranking de "Sorprendentemente Completadas".
 */
type SurprisingFilm = {
  id: number
  title: string
  director: string
  year: number
  poster: string
  finishRate: number // Índice de finalización real en la plataforma
  note: string
}

// --- Almacenamiento Estático (Mockups para TFG) ---

const SHAME_FILMS: ShameFilm[] = [
  {
    id: 1,
    title: "2001: Odisea del Espacio",
    director: "Stanley Kubrick",
    year: 1968,
    poster:
      "https://images.unsplash.com/photo-1769121803735-59cde1085231?w=300&q=80",
    shamePct: 78,
    confession:
      '"La dejé en la parte del monolito. Volví dos veces. Ambas quedé dormida en el mismo lugar."',
    voterCount: 4820,
  },
  {
    id: 2,
    title: "Satantango",
    director: "Bela Tarr",
    year: 1994,
    poster:
      "https://images.unsplash.com/photo-1691573252567-6c1be35aae79?w=300&q=80",
    shamePct: 91,
    confession:
      '"Siete horas. Vi tres. Estoy contando esas tres como si hubiera visto las siete."',
    voterCount: 2310,
  },
  {
    id: 3,
    title: "Inland Empire",
    director: "David Lynch",
    year: 2006,
    poster:
      "https://images.unsplash.com/photo-1670782128814-c5a55b68f50d?w=300&q=80",
    shamePct: 84,
    confession: '"La vi completa. No entendí nada. ¿Eso cuenta?"',
    voterCount: 3780,
  },
]

const SURPRISING_FILMS: SurprisingFilm[] = [
  {
    id: 1,
    title: "In the Mood for Love",
    director: "Wong Kar-wai",
    year: 2000,
    poster:
      "https://images.unsplash.com/photo-1742695760180-92c9a73ffdf2?w=300&q=80",
    finishRate: 98,
    note: "La más terminada de la plataforma.",
  },
  {
    id: 2,
    title: "Mulholland Dr.",
    director: "David Lynch",
    year: 2001,
    poster:
      "https://images.unsplash.com/photo-1670782128814-c5a55b68f50d?w=300&q=80",
    finishRate: 96,
    note: "No se entiende, pero nadie la abandona.",
  },
]

// --- Servicios Principales ---

/**
 * Obtiene los rankings globales de "Mentiras" y "Finalizaciones" de la comunidad.
 * Actualmente alimentado por datos estáticos para demostración de criterios editoriales.
 */
export const obtenerRankingMentirasService = async () => ({
  shame: SHAME_FILMS,
  completed: SURPRISING_FILMS,
})
