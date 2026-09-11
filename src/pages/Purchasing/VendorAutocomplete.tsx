import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useKnownVendors } from "@/hooks/usePurchasing";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

interface VendorAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
}

export function VendorAutocomplete({
  value = "",
  onChange,
  placeholder = "Search or enter vendor name...",
  className = "",
  hasError = false,
}: VendorAutocompleteProps) {
  const { data: knownVendors = [] } = useKnownVendors();
  const [query, setQuery] = useState(value);
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
    if (!q) return knownVendors;
    return knownVendors.filter((v) => v.toLowerCase().includes(q));
  }, [query, knownVendors]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            onChange(next);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={cn("pr-8", hasError && "border-red-500", className)}
          maxLength={200}
        />
        <Building2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none opacity-50" />
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 right-0 left-0 mt-1.5 w-full max-h-56 overflow-y-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 text-sm">
          {filtered.map((v) => (
            <div
              key={v}
              className="px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/80 flex items-center justify-between gap-2"
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery(v);
                onChange(v);
                setIsOpen(false);
              }}
            >
              <span className="font-medium text-slate-800 dark:text-zinc-200">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
