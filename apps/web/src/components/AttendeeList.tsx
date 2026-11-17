'use client';

import type { AdminAttendee } from '@aifirst/shared';
import { useState } from 'react';

export function AttendeeList({ attendees }: { attendees: AdminAttendee[] }) {
  const [query, setQuery] = useState('');

  if (attendees.length === 0) {
    return <p className="text-slate-600">No one yet. Be the first!</p>;
  }

  const q = query.trim().toLowerCase();
  const shown = q
    ? attendees.filter((a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
    : attendees;

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search attendees by name or email"
        aria-label="Search attendees"
        className="w-full rounded border border-slate-300 px-3 py-2"
      />
      {shown.length === 0 ? (
        <p className="text-slate-600">No attendees match.</p>
      ) : (
        <ul
          aria-label="Attendees"
          className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white"
        >
          {shown.map((a) => (
            <li key={a.id} className="px-4 py-2">
              {a.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
