import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API response for login
    await page.route('*/**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id: 1,
            email: 'test@beekod.com',
            name: 'Test User',
            role: 'Admin'
          }
        }),
      });
    });

    // Mock dashboard call which happens after login
    await page.route('*/**/api/dashboard*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stats: { orders: 10, revenue: 1000 },
          chartData: [],
          topProducts: [],
          marketplaceOrders: []
        }),
      });
    });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill login form - Updated placeholders to match LoginScreen.tsx
    await page.getByPlaceholder('isim@sirket.com').fill('test@beekod.com');
    await page.getByPlaceholder('Şifrenizi girin').fill('password123');

    // Click login button
    await page.getByRole('button', { name: /giriş yap/i }).click();

    // Verify redirection to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Check for dashboard content (DashboardScreenNew.tsx likely has headers)
    // Assuming "Özet" or "Dashboard" text exists
    // Let's just check URL for now as content might vary
  });
});
