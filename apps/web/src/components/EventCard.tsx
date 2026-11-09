import type { EventSummary } from '@aifirst/shared';
import Link from 'next/link';
import { formatDateTime } from '@/lib/format';
import { Badge } from './Badge';

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="block h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow"
    >
      <article aria-label={event.title} className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold">{event.title}</h2>
          {event.isFull && <Badge tone="red">Full</Badge>}
        </div>
        <p className="text-sm text-slate-700">{formatDateTime(event.startsAt)}</p>
        <p className="text-sm text-slate-700">{event.location}</p>
        <p className="text-sm font-medium text-indigo-700" data-testid="going-count">
          {`${event.goingCount} going`}
        </p>
      </article>
    </Link>
  );
}
