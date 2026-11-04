/** Rich Level 1 Approver Pill without vertical clipping */
export function ApproverPill({
  name,
  email,
  title,
}: {
  name?: string | null;
  email?: string | null;
  title?: string | null;
}) {
  const displayName = name || email || "User";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/80 shadow-2xs hover:bg-emerald-100/70 dark:hover:bg-emerald-950/60 transition-colors">
      <div className="h-6 w-6 rounded-full bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100 flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs">
        {initials}
      </div>
      <div className="flex flex-col text-left leading-normal min-w-0">
        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
          {displayName}
        </span>
        {title ? (
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate">
            {title}
          </span>
        ) : email ? (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {email}
          </span>
        ) : null}
      </div>
    </div>
  );
}
