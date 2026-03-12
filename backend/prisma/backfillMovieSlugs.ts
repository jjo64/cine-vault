import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { consultarTMDB } from '../src/helpers/fetchTMDB.js'
import { generateSlug } from '../src/helpers/generateSlug.js'

const prisma = new PrismaClient()

const uniqueSlug = (slug: string, movieId: number) => `${slug}-${movieId}`

async function run() {
  const movies = await prisma.movies_ref.findMany({
    select: {
      id: true,
      tmdb_id: true,
      slug: true,
    },
    orderBy: { id: 'asc' },
  })

  for (const movie of movies) {
    if (movie.slug) continue

    try {
      const detail = (await consultarTMDB(`movie/${movie.tmdb_id}`)) as {
        title?: string
        release_date?: string
      }

      const title = detail.title || `movie-${movie.tmdb_id}`
      const year = detail.release_date ? new Date(detail.release_date).getFullYear() : new Date().getFullYear()
      const nextSlug = uniqueSlug(generateSlug(title, year), movie.tmdb_id)

      await prisma.movies_ref.update({
        where: { id: movie.id },
        data: { slug: nextSlug },
      })

      console.log(`Updated slug for movie ${movie.tmdb_id}: ${nextSlug}`)
    } catch (error) {
      console.error(`Failed slug backfill for movie ${movie.tmdb_id}`, error)
    }
  }
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
