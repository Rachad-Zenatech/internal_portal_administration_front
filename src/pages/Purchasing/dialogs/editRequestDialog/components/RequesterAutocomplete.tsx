import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { resolveUserDepartment } from "@/lib/userDepartment";
import { useRef } from "react";

export function RequesterAutocomplete({
  value,
  onChange,
  onSelectUser,
  users = [],
  roles = [],
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectUser?: (user: any) => void;
  users: any[];
  roles?: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = useMemo(() => {
    const activeUsers = users.filter((u) => u.is_active !== false);
    const q = (value || "").toLowerCase().trim();
    if (!q) return activeUsers.slice(0, 10);
    return activeUsers
      .filter((u) => {
        const name = (u.full_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const dept = resolveUserDepartment(u, roles).toLowerCase();
        return name.includes(q) || email.includes(q) || dept.includes(q);
      })
      .slice(0, 10);
  }, [value, users, roles]);

  return (
    <div ref={containerRef} className="relative space-y-2">
      <label className="text-sm font-medium">Requester <span className="text-red-500">*</span></label>
      <div className="relative">
        <Input
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search requester (e.g. Rachad, Rachel)..."
          className="w-full"
          required
        />
        {isOpen && filteredUsers.length > 0 && (
          <div className="absolute z-50 left-0 mt-1.5 w-full max-h-60 overflow-y-auto overflow-x-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 text-sm divide-y divide-slate-100 dark:divide-zinc-800/60">
            {filteredUsers.map((u) => {
              const displayName = u.full_name || u.email || "Unknown User";
              const email = u.email;
              const dept = (u.department && u.department.trim() && u.department.toUpperCase() !== "REQUESTER") ? u.department.trim() : resolveUserDepartment(u, roles);

              return (
                <div
                  key={u.id}
                  className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/80 flex flex-col gap-0.5 transition-colors text-left"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(displayName);
                    if (onSelectUser) {
                      onSelectUser(u);
                    }
                    setIsOpen(false);
                  }}
                >
                  <div className="font-semibold text-slate-900 dark:text-zinc-100 text-sm leading-snug">
                    {displayName}
                  </div>
                  {email && (
                    <div className="text-xs text-slate-500 dark:text-zinc-400 truncate leading-snug">
                      {email}
                    </div>
                  )}
                  {dept ? (
                    <div className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                      <span className="text-slate-400 dark:text-zinc-500 font-normal">Dept:</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{dept}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 italic mt-0.5">
                      No department
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
