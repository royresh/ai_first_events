import { expect, test } from '@playwright/test';
import { uniqueEmail } from './mailpit';

test('RSVP successfully and see the count change', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Shipping LLM Features Safely/ }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Shipping LLM Features Safely' }),
  ).toBeVisible();

  const count = page.getByTestId('going-count');
  const before = Number((await count.textContent())?.match(/\d+/)?.[0]);

  await page.getByLabel('Name').fill('Playwright Tester');
  await page.getByLabel('Email').fill(uniqueEmail('rsvp'));
  await page.getByRole('button', { name: 'RSVP' }).click();

  await expect(page.getByRole('status')).toContainText("You're going, Playwright Tester!");
  await expect(count).toHaveText(`${before + 1} going`);
  await expect(page.getByRole('list', { name: 'Attendees' })).toContainText('Playwright Tester');

  // The list page shows the new count too.
  await page.getByRole('link', { name: '← All events' }).click();
  await expect(
    page.getByRole('article', { name: 'Shipping LLM Features Safely' }).getByTestId('going-count'),
  ).toHaveText(`${before + 1} going`);
});

test('a duplicate email (any casing) shows a clear error', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Intro to AI Coding Agents/ }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Intro to AI Coding Agents' }),
  ).toBeVisible();

  await page.getByLabel('Name').fill('Dana Again');
  await page.getByLabel('Email').fill('DANA@example.com');
  await page.getByRole('button', { name: 'RSVP' }).click();

  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'This email is already registered for this event.',
  );
  await expect(page.getByLabel('Email')).toHaveValue('DANA@example.com');
  await expect(page.getByTestId('going-count')).toHaveText('3 going');
});

test('invalid input shows field errors', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Intro to AI Coding Agents/ }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Intro to AI Coding Agents' }),
  ).toBeVisible();
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByRole('button', { name: 'RSVP' }).click();

  await expect(page.getByText('Name is required')).toBeVisible();
  await expect(page.getByText('Enter a valid email address')).toBeVisible();
});
