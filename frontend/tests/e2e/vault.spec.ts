import { expect, test } from "@playwright/test";

test.describe("Vault Page — Smoke Tests", () => {
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
            avatar_url: null,
          }),
        });
      } else if (url.includes("/api/users/username/josue")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            username: "josue",
            avatar_url: "https://images.unsplash.com/photo-1628070435838-19eb835ad70d?w=200&q=80",
            bio: "Amante de Tarkovsky y el cine negro.",
          }),
        });
      } else if (url.includes("/api/vault/social/mine") || url.includes("/api/vault/social/user/1")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            page: 1,
            limit: 24,
            total: 3,
            has_more: false,
            items: [
              {
                id: 1,
                user_id: 1,
                movie_id: null,
                tmdb_id: null,
                entry_type: "edit",
                card_type: "video",
                title: "Mulholland Dr. — La lógica del sueño",
                content: "Un análisis de la estructura del sueño en el cine de Lynch.",
                cover_url: "https://images.unsplash.com/photo-1706460400799-bd339797d306?w=800&q=80",
                duration_label: "18 min",
                likes_count: 12,
                comments_count: 3,
                is_public: true,
                created_at: "2026-05-27T12:00:00Z",
                updated_at: "2026-05-27T12:00:00Z",
                movie_info: {
                  title: "Mulholland Drive",
                  poster_path: null,
                },
              },
              {
                id: 2,
                user_id: 1,
                movie_id: 101,
                tmdb_id: 539,
                entry_type: "reflexion",
                card_type: "review",
                title: "Reseña de Psicosis",
                content: "Hitchcock redefine el suspense moderno en esta obra maestra.",
                cover_url: null,
                duration_label: null,
                likes_count: 5,
                comments_count: 0,
                is_public: true,
                created_at: "2026-05-27T12:00:00Z",
                updated_at: "2026-05-27T12:00:00Z",
                movie_info: {
                  title: "Psicosis",
                  poster_path: "/psych_poster.jpg",
                },
              },
            ],
          }),
        });
      } else {
        // Fallback or empty responses
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "Not found" }),
        });
      }
    });

    // Inject mock token for owner tests
    await page.addInitScript(() => {
      localStorage.setItem(
        "token",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxfQ.signature"
      );
    });
  });

  test("vault loads profile details and renders media cards", async ({ page }) => {
    // Navigate to /vault/josue
    await page.goto("/vault/josue");

    // Profile details are visible
    await expect(page.getByText("@josue")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Amante de Tarkovsky y el cine negro.")).toBeVisible();

    // Renders the specific cards
    await expect(page.getByText("Mulholland Dr. — La lógica del sueño")).toBeVisible();
    await expect(page.getByText("Reseña de Psicosis")).toBeVisible();

    // Filters are visible
    await expect(page.getByRole("button", { name: "TODO" })).toBeVisible();
    await expect(page.getByRole("button", { name: "VIDEOS" })).toBeVisible();
    await expect(page.getByRole("button", { name: "RESEÑAS" })).toBeVisible();

    // "Agregar al vault" floating action button is visible since viewer is owner
    await expect(page.getByRole("button", { name: /agregar al vault/i })).toBeVisible();
  });
});
