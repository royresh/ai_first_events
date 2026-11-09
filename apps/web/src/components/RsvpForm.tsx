'use client';

import { useActionState } from 'react';
import { rsvpAction, type RsvpFormState } from '@/app/events/[id]/actions';

const initialState: RsvpFormState = { status: 'idle' };

interface Props {
  eventId: number;
  isFull: boolean;
  isPast: boolean;
}

export function RsvpForm({ eventId, isFull, isPast }: Props) {
  const [state, formAction, pending] = useActionState(rsvpAction.bind(null, eventId), initialState);

  if (state.status === 'success') {
    return (
      <p role="status" className="rounded bg-emerald-50 p-4 text-emerald-800">
        {state.message}
      </p>
    );
  }

  const closedReason = isPast
    ? 'This event has already happened.'
    : isFull
      ? 'This event is full.'
      : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {closedReason && <p className="rounded bg-slate-100 p-3 text-slate-700">{closedReason}</p>}

      <Field
        label="Name"
        name="name"
        type="text"
        autoComplete="name"
        defaultValue={state.values?.name}
        errors={state.fieldErrors?.name}
        disabled={!!closedReason}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
        disabled={!!closedReason}
      />

      {state.status === 'error' && state.message && (
        <p role="alert" className="rounded bg-red-50 p-3 text-red-800">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !!closedReason}
        className="w-full rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
      >
        {isFull && !isPast ? 'Full' : pending ? 'Saving…' : 'RSVP'}
      </button>
    </form>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  defaultValue?: string;
  errors?: string[];
  disabled: boolean;
}

function Field({ label, name, errors, ...input }: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={!!errors?.length}
        aria-describedby={errors?.length ? errorId : undefined}
        className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100 aria-[invalid=true]:border-red-500"
        {...input}
      />
      {errors?.length ? (
        <p id={errorId} className="mt-1 text-sm text-red-700">
          {errors.join(' ')}
        </p>
      ) : null}
    </div>
  );
}
