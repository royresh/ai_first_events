import { expect, test } from '@playwright/test';

test('attendees on an event page can be searched', async ({ page }) => {
  await page.goto('/events/1');
  const list = page.getByRole('list', { name: 'Attendees' });
  await expect(list.getByRole('listitem')).toHaveCount(3);

  await page.getByLabel('Search attendees').fill('omar');
  await expect(list.getByRole('listitem')).toHaveCount(1);
  await expect(list).toContainText('Omar Haddad');

  await page.getByLabel('Search attendees').fill('nobody');
  await expect(page.getByText('No attendees match.')).toBeVisible();
});

test('the public event page never sends attendee emails to the browser', async ({ request }) => {
  const html = await (await request.get('/events/1')).text();
  expect(html).toContain('Dana Levi');
  expect(html).not.toMatch(/@example\.com/);
});
