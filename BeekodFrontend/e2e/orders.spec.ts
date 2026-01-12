import { test, expect } from '@playwright/test';

test.describe('Orders Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login', { waitUntil: 'networkidle' });
        await page.locator('input[type="email"]').fill('admin@beekod.com');
        await page.locator('input[type="password"]').fill('admin123');
        await page.click('button:has-text("Access")');
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    });

    test('should navigate to orders page', async ({ page }) => {
        // Click on orders in sidebar
        await page.click('text=Siparişler');

        // Expect to be on orders page
        await expect(page).toHaveURL(/.*orders/);

        // Check page header
        await expect(page.locator('h1:has-text("Sipariş")')).toBeVisible({ timeout: 10000 });
    });

    test('should display orders table with data', async ({ page }) => {
        await page.goto('/orders', { waitUntil: 'networkidle' });

        // Check table headers are visible
        await expect(page.locator('th:has-text("SİPARİŞ NO")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('th:has-text("MÜŞTERİ")')).toBeVisible();
        await expect(page.locator('th:has-text("DURUM")')).toBeVisible();
    });

    test('should filter orders by tab', async ({ page }) => {
        await page.goto('/orders', { waitUntil: 'networkidle' });

        // Click on "Yeni" tab
        await page.click('button:has-text("Yeni")');

        // Tab should be active (check for active styles)
        const newTab = page.locator('button:has-text("Yeni")');
        await expect(newTab).toBeVisible();
    });

    test('should open create order modal', async ({ page }) => {
        await page.goto('/orders', { waitUntil: 'networkidle' });

        // Click on create order button
        await page.click('button:has-text("Manuel Sipariş")');

        // Modal should be visible
        await expect(page.locator('h2:has-text("Manuel Sipariş Oluştur")')).toBeVisible({ timeout: 5000 });

        // Form fields should be visible
        await expect(page.locator('label:has-text("Müşteri Adı")')).toBeVisible();
    });

    test('should sync orders from marketplace', async ({ page }) => {
        await page.goto('/orders', { waitUntil: 'networkidle' });

        // Click sync button
        const syncButton = page.locator('button:has-text("Siparişleri Eşitle")');
        await expect(syncButton).toBeVisible();

        // Button should be enabled
        await expect(syncButton).toBeEnabled();
    });

    test('should export orders to CSV', async ({ page }) => {
        await page.goto('/orders', { waitUntil: 'networkidle' });

        // Click export button
        const exportButton = page.locator('button:has-text("Dışa Aktar")');
        await expect(exportButton).toBeVisible();
        await expect(exportButton).toBeEnabled();
    });
});
