import { getCalendarFile } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Serves the event's .ics file from the web app's own origin. The browser can't reach the API
 * directly (inside Docker it lives at http://api:4000), so Next.js fetches it server-side.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return new Response('Event not found', { status: 404 });
  }

  const file = await getCalendarFile(eventId);
  if (!file) return new Response('Event not found', { status: 404 });

  return new Response(file.body, {
    headers: {
      'content-type': file.contentType,
      'content-disposition': file.contentDisposition,
      'cache-control': 'no-store',
    },
  });
}
