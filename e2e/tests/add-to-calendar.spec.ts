import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('downloads the event as an .ics file from the event page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Intro to AI Coding Agents/ }).click();
  await expect(page).toHaveURL(/\/events\/\d+$/);
  const eventUrl = page.url();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Add to calendar' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('Intro to AI Coding Agents.ics');
  expect(await download.failure()).toBeNull();

  const ics = await readFile(await download.path(), 'utf8');
  const lines = ics.replace(/\r\n /g, '').split('\r\n');
  expect(lines).toContain('BEGIN:VEVENT');
  expect(lines).toContain('SUMMARY:Intro to AI Coding Agents');
  expect(lines).toContain('LOCATION:Main Hall\\, Tel Aviv');
  expect(lines).toContain(`URL:${eventUrl}`);
  expect(lines.some((l) => /^DTSTART:\d{8}T\d{6}Z$/.test(l))).toBe(true);

  // The user stays on the event page.
  await expect(page).toHaveURL(eventUrl);
});

test('unknown events have no calendar file', async ({ request }) => {
  const res = await request.get('/events/9999/calendar.ics');
  expect(res.status()).toBe(404);
});
