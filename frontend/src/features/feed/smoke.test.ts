import { test, expect } from '@playwright/test';

test('Feed page loads and displays content', async ({ page }) => {
  await page.goto('http://localhost:5000/feed');
  
  // Verify the page title
  await expect(page).toHaveTitle(/feed | Cinevault/i);
  
  // Check if cards are rendered (Wait for "Cargando..." to disappear or cards to appear)
  // Since we are in local, we can wait for the 'feed-card' class
  const feedCard = page.locator('.feed-card');
  await expect(feedCard.first()).toBeVisible({ timeout: 10000 });
});
