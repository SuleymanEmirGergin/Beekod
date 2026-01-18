import { test, expect } from '@playwright/test';

test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    // Console logging for debugging
    page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));
    page.on('pageerror', exception => console.log(`[Browser Error] ${exception}`));

    // Mock Auth Check
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ user: { id: 1, role: 'Admin', email: 'test@test.com' } })
      });
    });

    // Mock Products API
    await page.route('**/api/products', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              _id: 'prod_1',
              barcode: '12345',
              name: 'Test Product A',
              price: 100,
              stock: 50,
              category: 'Electronics',
              currency: 'TRY',
              images: [],
              sku: 'SKU1'
            },
            {
              _id: 'prod_2',
              barcode: '67890',
              name: 'Test Product B',
              price: 200,
              stock: 10,
              category: 'Clothing',
              currency: 'TRY',
              images: [],
              sku: 'SKU2'
            }
          ],
          total: 2
        }),
      });
    });

    // Set Token and User
    await page.addInitScript(() => {
        localStorage.setItem('token', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify({ id: 1, role: 'Admin', email: 'test@test.com', name: 'Test User' }));
    });
  });

  test('should display product list', async ({ page }) => {
    await page.goto('/products');

    // Wait for the table to appear (indicates data loaded or loading finished)
    await page.waitForSelector('table tbody', { timeout: 10000 });

    // Use a more resilient selector
    const productRow = page.locator('tr').filter({ hasText: 'Test Product A' });
    await expect(productRow).toBeVisible({ timeout: 5000 });

    // Check second product
    const productRow2 = page.locator('tr').filter({ hasText: 'Test Product B' });
    await expect(productRow2).toBeVisible();
  });
});
