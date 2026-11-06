import { Badge } from "../../../ui/badge";

export function DetailField({ label, value, icon: Icon, badge }: { label: React.ReactNode; value: React.ReactNode; icon?: any; badge?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />}
        {label}
      </div>
      <div className="text-sm font-medium text-slate-800 dark:text-zinc-200">
        {badge && typeof value === "string" ? (
          <Badge variant="outline" className="font-mono text-xs bg-slate-50 dark:bg-zinc-800">{value}</Badge>
        ) : (
          value || <span className="text-slate-400 dark:text-zinc-500 font-normal">—</span>
        )}
      </div>
    </div>
  );
}
