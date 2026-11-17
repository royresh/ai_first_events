import { AttendeeList } from '@/components/AttendeeList';
import { Badge } from '@/components/Badge';
import { RsvpForm } from '@/components/RsvpForm';
import { getEvent } from '@/lib/api';
import { formatTimeRange, spotsLeft } from '@/lib/format';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) notFound();

  const event = await getEvent(eventId);
  if (!event) notFound();

  return (
    <article className="space-y-8">
      <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
        ← All events
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          {event.isPast ? (
            <Badge tone="gray">Past</Badge>
          ) : event.isFull ? (
            <Badge tone="red">Full</Badge>
          ) : null}
        </div>
        <p className="text-slate-700">{formatTimeRange(event.startsAt, event.endsAt)}</p>
        <p className="text-slate-700">{event.location}</p>
      </header>

      <p className="whitespace-pre-line leading-relaxed">{event.description}</p>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            <span data-testid="going-count">{`${event.goingCount} going`}</span>
            <span className="ml-2 text-base font-normal text-slate-600">
              · capacity {event.capacity}
              {!event.isPast &&
                !event.isFull &&
                ` · ${spotsLeft(event.capacity, event.goingCount)} spots left`}
            </span>
          </h2>
          <AttendeeList attendees={event.attendees} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-xl font-semibold">RSVP</h2>
          <RsvpForm eventId={event.id} isFull={event.isFull} isPast={event.isPast} />
        </div>
      </section>
    </article>
  );
}
