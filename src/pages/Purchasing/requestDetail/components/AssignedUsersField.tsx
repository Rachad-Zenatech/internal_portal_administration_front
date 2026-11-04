import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field } from "./Field";

export function AssignedUsersField({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return <Field label={label} value="—" />;

  const users = value.split(", ").map(u => u.trim()).filter(Boolean);
  const displayedUsers = users.slice(0, 2);
  const hiddenUsers = users.slice(2);

  const chipClass = "inline-flex items-center px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shadow-sm whitespace-nowrap";

  return (
    <div className="flex flex-col">
      <div className="text-xs text-slate-500 dark:text-zinc-400 mb-2">{label}</div>
      <div className="flex flex-wrap items-center gap-2">
        {displayedUsers.map((u, i) => (
          <span key={i} className={chipClass}>{u}</span>
        ))}

        {hiddenUsers.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`${chipClass} hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer focus:outline-none transition-colors`}>
                +{hiddenUsers.length} more... <ChevronDown className="ml-1 h-3.5 w-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 p-4 shadow-lg rounded-xl">
              <div className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-3">
                Additional Users
              </div>
              <div className="flex flex-wrap gap-2">
                {hiddenUsers.map((u, i) => (
                  <span key={i} className={chipClass}>{u}</span>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
