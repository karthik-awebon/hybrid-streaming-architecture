import { test, expect } from '@playwright/test';

test.describe('Ingest Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ingest');
    // Wait for model to be ready
    await expect(page.locator('text=Model Ready')).toBeVisible({ timeout: 30000 });
  });

  test('should ingest text successfully', async ({ page }) => {
    const textarea = page.locator('placeholder=Paste your document or large text here...');
    const ingestText =
      'This is a test document that will be embedded locally and sent to Pinecone.';
    await textarea.fill(ingestText);

    const submitButton = page.locator('text=Process & Ingest');
    await submitButton.click();

    // Verify it shows processing states
    await expect(page.locator('text=/Chunking|Embedding|Uploading/')).toBeVisible();

    // Verify final success message (timeout increased for potential heavy local embedding)
    await expect(page.locator('text=Successfully inserted')).toBeVisible({ timeout: 60000 });

    // Textarea should be cleared
    await expect(textarea).toHaveValue('');
  });

  test('should disable button for empty input', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Process & Ingest")');
    await expect(submitButton).toBeDisabled();

    await page.locator('placeholder=Paste your document').fill('   ');
    await expect(submitButton).toBeDisabled();
  });
});
