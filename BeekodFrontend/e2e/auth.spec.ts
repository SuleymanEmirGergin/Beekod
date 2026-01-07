import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
        // Go to the login page
        await page.goto('/login', { waitUntil: 'networkidle' });

        // Debug: Log the page content if it fails later
        // console.log(await page.content());

        // Use type selectors which are more robust
        await page.locator('input[type="email"]').fill('admin@beekod.com');
        await page.locator('input[type="password"]').fill('admin123');

        // Click the submit button - using role or text
        await page.click('button:has-text("Access")');

        // Expect to be redirected to the dashboard (wait longer)
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

        // Check if the daily insight widget is visible
        const insightWidget = page.locator('text=Analiz');
        await expect(insightWidget).toBeVisible({ timeout: 15000 });
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'networkidle' });
        await page.locator('input[type="email"]').fill('wrong@beekod.com');
        await page.locator('input[type="password"]').fill('badpass');
        await page.click('button:has-text("Access")');

        // Expect error message
        // The error message is in a div with text
        const errorMsg = page.locator('.text-red-600');
        await expect(errorMsg).toBeVisible({ timeout: 10000 });
    });
});
