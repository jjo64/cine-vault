import { test, expect, devices } from '@playwright/test'

/**
 * TAREA 10: Test visual con Playwright
 * Este archivo realiza capturas de pantalla en dispositivos móviles
 * para verificar que el diseño premium de CineVault se mantenga.
 */

const VIEWS = [
  { name: 'Home/Landing', url: '/' },
  { name: 'Search Results', url: '/search?q=interstellar' },
  { name: 'Movie Detail', url: '/movie/157336-interstellar' },
  { name: 'User Diary', url: '/diary' },
  { name: 'Vault', url: '/vault' },
  { name: 'Lists', url: '/lists' },
  { name: 'Settings', url: '/settings' },
]

test.describe('CineVault Mobile Visual Regression', () => {
  // Simular iPhone 13 para pruebas móviles
  test.use({ ...devices['iPhone 13'] })

  for (const view of VIEWS) {
    test(`Visual capture: ${view.name}`, async ({ page }) => {
      // Navegación
      await page.goto(view.url)
      
      // Esperar estabilidad
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500) // Extra para animaciones de entrada

      // Tomar captura
      await expect(page).toHaveScreenshot(`${view.name.replace(/\//g, '-')}-mobile.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.1,
      })
    })
  }
})
