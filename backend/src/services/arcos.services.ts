import { NotFoundError } from "../errors/AppErrors.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { arcosRepository } from "../repositories/ArcosRepository.js"
import { ensureMovieRefId } from "./movieRef.services.js"

type ArcoFallback = {
  id: number
  slug: string
  title: string
  description: string
  level: string
  official: boolean
  films: number
  usersCompleted: number
}

const ARCOS_FALLBACK: ArcoFallback[] = [
  {
    id: 1,
    slug: "tarkovsky-tiempo-materia",
    title: "Tarkovsky: el tiempo como materia",
    description:
      "Ruta de formacion centrada en la filmografia de Tarkovsky y su evolucion estetica.",
    level: "AVANZADO",
    official: true,
    films: 7,
    usersCompleted: 0,
  },
]

const parseCount = (value: bigint | number | null | undefined) =>
  Number(value ?? 0)

export const obtenerArcosService = async () => {
  try {
    const rows = await arcosRepository.listArcos()

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      level: row.level,
      official: Boolean(row.is_official),
      films: parseCount(row.film_count),
      usersCompleted: parseCount(row.engaged_users),
    }))
  } catch {
    return ARCOS_FALLBACK
  }
}

export const obtenerArcoByIdService = async (arcoId: number, userId?: number) => {
  try {
    const arco = await arcosRepository.findArcoById(arcoId)
    if (!arco) throw new NotFoundError("Arco no encontrado")

    const movies = await arcosRepository.listArcoMovies(arcoId)
    const progressIds = userId
      ? await arcosRepository.listUserProgressMovieIds(userId, arcoId)
      : []

    const watchedSet = new Set(progressIds.map((item) => item.movie_id))

    const moviesDetailed = await Promise.all(
      movies.map(async (movie) => {
        const tmdbId = movie.tmdb_id
        if (!tmdbId) {
          return {
            movie_id: movie.movie_id,
            tmdb_id: null,
            order: movie.order_index,
            optional: Boolean(movie.is_optional),
            note: movie.note,
            watched: watchedSet.has(movie.movie_id),
            movie_info: null,
          }
        }

        try {
          const data = (await consultarTMDB(`movie/${tmdbId}`)) as {
            title?: string
            poster_path?: string
            release_date?: string
          }

          return {
            movie_id: movie.movie_id,
            tmdb_id: tmdbId,
            order: movie.order_index,
            optional: Boolean(movie.is_optional),
            note: movie.note,
            watched: watchedSet.has(movie.movie_id),
            movie_info: {
              title: data.title || "Sin titulo",
              poster_path: data.poster_path || "",
              release_date: data.release_date || "",
            },
          }
        } catch {
          return {
            movie_id: movie.movie_id,
            tmdb_id: tmdbId,
            order: movie.order_index,
            optional: Boolean(movie.is_optional),
            note: movie.note,
            watched: watchedSet.has(movie.movie_id),
            movie_info: null,
          }
        }
      })
    )

    const completedCount = moviesDetailed.filter((movie) => movie.watched).length
    const totalCount = moviesDetailed.length

    return {
      id: arco.id,
      slug: arco.slug,
      title: arco.title,
      description: arco.description,
      level: arco.level,
      official: Boolean(arco.is_official),
      films: parseCount(arco.film_count),
      usersCompleted: parseCount(arco.engaged_users),
      progress: {
        completed: completedCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      },
      movies: moviesDetailed,
    }
  } catch {
    const fallback = ARCOS_FALLBACK.find((item) => item.id === arcoId)
    if (!fallback) throw new NotFoundError("Arco no encontrado")

    return {
      ...fallback,
      progress: {
        completed: 0,
        total: fallback.films,
        percentage: 0,
      },
      movies: [],
    }
  }
}

export const marcarProgresoArcoService = async (
  userId: number,
  arcoId: number,
  movieIdCandidate: number
) => {
  const movieId = await ensureMovieRefId(movieIdCandidate)

  const arco = await arcosRepository.findArcoById(arcoId)
  if (!arco) throw new NotFoundError("Arco no encontrado")

  const belongs = await arcosRepository.hasMovieInArco(arcoId, movieId)
  if (!belongs) {
    throw new NotFoundError("La pelicula no pertenece a este arco")
  }

  await arcosRepository.createProgress(userId, arcoId, movieId)

  return {
    message: "Progreso actualizado",
    arco_id: arcoId,
    movie_id: movieId,
  }
}
