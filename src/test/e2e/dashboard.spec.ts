import { test, expect } from '@playwright/test';

test.describe('Semantic Search Dashboard (Local RAG)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should render both Ingest and Chat panels', async ({ page }) => {
    await expect(page.getByText('Local Ingest')).toBeVisible();
    await expect(page.getByText('Local Chat (RAG)')).toBeVisible();
    await expect(page.getByText('100% Local Inference')).toBeVisible();
  });

  test('should support text ingestion via text area', async ({ page }) => {
    const textarea = page.getByPlaceholder('Paste your text here to index it locally...');
    await expect(textarea).toBeVisible();

    // The ingest button should be disabled initially or when text is empty
    const ingestButton = page.getByRole('button', { name: 'Ingest Text' });

    // Sometimes it's disabled while embedding worker loads, so wait for it to become enabled
    // We fill the text first
    await textarea.fill('This is a test document for local RAG indexing.');

    // In a real E2E environment without WebGPU, the embedding worker (WASM) might still work
    // So we can wait for the button to be enabled (or we can just skip clicking if it's too slow in CI)
    await expect(ingestButton).not.toBeDisabled({ timeout: 15000 });

    await ingestButton.click();

    // Should show success message
    await expect(page.getByText(/Successfully ingested/)).toBeVisible({ timeout: 15000 });
  });

  test('should handle WebGPU compatibility gracefully', async ({ page }) => {
    // In CI/headless environments, WebGPU is typically not supported.
    // The LocalChat component checks for this and shows an error if initialization fails.

    // Give it some time to attempt initialization
    await expect(page.getByText('WebGPU Not Supported', { exact: false })).toBeVisible({
      timeout: 15000,
    });
  });
});
