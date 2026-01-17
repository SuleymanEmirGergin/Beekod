import { test, expect } from '@playwright/test';

test.describe.skip('Products', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Auth Check
    await page.route('*/**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ user: { id: 1, role: 'Admin', email: 'test@test.com' } })
      });
    });

    // Mock Products API
    await page.route('*/**/api/products', async (route) => {
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

    // Set Token
    await page.addInitScript(() => {
        localStorage.setItem('token', 'mock-jwt-token');
    });
  });

  test('should display product list', async ({ page }) => {
    await page.goto('/products');

    await expect(page.getByText('Test Product A')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Test Product B')).toBeVisible();
  });
});
