import { describe, expect, it } from 'vitest';
import {
  buildIcs,
  escapeIcsText,
  foldIcsLine,
  formatIcsDate,
  icsFileName,
} from '../../src/domain/ics';

const event = {
  id: 7,
  title: 'Agents, Tests; and You',
  description: 'Line one\nLine two, with a comma',
  location: 'Main Hall, Tel Aviv',
  startsAt: new Date('2026-11-18T16:00:00Z'),
  endsAt: new Date('2026-11-18T18:00:00Z'),
};
const opts = { url: 'http://localhost:3000/events/7', now: new Date('2026-11-15T09:30:05.123Z') };

/** Undo line folding so assertions can look at whole content lines. */
const unfold = (ics: string) => ics.replace(/\r\n /g, '').split('\r\n');

describe('escapeIcsText', () => {
  it('escapes backslashes, semicolons, commas and newlines', () => {
    expect(escapeIcsText('a\\b;c,d\ne\r\nf')).toBe('a\\\\b\\;c\\,d\\ne\\nf');
  });
});

describe('formatIcsDate', () => {
  it('writes UTC in basic format without milliseconds', () => {
    expect(formatIcsDate(new Date('2026-11-18T16:00:00.000Z'))).toBe('20261118T160000Z');
  });
});

describe('foldIcsLine', () => {
  it('leaves short lines alone', () => {
    expect(foldIcsLine('SUMMARY:Hi')).toBe('SUMMARY:Hi');
  });

  it('folds long lines at 75 octets with a leading space on continuations', () => {
    const folded = foldIcsLine(`DESCRIPTION:${'x'.repeat(200)}`);
    const physical = folded.split('\r\n');
    expect(physical.length).toBeGreaterThan(1);
    for (const line of physical) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
    expect(physical.slice(1).every((l) => l.startsWith(' '))).toBe(true);
    expect(folded.replace(/\r\n /g, '')).toBe(`DESCRIPTION:${'x'.repeat(200)}`);
  });

  it('never splits a multi-byte character', () => {
    const folded = foldIcsLine(`SUMMARY:${'שלום '.repeat(30)}`);
    for (const line of folded.split('\r\n')) {
      expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
      expect(line).not.toContain('�');
    }
  });
});

describe('buildIcs', () => {
  const ics = buildIcs(event, opts);
  const lines = unfold(ics);

  it('is one VEVENT inside a VCALENDAR, with CRLF line endings', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toContain('VERSION:2.0');
    expect(lines.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1);
    expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  it('has the required fields, dates in UTC', () => {
    expect(lines).toEqual(
      expect.arrayContaining([
        'UID:event-7@aifirst.events',
        'DTSTAMP:20261115T093005Z',
        'DTSTART:20261118T160000Z',
        'DTEND:20261118T180000Z',
        'URL:http://localhost:3000/events/7',
      ]),
    );
  });

  it('escapes text fields', () => {
    expect(lines).toContain('SUMMARY:Agents\\, Tests\\; and You');
    expect(lines).toContain('LOCATION:Main Hall\\, Tel Aviv');
    expect(lines).toContain('DESCRIPTION:Line one\\nLine two\\, with a comma');
  });
});

describe('icsFileName', () => {
  it('uses the title and drops characters that are not allowed in file names', () => {
    expect(icsFileName('RAG Deep Dive')).toBe('RAG Deep Dive.ics');
    expect(icsFileName('Q&A: "Agents" / Tests?')).toBe('Q&A Agents Tests.ics');
    expect(icsFileName('???')).toBe('event.ics');
  });
});
