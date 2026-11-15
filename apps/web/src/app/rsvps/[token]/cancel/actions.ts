'use server';

import { revalidatePath } from 'next/cache';
import { postCancelRsvp } from '@/lib/api';

export interface CancelRsvpState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  eventId?: number;
}

/** Server action behind the "Cancel my RSVP" button (wired up with useActionState). */
export async function cancelRsvpAction(token: string): Promise<CancelRsvpState> {
  const result = await postCancelRsvp(token);
  if (!result.ok) return { status: 'error', message: result.error.message };

  revalidatePath(`/events/${result.data.eventId}`);
  revalidatePath('/');
  return {
    status: 'success',
    message: 'Your RSVP is cancelled and your seat has been released.',
    eventId: result.data.eventId,
  };
}
