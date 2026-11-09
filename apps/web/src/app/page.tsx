import { EventCard } from '@/components/EventCard';
import { listEvents } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await listEvents();

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Upcoming events</h1>
      {events.length === 0 ? (
        <p className="text-slate-600">No upcoming events yet. Check back soon.</p>
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
