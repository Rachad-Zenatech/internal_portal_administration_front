import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGLCodes } from "@/hooks/usePurchasing";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X, Check } from "lucide-react";
import type { GLCodeOption } from "@/types/chartOfAccount";

interface GLCodeAutocompleteProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function GLCodeAutocomplete({
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "Search GL Code or Account Name...",
}: GLCodeAutocompleteProps) {
  const { data: glCodes = [], isLoading } = useGLCodes();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpward: boolean;
  }>({ top: 0, left: 0, width: 260, openUpward: false });

  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Calculate coordinates relative to viewport for floating portal
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldOpenUp = spaceBelow < 280 && rect.top > spaceBelow;
        setCoords({
          top: shouldOpenUp ? rect.top : rect.bottom,
          left: Math.max(8, Math.min(rect.left, window.innerWidth - 340)),
          width: Math.max(rect.width, 320),
          openUpward: shouldOpenUp,
        });
      };

      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        portalRef.current &&
        !portalRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = glCodes.find(
    (item) => item.account_number === value || item.display_label === value
  );

  const filteredOptions = glCodes.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.account_number.toLowerCase().includes(q) ||
      item.account_name.toLowerCase().includes(q) ||
      item.account_type.toLowerCase().includes(q)
    );
  });

  const handleSelect = (option: GLCodeOption) => {
    onChange(option.account_number);
    setSearch("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Trigger / Input Display */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`flex items-center justify-between min-h-[38px] px-3 py-1.5 rounded-md border text-sm transition-colors cursor-pointer bg-background ${
          isOpen
            ? "border-primary ring-1 ring-primary/30"
            : "border-input hover:border-slate-400 dark:hover:border-zinc-600"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-muted" : ""}`}
      >
        {selectedOption ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-semibold text-slate-800 dark:text-zinc-100 font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shrink-0">
              {selectedOption.account_number}
            </span>
            <span className="truncate text-slate-700 dark:text-zinc-200 font-medium">
              {selectedOption.account_name}
            </span>
            {selectedOption.account_type && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal shrink-0 text-slate-500">
                {selectedOption.account_type}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e as any);
                }
              }}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Floating Portal Dropdown rendered outside tables on top of everything */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={portalRef}
          style={{
            position: "fixed",
            top: coords.openUpward ? "auto" : `${coords.top + 4}px`,
            bottom: coords.openUpward ? `${window.innerHeight - coords.top + 4}px` : "auto",
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxWidth: "480px",
            zIndex: 99999,
          }}
          className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50">
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by code, name, or type..."
              className="h-8 text-xs bg-background"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div
            ref={listRef}
            onWheel={(e) => e.stopPropagation()}
            style={{ overscrollBehavior: "contain" }}
            className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-zinc-800/60"
          >
            {isLoading ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Loading GL codes...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No GL codes match "{search}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.account_number;
                return (
                  <div
                    key={opt.account_number}
                    onClick={() => handleSelect(opt)}
                    className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border text-slate-900 dark:text-zinc-100 shrink-0">
                        {opt.account_number}
                      </span>
                      <span className="truncate">{opt.account_name}</span>
                      {opt.account_type && (
                        <span className="text-[10px] text-muted-foreground shrink-0 italic">
                          ({opt.account_type})
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default GLCodeAutocomplete;
