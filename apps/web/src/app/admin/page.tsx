import { Badge } from '@/components/Badge';
import { listAdminEvents } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const rows = await listAdminEvents();

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Admin · Events</h1>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Starts</th>
              <th className="px-4 py-3 text-right font-medium">RSVPs</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/events/${row.id}`}
                    className="font-medium text-indigo-700 hover:underline"
                  >
                    {row.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{formatDateTime(row.startsAt)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {row.goingCount} / {row.capacity}
                </td>
                <td className="px-4 py-3">
                  {row.isPast ? (
                    <Badge tone="gray">Past</Badge>
                  ) : row.isFull ? (
                    <Badge tone="red">Full</Badge>
                  ) : (
                    <Badge tone="green">Open</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
