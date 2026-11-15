'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { cancelRsvpAction, type CancelRsvpState } from '@/app/rsvps/[token]/cancel/actions';

const initialState: CancelRsvpState = { status: 'idle' };

interface Props {
  token: string;
  eventId: number;
  isPast: boolean;
}

export function CancelRsvpForm({ token, eventId, isPast }: Props) {
  const [state, formAction, pending] = useActionState(
    cancelRsvpAction.bind(null, token),
    initialState,
  );

  if (state.status === 'success') {
    return (
      <div className="space-y-3">
        <p role="status" className="rounded bg-emerald-50 p-4 text-emerald-800">
          {state.message}
        </p>
        <Link href={`/events/${eventId}`} className="text-indigo-700 hover:underline">
          Back to the event
        </Link>
      </div>
    );
  }

  if (isPast) {
    return (
      <p className="rounded bg-slate-100 p-3 text-slate-700">
        This event has already started, so the RSVP can no longer be cancelled.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' && state.message && (
        <p role="alert" className="rounded bg-red-50 p-3 text-red-800">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {pending ? 'Cancelling…' : 'Cancel my RSVP'}
      </button>
    </form>
  );
}
