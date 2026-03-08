import { expect, test } from '@playwright/test'

const profile = {
  id: 1,
  username: 'josue',
  avatar_url: null,
  bio: 'Perfil de prueba para responsive.',
  created_at: '2025-01-10T00:00:00.000Z',
  _count: {
    reviews: 2,
    diary_entries: 3,
    watchlist: 4,
  },
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/verify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, username: 'josue' }),
    })
  })

  await page.route('**/api/users/username/josue', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) })
  })

  await page.route('**/api/users/1', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profile) })
  })

  await page.route('**/api/diary', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ diary: [] }) })
  })

  await page.route('**/api/watchlist', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })

  await page.route('**/api/reviews', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })
})

test('profile is usable on mobile without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/josue')

  await expect(page.getByRole('button', { name: 'Resumen' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'CineVault' })).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThan(20)
})

test('profile keeps compact layout on tablet and shows sidebar on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 })
  await page.goto('/josue')

  await expect(page.getByText('Resumen')).toBeVisible()
  await expect(page.getByText('Actividad 2025')).toHaveCount(0)

  await page.setViewportSize({ width: 1366, height: 900 })
  await page.reload()

  await expect(page.getByText('Actividad 2025')).toBeVisible()
})