import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/usePurchasing";
import { cn } from "@/lib/utils";
import { FolderKanban, Plus, X, Check } from "lucide-react";

interface ProjectAutocompleteProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
  disabled?: boolean;
}

export function ProjectAutocomplete({
  value = "",
  onChange,
  placeholder = "Select or type project name (e.g. Drone Project)...",
  className = "",
  hasError = false,
  disabled = false,
}: ProjectAutocompleteProps) {
  const { data: knownProjects = [] } = useProjects();
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return knownProjects;
    return knownProjects.filter((p) => p.toLowerCase().includes(q));
  }, [query, knownProjects]);

  const showCreateOption = useMemo(() => {
    const trimmed = (query || "").trim();
    if (!trimmed) return false;
    return !knownProjects.some((p) => p.toLowerCase() === trimmed.toLowerCase());
  }, [query, knownProjects]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <FolderKanban className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-500 pointer-events-none" />
        <Input
          value={query}
          disabled={disabled}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            onChange(next);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={cn(
            "pl-8 pr-8 h-9 text-xs bg-white dark:bg-zinc-900",
            hasError && "border-red-500",
            className
          )}
          maxLength={200}
        />
        {query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            onClick={() => {
              setQuery("");
              onChange("");
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        ) : null}
      </div>

      {isOpen && (
        <div className="absolute z-50 right-0 left-0 mt-1.5 w-full max-h-56 overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 text-xs">
          {showCreateOption && (
            <div
              className="px-3 py-2 cursor-pointer bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-medium"
              onMouseDown={(e) => {
                e.preventDefault();
                const trimmed = query.trim();
                setQuery(trimmed);
                onChange(trimmed);
                setIsOpen(false);
              }}
            >
              <Plus className="h-3.5 w-3.5 text-indigo-600" />
              <span>Add to project &quot;<strong>{query.trim()}</strong>&quot;</span>
            </div>
          )}

          {filtered.map((proj) => {
            const isSelected = (value || "").toLowerCase().trim() === proj.toLowerCase().trim();
            return (
              <div
                key={proj}
                className={cn(
                  "px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/80 flex items-center justify-between gap-2 transition-colors",
                  isSelected && "bg-slate-100 dark:bg-zinc-800 font-semibold text-indigo-600 dark:text-indigo-400"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(proj);
                  onChange(proj);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-800 dark:text-zinc-200">{proj}</span>
                </div>
                {isSelected && <Check className="h-3 w-3 text-indigo-600" />}
              </div>
            );
          })}

          {!showCreateOption && filtered.length === 0 && (
            <div className="px-3 py-3 text-center text-slate-400 text-[11px]">
              No matching projects found. Type to add a new project.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
