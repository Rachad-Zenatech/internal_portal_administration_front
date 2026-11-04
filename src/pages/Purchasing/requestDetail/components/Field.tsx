export function Field({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1 flex items-center gap-1">{label}</div>
      <div className="text-slate-800 dark:text-zinc-200">{value}</div>
    </div>
  );
}
