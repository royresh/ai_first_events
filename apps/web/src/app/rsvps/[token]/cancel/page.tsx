import { CancelRsvpForm } from '@/components/CancelRsvpForm';
import { getRsvpByToken } from '@/lib/api';
import { formatTimeRange } from '@/lib/format';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CancelRsvpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rsvp = await getRsvpByToken(token);

  if (!rsvp) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-bold">Link not valid</h1>
        <p className="text-slate-700">
          This cancel link is invalid, or the RSVP was already cancelled.
        </p>
        <Link href="/" className="text-indigo-700 hover:underline">
          Back to all events
        </Link>
      </div>
    );
  }

  const { attendee, event } = rsvp;
  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold">Cancel your RSVP?</h1>
      <div className="space-y-1">
        <p>
          Hi {attendee.name}, you&apos;re registered for{' '}
          <Link
            href={`/events/${event.id}`}
            className="font-semibold text-indigo-700 hover:underline"
          >
            {event.title}
          </Link>
          .
        </p>
        <p className="text-slate-700">{formatTimeRange(event.startsAt, event.endsAt)}</p>
        <p className="text-slate-700">{event.location}</p>
      </div>
      <CancelRsvpForm token={token} isPast={event.isPast} />
    </div>
  );
}
