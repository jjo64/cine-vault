import { expect, test } from '@playwright/test'

const tvPayload = {
  id: 1396,
  name: 'Breaking Bad',
  first_air_date: '2008-01-20',
  last_air_date: '2013-09-29',
  number_of_seasons: 5,
  number_of_episodes: 62,
  overview: 'Un profesor de química se vuelve fabricante de metanfetamina.',
  tagline: 'Remember my name.',
  vote_average: 8.9,
  poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
  backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
  genres: [{ id: 18, name: 'Drama' }],
  created_by: [{ id: 1, name: 'Vince Gilligan' }],
  credits: {
    cast: Array.from({ length: 8 }).map((_, i) => ({
      id: i + 1,
      name: `Cast ${i + 1}`,
      character: `Role ${i + 1}`,
      profile_path: null,
    })),
    crew: Array.from({ length: 6 }).map((_, i) => ({
      id: 90 + i,
      name: `Crew ${i + 1}`,
      job: i % 2 === 0 ? 'Director' : 'Writer',
      department: i % 2 === 0 ? 'Directing' : 'Writing',
      profile_path: null,
    })),
  },
  watch_providers: {
    ES: {
      flatrate: [{ provider_name: 'Netflix' }],
    },
  },
  similar: {
    results: [
      { id: 66732, name: 'Stranger Things', poster_path: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', first_air_date: '2016-07-15', vote_average: 8.6 },
    ],
  },
  images: {
    backdrops: Array.from({ length: 4 }).map(() => ({ file_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg' })),
  },
  season_details: [
    {
      id: 100,
      name: 'Temporada 1',
      season_number: 1,
      episode_count: 7,
      air_date: '2008-01-20',
      episodes: Array.from({ length: 3 }).map((_, i) => ({
        id: 500 + i,
        name: `Episodio ${i + 1}`,
        episode_number: i + 1,
        runtime: 47,
        still_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
        air_date: '2008-01-20',
      })),
    },
  ],
}

const personPayload = {
  id: 525,
  name: 'Christopher Nolan',
  biography: 'Director y guionista británico-estadounidense.',
  profile_path: '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg',
  birthday: '1970-07-30',
  place_of_birth: 'London, England',
  known_for_department: 'Directing',
}

const creditsPayload = {
  cast: [
    { id: 27205, media_type: 'movie', title: 'Inception', poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', character: 'Cobb', vote_average: 8.3 },
    { id: 157336, media_type: 'movie', title: 'Interstellar', poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', character: 'Cooper', vote_average: 8.4 },
  ],
  crew: [
    { id: 155, media_type: 'movie', title: 'The Dark Knight', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', job: 'Director', department: 'Directing', vote_average: 8.5 },
    { id: 49026, media_type: 'movie', title: 'The Dark Knight Rises', poster_path: '/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg', job: 'Director', department: 'Directing', vote_average: 7.8 },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/verify', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'unauthorized' }),
    })
  })

  await page.route('**/api/search/tv/1396', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tvPayload) })
  })

  await page.route('**/api/reviews/movie/1396', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })

  await page.route('**/api/information/person/525', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(personPayload) })
  })

  await page.route('**/api/information/person/525/combined_credits', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(creditsPayload) })
  })

  await page.route('**/api/search?q=*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
  })
})

test('tv detail muestra secciones completas y temporadas expandibles', async ({ page }) => {
  await page.goto('/tv/1396')

  await expect(page.getByRole('heading', { name: 'Breaking Bad' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Temporadas' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cast y Crew' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dónde ver' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Series similares' })).toBeVisible()

  const expandButton = page.getByRole('button', { name: /ver episodios/i }).first()
  if (await expandButton.isVisible().catch(() => false)) {
    await expandButton.click()
  }

  await expect(page.getByText(/E1:\s*Episodio 1/i)).toBeVisible()
})

test('person detail mantiene tabs y muestra metricas nuevas', async ({ page }) => {
  await page.goto('/person/525')

  await expect(page.getByRole('heading', { name: 'Christopher Nolan' })).toBeVisible()
  await expect(page.getByText('Acting credits')).toBeVisible()
  await expect(page.getByText('Crew credits')).toBeVisible()
  await expect(page.getByText('Known for')).toBeVisible()

  await page.getByRole('button', { name: 'Como director o crew' }).click()
  await expect(page.getByText('Directing')).toBeVisible()
})
