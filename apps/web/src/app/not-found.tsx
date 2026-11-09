import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center">
      <h1 className="mb-2 text-2xl font-bold">Not found</h1>
      <p className="mb-4 text-slate-600">That event does not exist.</p>
      <Link href="/" className="text-indigo-700 hover:underline">
        Back to all events
      </Link>
    </div>
  );
}
