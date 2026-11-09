'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h1 className="mb-2 text-lg font-semibold text-red-800">Something went wrong</h1>
      <p className="mb-4 text-red-700">
        We could not load this page. Is the API running on port 4000?
      </p>
      <button onClick={reset} className="rounded bg-red-700 px-4 py-2 text-white hover:bg-red-800">
        Try again
      </button>
    </div>
  );
}
