import { expect, test } from "@playwright/test";

/**
 * Smoke tests para la refactorización de Settings.
 * Verifican que el shell de la página carga y que las pestañas de navegación
 * funcionan correctamente, independientemente del flujo de auth real.
 * Los tests de datos cargados pertenecen a la suite de integración con DB de pruebas.
 */
test.describe("Settings Page — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept all API calls to avoid hitting the real backend
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/api/auth/refresh")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ accessToken: "mock-access-token" }),
        });
      } else if (url.includes("/api/auth/verify")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            username: "josue",
            two_factor_enabled: false,
            avatar_url: null,
          }),
        });
      } else if (url.includes("/api/users")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: 1,
              username: "josue",
              email: "josue@cinevault.com",
              bio: "Amante del cine negro.",
              avatar_url: null,
            },
          ]),
        });
      } else if (url.includes("/api/auth/sessions")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sessions: [
              {
                id: "sess-1",
                user_agent: "Mozilla/5.0 Chrome/120.0",
                ip_address: "127.0.0.1",
                created_at: "2026-05-27T12:00:00Z",
              },
            ],
          }),
        });
      } else {
        // Pass through everything else
        await route.continue();
      }
    });

    // Inject mock token after all routes are set
    await page.addInitScript(() => {
      localStorage.setItem(
        "token",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxfQ.signature"
      );
    });
  });

  test("page shell renders and section tabs are interactive", async ({ page }) => {
    await page.goto("/settings");

    // Either loading shows first, or the page loads directly
    // Wait up to 10s for the main heading to appear (post-load)
    await expect(page.getByRole("heading", { name: "Editar perfil" })).toBeVisible({ timeout: 10000 });

    // Tab navigation buttons are visible
    await expect(page.getByRole("button", { name: "Perfil" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Seguridad" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cuenta" })).toBeVisible();

    // "Guardar cambios" floating bar is visible
    await expect(page.getByRole("button", { name: /guardar cambios/i })).toBeVisible();

    // Switch to Seguridad section
    await page.getByRole("button", { name: "Seguridad" }).click();
    await expect(page.getByRole("heading", { name: "Autenticación en 2 pasos" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Contraseña" })).toBeVisible();

    // Switch to Cuenta section
    await page.getByRole("button", { name: "Cuenta" }).click();
    await expect(page.getByRole("heading", { name: "Eliminar cuenta" })).toBeVisible();

    // Switch back to Perfil
    await page.getByRole("button", { name: "Perfil" }).click();
    await expect(page.locator("section .uploadLabel, section label").first()).toBeVisible();
  });
});
