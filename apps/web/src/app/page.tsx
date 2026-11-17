import { EventCard } from '@/components/EventCard';
import { listEvents } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const events = await listEvents(q);

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Upcoming events</h1>
      <form role="search" className="mb-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search events"
          aria-label="Search events"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
        >
          Search
        </button>
      </form>
      {events.length === 0 ? (
        <p className="text-slate-600">
          {q ? `No events match "${q}".` : 'No upcoming events yet. Check back soon.'}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
