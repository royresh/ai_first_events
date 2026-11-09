import { expect, test } from '@playwright/test';
import { MAILPIT_URL, uniqueEmail, waitForEmailTo } from './mailpit';

test('RSVP sends a confirmation email that arrives in Mailpit', async ({ page }) => {
  const email = uniqueEmail('mail');

  await page.goto('/');
  await page.getByRole('link', { name: /Prompt Engineering Lab/ }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Prompt Engineering Lab' }),
  ).toBeVisible();
  await page.getByLabel('Name').fill('Mail Checker');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'RSVP' }).click();
  await expect(page.getByRole('status')).toContainText('confirmation email');

  const message = await waitForEmailTo(email);
  expect(message.Subject).toBe("You're going to Prompt Engineering Lab");
  expect(message.To[0]).toMatchObject({ Name: 'Mail Checker', Address: email });

  const full = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)).json()) as {
    Text: string;
  };
  expect(full.Text).toContain('Room 2B, Haifa');
});
