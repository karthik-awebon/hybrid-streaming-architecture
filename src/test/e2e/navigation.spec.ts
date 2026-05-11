import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between all pages via the Header menu', async ({ page }) => {
    // Start from the home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Hybrid Streaming RAG/);
    await expect(page.locator('h1')).toContainText('Hybrid RAG');

    // Verify all nav links are present
    const nav = page.locator('nav');
    await expect(nav).toContainText('Home');
    await expect(nav).toContainText('Hybrid RAG');
    await expect(nav).toContainText('Local RAG');
    await expect(nav).toContainText('Server RAG');
    await expect(nav).toContainText('Ingest');

    // Test Navigation to Hybrid RAG
    await page.click('nav >> text=Hybrid RAG');
    await expect(page).toHaveURL(/\/hybrid-rag/);

    // Test Navigation to Local RAG
    await page.click('nav >> text=Local RAG');
    await expect(page).toHaveURL(/\/local-rag/);

    // Test Navigation to Server RAG
    await page.click('nav >> text=Server RAG');
    await expect(page).toHaveURL(/\/server-rag/);

    // Test Navigation to Ingest
    await page.click('nav >> text=Ingest');
    await expect(page).toHaveURL(/\/ingest/);

    // Test Navigation back to Home
    await page.click('nav >> text=Home');
    await expect(page).toHaveURL(/\/$/);
  });
});
