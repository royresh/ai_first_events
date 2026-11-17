import { expect, test } from '@playwright/test';

test('visitors can search upcoming events by title', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Search events').fill('prompt');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page).toHaveURL(/\?q=prompt$/);
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('article')).toContainText('Prompt Engineering Lab');
});
