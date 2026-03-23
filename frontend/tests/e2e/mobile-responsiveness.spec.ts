import { test, expect, devices } from '@playwright/test'

const PAGES = [
  '/',
  '/search?q=interstellar',
  '/movie/157336-interstellar',
  '/diary',
  '/vault',
  '/lists',
  '/settings',
]

test.describe('Mobile Responsiveness Visual Check', () => {
  // Configuración de dispositivo móvil (iPhone 13)
  test.use({ ...devices['iPhone 13'] })

  for (const url of PAGES) {
    test(`Visual test for page: ${url}`, async ({ page }) => {
      // Navegar a la página
      await page.goto(url)
      
      // Esperar a que la carga inicial se estabilice
      await page.waitForLoadState('networkidle')
      
      // Esperar un poco extra para animaciones (Framer Motion)
      await page.waitForTimeout(1000)

      // Verificar que el body sea visible
      await expect(page.locator('body')).toBeVisible()

      // Tomar una captura de pantalla (sin comparar si es la primera vez, 
      // o comparando si ya existen snapshots)
      await expect(page).toHaveScreenshot({
        fullPage: true,
        maxDiffPixelRatio: 0.1,
        animations: 'disabled',
      })
    })
  }
})
