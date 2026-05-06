import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate between chat and ingest pages', async ({ page }) => {
    // Start from the home page (Chat)
    await page.goto('/');
    await expect(page).toHaveTitle(/Hybrid RAG/);
    await expect(page.locator('h1')).toContainText('Hybrid RAG');
    await expect(page.locator('nav')).toContainText('Chat');

    // Click the Ingest link
    await page.click('nav >> text=Ingest');

    // The new URL should be "/ingest"
    await expect(page).toHaveURL(/\/ingest/);
    await expect(page.locator('h2')).toContainText('Ingest Data to Pinecone');

    // Click the Chat link
    await page.click('nav >> text=Chat');

    // The new URL should be "/"
    await expect(page).toHaveURL(/\//);
    await expect(page.locator('h2')).toContainText('Welcome to Hybrid RAG');
  });
});
