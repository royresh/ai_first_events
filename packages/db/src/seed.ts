import { sql } from 'drizzle-orm';
import { createDb, type Db } from './client';
import { attendees, events, type NewEventRow } from './schema';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Returns a Date `days` from now at the given UTC hour, so seed data never goes stale. */
function daysFromNow(now: Date, days: number, hourUtc: number): Date {
  const d = new Date(now.getTime() + days * DAY);
  d.setUTCHours(hourUtc, 0, 0, 0);
  return d;
}

interface SeedEvent extends Omit<NewEventRow, 'id' | 'createdAt'> {
  attendees: { name: string; email: string }[];
}

export function buildSeedEvents(now: Date = new Date()): SeedEvent[] {
  const at = (days: number, hourUtc: number, hours: number) => {
    const startsAt = daysFromNow(now, days, hourUtc);
    return { startsAt, endsAt: new Date(startsAt.getTime() + hours * HOUR) };
  };

  return [
    {
      title: 'Intro to AI Coding Agents',
      description:
        'A friendly, hands-on introduction to pairing with AI coding agents. Bring a laptop; we will set up an agent, give it a real task, and review what it produced.',
      location: 'Main Hall, Tel Aviv',
      capacity: 40,
      ...at(3, 16, 2),
      attendees: [
        { name: 'Dana Levi', email: 'dana@example.com' },
        { name: 'Omar Haddad', email: 'omar@example.com' },
        { name: 'Maya Cohen', email: 'maya@example.com' },
      ],
    },
    {
      title: 'Prompt Engineering Lab',
      description:
        'Practical patterns for writing prompts that hold up in production: structure, examples, evaluation, and iteration.',
      location: 'Room 2B, Haifa',
      capacity: 25,
      ...at(7, 15, 3),
      attendees: [{ name: 'Noa Shapiro', email: 'noa@example.com' }],
    },
    {
      title: 'RAG Deep Dive',
      description:
        'Retrieval-augmented generation end to end: chunking, embeddings, vector search, re-ranking, and measuring answer quality.',
      location: 'Online (Zoom)',
      capacity: 3,
      ...at(10, 17, 2),
      attendees: [
        { name: 'Avi Mizrahi', email: 'avi@example.com' },
        { name: 'Lior Ben-David', email: 'lior@example.com' },
        { name: 'Yael Friedman', email: 'yael@example.com' },
      ],
    },
    {
      title: 'Shipping LLM Features Safely',
      description:
        'Guardrails, evals, observability and rollout strategies for putting LLM-powered features in front of real users.',
      location: 'Auditorium, Jerusalem',
      capacity: 60,
      ...at(14, 14, 2),
      attendees: [],
    },
    {
      title: 'AI First Kickoff Meetup',
      description: 'The meetup that started it all: lightning talks and pizza.',
      location: 'Main Hall, Tel Aviv',
      capacity: 50,
      ...at(-7, 17, 3),
      attendees: [
        { name: 'Dana Levi', email: 'dana@example.com' },
        { name: 'Ron Katz', email: 'ron@example.com' },
      ],
    },
  ];
}

/** Insert seed data. With `reset`, wipes events and attendees first (ids restart at 1). */
export async function seed(db: Db, { reset = false, now = new Date() } = {}): Promise<void> {
  await db.transaction(async (tx) => {
    if (reset) {
      await tx.execute(sql`TRUNCATE ${attendees}, ${events} RESTART IDENTITY CASCADE`);
    }
    for (const { attendees: people, ...event } of buildSeedEvents(now)) {
      const [row] = await tx.insert(events).values(event).returning({ id: events.id });
      if (row && people.length > 0) {
        await tx.insert(attendees).values(people.map((p) => ({ ...p, eventId: row.id })));
      }
    }
  });
}

/** Seed only when there are no events yet. Returns true if it seeded. */
export async function seedIfEmpty(db: Db): Promise<boolean> {
  const result = await db.execute<{ count: string }>(
    sql`SELECT count(*)::text AS count FROM events`,
  );
  if (Number(result.rows[0]?.count ?? 0) > 0) return false;
  await seed(db);
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Usage: tsx src/seed.ts            add seed data
  //        tsx src/seed.ts --reset    wipe events/attendees, then seed
  //        tsx src/seed.ts --if-empty seed only if there are no events
  const reset = process.argv.includes('--reset');
  const ifEmpty = process.argv.includes('--if-empty');
  const handle = createDb();
  const run = ifEmpty
    ? seedIfEmpty(handle.db).then((did) =>
        console.log(did ? '[db] seeded' : '[db] data present, not seeding'),
      )
    : seed(handle.db, { reset }).then(() =>
        console.log(`[db] seeded${reset ? ' (after reset)' : ''}`),
      );
  run
    .catch((err: unknown) => {
      console.error('[db] seed failed', err);
      process.exitCode = 1;
    })
    .finally(() => handle.close());
}
