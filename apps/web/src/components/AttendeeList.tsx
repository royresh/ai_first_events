import type { Attendee } from '@aifirst/shared';

export function AttendeeList({ attendees }: { attendees: Attendee[] }) {
  if (attendees.length === 0) {
    return <p className="text-slate-600">No one yet. Be the first!</p>;
  }
  return (
    <ul
      aria-label="Attendees"
      className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white"
    >
      {attendees.map((a) => (
        <li key={a.id} className="px-4 py-2">
          {a.name}
        </li>
      ))}
    </ul>
  );
}
