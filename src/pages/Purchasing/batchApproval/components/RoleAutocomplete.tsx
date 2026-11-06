import { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

export function RoleAutocomplete({
  value,
  onChange,
  assignments = [],
}: {
  value: string;
  onChange: (val: string) => void;
  assignments?: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Distinct roles configured in Workflow / Role Assignments
  const uniqueRoles = useMemo(() => {
    const rolesMap = new Map<string, any>();
    // Default system workflow roles
    const defaults = ["MANAGER", "DIRECTOR", "VP", "AP", "TREASURY", "PURCHASING", "RECEIVING"];
    defaults.forEach((r) => {
      rolesMap.set(r, { role: r, request_type: "ALL", active: true });
    });

    assignments.forEach((a) => {
      if (a.role) {
        rolesMap.set(a.role.toUpperCase(), a);
      }
    });

    return Array.from(rolesMap.values());
  }, [assignments]);

  const filteredRoles = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    if (!q) return uniqueRoles;
    return uniqueRoles.filter((r) => {
      const roleStr = (r.role || "").toLowerCase();
      const typeStr = (r.request_type || "").toLowerCase();
      return roleStr.includes(q) || typeStr.includes(q);
    });
  }, [uniqueRoles, searchTerm]);

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="e.g. MANAGER, DIRECTOR, VP, AP"
        className="text-sm font-mono"
      />
      {isOpen && filteredRoles.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto p-1 text-sm">
          {filteredRoles.map((item: any) => {
            const roleName = item.role.toUpperCase();
            return (
              <button
                key={roleName}
                type="button"
                className="w-full text-left px-2.5 py-2 rounded hover:bg-accent hover:text-accent-foreground text-xs flex items-center justify-between transition-colors cursor-pointer"
                onClick={() => {
                  onChange(roleName);
                  setSearchTerm(roleName);
                  setIsOpen(false);
                }}
              >
                <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">{roleName}</span>
                <span className="text-[11px] text-muted-foreground bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {item.request_type ? `Type: ${item.request_type}` : "Workflow Assignment"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
