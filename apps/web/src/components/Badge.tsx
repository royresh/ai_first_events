const tones = {
  red: 'bg-red-100 text-red-800',
  green: 'bg-emerald-100 text-emerald-800',
  gray: 'bg-slate-200 text-slate-700',
  indigo: 'bg-indigo-100 text-indigo-800',
} as const;

export function Badge({ tone, children }: { tone: keyof typeof tones; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
