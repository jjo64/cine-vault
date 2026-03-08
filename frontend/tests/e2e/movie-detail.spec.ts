import { expect, test } from '@playwright/test'

const moviePayload = {
  id: 550,
  title: 'El club de la lucha',
  original_title: 'Fight Club',
  release_date: '1999-10-15',
  runtime: 139,
  overview: 'Un oficinista se cruza con un vendedor de jabón y su vida cambia para siempre.',
  tagline: 'Mischief. Mayhem. Soap.',
  vote_average: 8.4,
  vote_count: 29000,
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
  ],
  production_countries: [{ iso_3166_1: 'US', name: 'Estados Unidos' }],
  spoken_languages: [{ english_name: 'English', name: 'English' }],
  production_companies: [{ name: 'Fox 2000 Pictures' }],
  credits: {
    cast: Array.from({ length: 12 }).map((_, i) => ({
      id: i + 1,
      name: `Actor ${i + 1}`,
      character: `Role ${i + 1}`,
      profile_path: i % 2 === 0 ? '/kU3B75TyRiCgE270EyZnHjfivoq.jpg' : null,
    })),
    crew: Array.from({ length: 12 }).map((_, i) => ({
      id: i + 1,
      name: `Crew ${i + 1}`,
      job: i % 2 === 0 ? 'Director' : 'Producer',
      profile_path: i % 3 === 0 ? '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg' : null,
    })),
  },
  watch_providers: {
    ES: {
      flatrate: [{ provider_name: 'MUBI' }, { provider_name: 'Filmin' }],
      rent: [{ provider_name: 'Apple TV' }],
    },
  },
  images: {
    backdrops: Array.from({ length: 5 }).map(() => ({ file_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg' })),
  },
}

const movieReviews = [
  {
    id: 1,
    user_id: 1,
    movie_id: 550,
    content: 'Excelente peli',
    rating: 4.5,
    likes: 10,
    created_at: '2026-03-08T10:00:00.000Z',
  },
]

const topRated = {
  results: Array.from({ length: 7 }).map((_, i) => ({
    id: 700 + i,
    title: `Top ${i + 1}`,
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    release_date: '2000-01-01',
  })),
}

const profile = { id: 1, username: 'josue', avatar_url: null }

test.beforeEach(async ({ page }) => {
  await page.route('**/api/movies/top-rated', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(topRated) })
  })

  await page.route('**/api/movies/550', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(moviePayload) })
  })

  await page.route('**/api/reviews/movie/550', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(movieReviews) })
  })

  await page.route('**/api/users/1', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) })
  })

  await page.route('**/api/auth/verify', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'unauthorized' }) })
  })

  await page.route('**/api/search**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
  })
})

test('cast/crew switch remains stable without list-growth bug', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/movie/550')

  await expect(page.getByRole('button', { name: 'Crew' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reparto' })).toBeVisible()

  for (let i = 0; i < 4; i += 1) {
    await page.getByRole('button', { name: 'Crew' }).click()
    await page.getByRole('button', { name: 'Reparto' }).click()
  }

  const cardsCount = await page.locator('div').filter({ hasText: 'Actor 1' }).count()
  expect(cardsCount).toBeGreaterThan(0)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThan(20)
})

test('technical sheet and watch providers stay visible on laptop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/movie/550')

  const ficha = page.getByText('Ficha técnica')
  const dondeVer = page.getByText('Dónde ver')

  await expect(ficha).toBeVisible()
  await expect(dondeVer).toBeVisible()

  const fichaBox = await ficha.boundingBox()
  const dondeBox = await dondeVer.boundingBox()

  expect(fichaBox).not.toBeNull()
  expect(dondeBox).not.toBeNull()

  if (fichaBox) {
    expect(fichaBox.x).toBeGreaterThanOrEqual(0)
    expect(fichaBox.x + fichaBox.width).toBeLessThanOrEqual(1366)
  }

  if (dondeBox) {
    expect(dondeBox.x).toBeGreaterThanOrEqual(0)
    expect(dondeBox.x + dondeBox.width).toBeLessThanOrEqual(1366)
  }
})
