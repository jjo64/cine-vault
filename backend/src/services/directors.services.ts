import { consultarTMDB } from "../helpers/fetchTMDB.js"

type TmdbMovieCredit = {
  id: number
  title?: string
  release_date?: string
  vote_average?: number
  vote_count?: number
  poster_path?: string | null
  media_type?: string
  job?: string
  department?: string
}

type DirectorTimelineItem = {
  year: number
  count: number
  avg_rating: number
}

export const obtenerDirectorAutopsyService = async (tmdbPersonId: number) => {
  const [personRaw, creditsRaw] = await Promise.all([
    consultarTMDB(`person/${tmdbPersonId}`, { language: "es-ES" }),
    consultarTMDB(`person/${tmdbPersonId}/combined_credits`, { language: "es-ES" }),
  ])

  const person = personRaw as {
    id: number
    name?: string
    profile_path?: string | null
    birthday?: string | null
    deathday?: string | null
    place_of_birth?: string | null
    biography?: string | null
  }

  const credits = creditsRaw as {
    crew?: TmdbMovieCredit[]
  }

  const directedMovies = (credits.crew || [])
    .filter((credit) => credit.media_type === "movie")
    .filter(
      (credit) =>
        (credit.job || "").toLowerCase() === "director" ||
        (credit.department || "").toLowerCase() === "directing"
    )
    .map((credit) => ({
      id: credit.id,
      title: credit.title || "Sin titulo",
      release_date: credit.release_date || "",
      vote_average: Number(credit.vote_average || 0),
      vote_count: Number(credit.vote_count || 0),
      poster_path: credit.poster_path || null,
    }))
    .sort((a, b) => (a.release_date || "").localeCompare(b.release_date || ""))

  const totalMovies = directedMovies.length
  const avgRating =
    totalMovies > 0
      ? directedMovies.reduce((acc, movie) => acc + movie.vote_average, 0) /
        totalMovies
      : 0

  const topRated =
    directedMovies.length > 0
      ? [...directedMovies].sort((a, b) => b.vote_average - a.vote_average)[0]
      : null

  const mostVoted =
    directedMovies.length > 0
      ? [...directedMovies].sort((a, b) => b.vote_count - a.vote_count)[0]
      : null

  const moviesByYear = directedMovies.reduce<Record<number, TmdbMovieCredit[]>>(
    (acc, movie) => {
      const year = Number((movie.release_date || "").slice(0, 4))
      if (!Number.isFinite(year)) return acc
      if (!acc[year]) acc[year] = []
      acc[year].push(movie)
      return acc
    },
    {}
  )

  const timeline: DirectorTimelineItem[] = Object.entries(moviesByYear)
    .map(([year, movies]) => {
      const y = Number(year)
      const count = movies.length
      const avg =
        count > 0
          ? movies.reduce((acc, movie) => acc + Number(movie.vote_average || 0), 0) /
            count
          : 0

      return {
        year: y,
        count,
        avg_rating: Number(avg.toFixed(2)),
      }
    })
    .sort((a, b) => a.year - b.year)

  const firstYear = timeline.length > 0 ? timeline[0].year : null
  const lastYear = timeline.length > 0 ? timeline[timeline.length - 1].year : null

  return {
    person_id: person.id,
    name: person.name || "Sin nombre",
    profile_path: person.profile_path || null,
    years: [person.birthday, person.deathday].filter(Boolean).join(" - ") || null,
    nationality: person.place_of_birth || "N/D",
    biography: person.biography || "",
    movies_directed: directedMovies,
    statistics: {
      total_movies: totalMovies,
      avg_rating: Number(avgRating.toFixed(2)),
      top_rated: topRated
        ? {
            title: topRated.title,
            score: Number(topRated.vote_average.toFixed(1)),
          }
        : null,
      most_voted: mostVoted
        ? {
            title: mostVoted.title,
            votes: mostVoted.vote_count,
          }
        : null,
      first_year: firstYear,
      last_year: lastYear,
    },
    timeline,
  }
}
