import { expect, test } from '@playwright/test';

test('RAG Deep Dive is shown as Full and RSVP is disabled', async ({ page }) => {
  await page.goto('/');
  const card = page.getByRole('article', { name: 'RAG Deep Dive' });
  await expect(card.getByText('Full', { exact: true })).toBeVisible();

  await card.click();
  await expect(page.getByRole('heading', { level: 1, name: 'RAG Deep Dive' })).toBeVisible();
  await expect(page.getByTestId('going-count')).toHaveText('3 going');
  await expect(page.getByText('This event is full.')).toBeVisible();

  const button = page.getByRole('button', { name: 'Full' });
  await expect(button).toBeDisabled();
  await expect(page.getByLabel('Name')).toBeDisabled();
  await expect(page.getByLabel('Email')).toBeDisabled();
});
