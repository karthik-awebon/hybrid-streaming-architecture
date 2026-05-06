import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for model to be ready
    await expect(page.locator('text=Model Ready')).toBeVisible({ timeout: 30000 });
  });

  test('should send a message and receive a response', async ({ page }) => {
    const input = page.locator('placeholder=How can I help you today?');
    await input.fill('Hello AI, how are you?');
    await page.click('button[type="submit"]');

    // Check if user message appears
    await expect(page.locator('text=Hello AI, how are you?')).toBeVisible();

    // Check if assistant message appears (looking for the bubble style or text arrival)
    // Since it's streaming, we wait for the message list to grow or a new bubble to appear
    const assistantMessage = page.locator('.bg-slate-50').first();
    await expect(assistantMessage).toBeVisible({ timeout: 60000 });
  });

  test('should show loading state during streaming', async ({ page }) => {
    const input = page.locator('placeholder=How can I help you today?');
    await input.fill('Tell me a long story');
    await page.click('button[type="submit"]');

    // Look for the bounce animation (loading dots)
    await expect(page.locator('.animate-bounce')).toBeVisible();
  });
});
