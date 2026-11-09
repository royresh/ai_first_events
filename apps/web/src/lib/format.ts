// Dates are formatted on the server. Set DISPLAY_TIMEZONE (e.g. Asia/Jerusalem) to change the zone.
const timeZone = process.env.DISPLAY_TIMEZONE ?? 'UTC';

const dateTime = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone,
  timeZoneName: 'short',
});

const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone });

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatDateTime(startIso)} – ${time.format(new Date(endIso))}`;
}

export function spotsLeft(capacity: number, goingCount: number): number {
  return Math.max(0, capacity - goingCount);
}
