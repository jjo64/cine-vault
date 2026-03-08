import { expect, test, type Page } from '@playwright/test'

const moviePayload = {
  id: 550,
  title: 'El club de la lucha',
  original_title: 'Fight Club',
  release_date: '1999-10-15',
  runtime: 139,
  overview: 'Un oficinista se cruza con un vendedor de jabon y su vida cambia para siempre.',
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
    cast: [{ id: 1, name: 'Actor 1', character: 'Role 1', profile_path: null }],
    crew: [{ id: 1, name: 'David Fincher', job: 'Director', profile_path: null }],
  },
  watch_providers: { ES: { flatrate: [{ provider_name: 'MUBI' }] } },
  images: { backdrops: [{ file_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg' }] },
}

function setupCommonRoutes(page: Page) {
  return Promise.all([
    page.route('**/api/movies/550', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(moviePayload) })
    }),
    page.route('**/api/movies/top-rated', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
    }),
    page.route('**/api/reviews/movie/550', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }),
    page.route('**/api/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          total_pages: 1,
          total_results: 2,
          results: [
            {
              id: 550,
              title: 'Fight Club',
              original_title: 'Fight Club',
              poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
              release_date: '1999-10-15',
              overview: 'Un oficinista se cruza con un vendedor de jabon y su vida cambia para siempre.',
              director: 'David Fincher',
            },
            {
              id: 13,
              title: 'Forrest Gump',
              original_title: 'Forrest Gump',
              poster_path: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
              release_date: '1994-06-23',
              overview: 'Historia de vida de Forrest.',
              director: 'Robert Zemeckis',
            },
          ],
        }),
      })
    }),
  ])
}

test('logged-in home renders activity dashboard', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxfQ.signature')
  })

  await page.route('**/api/auth/verify', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, username: 'josue' }) })
  })

  await page.route('**/api/watchlist', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ movie_id: 550, movie_title: 'Fight Club', movie_poster: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg' }]),
    })
  })

  await page.route('**/api/diary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ diary: [{ movie_id: 13, movie_title: 'Forrest Gump', movie_poster: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg' }] }),
    })
  })

  await page.route('**/api/reviews', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 11, movie_id: 550, movie_title: 'Fight Club', rating: 5, content: 'Obra maestra.' }]),
    })
  })

  await page.goto('/')

  await expect(page.getByTestId('home-logged')).toBeVisible()
  await expect(page.getByText('Bienvenido, josue')).toBeVisible()
  await expect(page.getByText('Watchlist')).toBeVisible()
  await expect(page.getByText('Actividad reciente')).toBeVisible()
})

test('search page lists results and links to movie detail', async ({ page }) => {
  await setupCommonRoutes(page)
  await page.route('**/api/auth/verify', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'unauthorized' }) })
  })

  await page.goto('/search/fight+club')

  await expect(page.getByRole('heading', { name: /coincidencias/i })).toBeVisible()
  await expect(page.locator('h2', { hasText: 'Fight Club' }).first()).toBeVisible()

  const firstResult = page.locator('a[href*="/movie/550-"]').first()
  await expect(firstResult).toBeVisible()
})

test('movie detail blocks protected actions for guests', async ({ page }) => {
  await setupCommonRoutes(page)

  await page.route('**/api/auth/verify', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'unauthorized' }) })
  })

  await page.goto('/movie/550')
  await expect(page.getByText('El club de la lucha')).toBeVisible()

  await page.getByRole('button', { name: '+ Vault' }).click()
  await expect(page.getByText('Tienes que loguearte para usar esta opción')).toBeVisible()
})
