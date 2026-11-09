'use server';

import { apiErrorMessage, RsvpInputSchema } from '@aifirst/shared';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { postRsvp } from '@/lib/api';

export interface RsvpFormState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Partial<Record<'name' | 'email', string[]>>;
  /** Echo the submitted values so the form keeps them after an error. */
  values?: { name: string; email: string };
}

/** Server action behind the RSVP form (wired up with useActionState). */
export async function rsvpAction(
  eventId: number,
  _prev: RsvpFormState,
  formData: FormData,
): Promise<RsvpFormState> {
  const values = {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
  };

  // Validate here with the shared schema for instant feedback; the API validates again.
  const parsed = RsvpInputSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: 'error',
      message: apiErrorMessage.VALIDATION,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const result = await postRsvp(eventId, parsed.data);
  if (!result.ok) {
    return {
      status: 'error',
      message: result.error.message,
      fieldErrors: result.error.fieldErrors,
      values,
    };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath('/');
  return {
    status: 'success',
    message: `You're going, ${result.data.attendee.name}! A confirmation email is on its way to ${result.data.attendee.email}.`,
  };
}
