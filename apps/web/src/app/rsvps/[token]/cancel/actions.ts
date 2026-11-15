'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { postCancelRsvp } from '@/lib/api';

export interface CancelRsvpState {
  status: 'idle' | 'error';
  message?: string;
}

/**
 * Server action behind the "Cancel my RSVP" button. On success it redirects to the event
 * page (which shows a banner): staying here would re-render this page with a now-unknown token.
 */
export async function cancelRsvpAction(token: string): Promise<CancelRsvpState> {
  const result = await postCancelRsvp(token);
  if (!result.ok) return { status: 'error', message: result.error.message };

  revalidatePath(`/events/${result.data.eventId}`);
  revalidatePath('/');
  redirect(`/events/${result.data.eventId}?cancelled=1`);
}
