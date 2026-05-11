import { test, expect } from '@playwright/test';

test.describe('Server Streaming RAG', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to server RAG page
    await page.goto('/server-rag');
  });

  test('should render the Server Chat interface', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Server-Side RAG Assistant' })).toBeVisible();
    await expect(page.getByText('Server-Side Processing')).toBeVisible();
    await expect(
      page.getByText('Hello! I am your server-side RAG assistant.', { exact: false })
    ).toBeVisible();
  });

  test('should allow sending a message', async ({ page }) => {
    const input = page.getByPlaceholder('How can I help you today?');
    await expect(input).toBeVisible();

    await input.fill('What is the test document about?');

    // Press enter to submit
    await input.press('Enter');

    // Message should appear in chat
    await expect(page.getByText('What is the test document about?')).toBeVisible();

    // Given the endpoint returns a stream, wait for the AI to respond
    // Playwright test might hit network errors in CI if no backend keys, so we just check for UI interaction
  });
});
