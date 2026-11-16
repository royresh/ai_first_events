/**
 * Pure iCalendar (RFC 5545) builder for one event: no I/O, easy to unit test.
 */

export interface IcsEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
}

export interface IcsOptions {
  /** Public URL of the event page, written as the VEVENT's URL. */
  url: string;
  /** Becomes DTSTAMP: when this file was generated. */
  now: Date;
}

/** Escapes a TEXT value: backslash, semicolon, comma and newlines (RFC 5545 §3.3.11). */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** UTC date-time in iCalendar's basic format, e.g. 20261118T160000Z. */
export function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * Folds a content line so no physical line is longer than 75 octets (RFC 5545 §3.1).
 * Continuation lines start with a single space. Never splits a multi-byte character.
 */
export function foldIcsLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const char of line) {
    const bytes = Buffer.byteLength(char, 'utf8');
    // The first line holds 75 octets; continuation lines lose one to the leading space.
    const limit = parts.length === 0 ? 75 : 74;
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
    }
    current += char;
    currentBytes += bytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function buildIcs(event: IcsEvent, { url, now }: IcsOptions): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AI First Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@aifirst.events`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(event.startsAt)}`,
    `DTEND:${formatIcsDate(event.endsAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

/** Safe download name: `<event-title>.ics`, without characters that break file names. */
export function icsFileName(title: string): string {
  const cleaned = title
    .replace(/[\\/:*?"<>|\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${cleaned || 'event'}.ics`;
}
