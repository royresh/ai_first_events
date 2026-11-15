import { expect, test } from '@playwright/test';
import { MAILPIT_URL, uniqueEmail, waitForEmailTo } from './mailpit';

test('an attendee cancels their RSVP from the link in the confirmation email', async ({ page }) => {
  const email = uniqueEmail('cancel');

  await page.goto('/events/1');
  const going = page.getByTestId('going-count');
  const before = Number((await going.textContent())?.match(/\d+/)?.[0]);

  await page.getByLabel('Name').fill('Changed Mind');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'RSVP' }).click();
  await expect(page.getByRole('status')).toContainText('confirmation email');
  await expect(going).toHaveText(`${before + 1} going`);

  // Follow the cancel link from the email, like a real attendee would.
  const message = await waitForEmailTo(email);
  const res = await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`);
  const { Text } = (await res.json()) as { Text: string };
  const link = Text.match(/https?:\/\/\S+\/rsvps\/[0-9a-f-]{36}\/cancel/)?.[0];
  expect(link, 'cancel link in the confirmation email').toBeTruthy();
  const path = new URL(link!).pathname;

  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'Cancel your RSVP?' })).toBeVisible();
  await expect(page.getByText('Hi Changed Mind')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel my RSVP' }).click();

  await expect(page).toHaveURL(/\/events\/1\?cancelled=1$/);
  await expect(page.getByRole('status')).toContainText('Your RSVP is cancelled');
  await expect(going).toHaveText(`${before} going`);

  // The link only works once.
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'Link not valid' })).toBeVisible();
});
