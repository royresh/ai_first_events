import { expect, test } from '@playwright/test';

test('lists upcoming events and opens one', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Upcoming events' })).toBeVisible();

  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toContainText('Intro to AI Coding Agents');
  await expect(cards.first()).toContainText('Main Hall, Tel Aviv');
  await expect(cards.first().getByTestId('going-count')).toHaveText('3 going');

  // The past event is not listed.
  await expect(page.getByText('AI First Kickoff Meetup')).toHaveCount(0);

  await page.getByRole('link', { name: /Prompt Engineering Lab/ }).click();
  await expect(page).toHaveURL(/\/events\/\d+$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Prompt Engineering Lab' }),
  ).toBeVisible();
  await expect(page.getByText('Practical patterns for writing prompts')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Attendees' })).toContainText('Noa Shapiro');
});

test('admin page lists all events with RSVP counts', async ({ page }) => {
  await page.goto('/admin');
  const rows = page.getByRole('row');
  await expect(rows).toHaveCount(6); // header + 5 events, past included
  await expect(page.getByRole('row', { name: /RAG Deep Dive/ })).toContainText('3 / 3');
  await expect(page.getByRole('row', { name: /AI First Kickoff Meetup/ })).toContainText('Past');
});
