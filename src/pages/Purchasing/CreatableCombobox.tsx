import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";

interface CreatableComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  options?: string[];
  fetchOptions?: () => Promise<string[]>;
  placeholder?: string;
  addLabelPrefix?: string; // e.g. "Add new vendor"
  entityTypeLabel?: string; // e.g. "Vendor" or "Entity"
  icon?: React.ReactNode;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  name?: string;
}

export function CreatableCombobox({
  value = "",
  onChange,
  options: initialOptions = [],
  fetchOptions,
  placeholder = "Type or select...",
  addLabelPrefix = "Add new",
  entityTypeLabel = "item",
  icon,
  hasError = false,
  disabled = false,
  className = "",
  required = false,
  name,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [optionsList, setOptionsList] = useState<string[]>(initialOptions);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Keep internal query synchronized with external value
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Keep options synchronized when initialOptions changes
  useEffect(() => {
    if (initialOptions.length > 0) {
      setOptionsList((prev) => {
        const merged = Array.from(new Set([...initialOptions, ...prev]));
        return merged;
      });
    }
  }, [initialOptions]);

  // Fetch remote options if loader is provided
  useEffect(() => {
    if (fetchOptions) {
      fetchOptions()
        .then((data) => {
          if (Array.isArray(data)) {
            setOptionsList((prev) => {
              const set = new Set([...prev, ...data]);
              return Array.from(set).filter(Boolean);
            });
          }
        })
        .catch((err) => {
          console.warn("Failed to fetch options for " + entityTypeLabel, err);
        });
    }
  }, [fetchOptions, entityTypeLabel]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return optionsList;
    return optionsList.filter((item) => item.toLowerCase().includes(q));
  }, [optionsList, query]);

  // Check if query is an exact match with any existing option
  const trimmedQuery = query.trim();
  const exactMatchExists = useMemo(() => {
    if (!trimmedQuery) return true;
    return optionsList.some(
      (opt) => opt.trim().toLowerCase() === trimmedQuery.toLowerCase()
    );
  }, [optionsList, trimmedQuery]);

  // Total selectable items in dropdown
  // If exact match does not exist and query is not empty, item 0 is "+ Add new ..."
  const showAddOption = trimmedQuery.length > 0 && !exactMatchExists;
  const totalItemsCount = (showAddOption ? 1 : 0) + filteredOptions.length;

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Non-passive wheel listener on listRef to guarantee smooth scrolling inside modals
  useEffect(() => {
    const el = listRef.current;
    if (!open || !el) return;

    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
      if (el.scrollHeight > el.clientHeight) {
        el.scrollTop += e.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [open, filteredOptions, showAddOption]);

  const selectOption = (val: string) => {
    const cleanVal = val.trim();
    if (!cleanVal) return;
    if (!optionsList.some((o) => o.toLowerCase() === cleanVal.toLowerCase())) {
      setOptionsList((prev) => [cleanVal, ...prev]);
    }
    setQuery(cleanVal);
    onChange(cleanVal);
    setOpen(false);
  };

  const handleAddNew = () => {
    if (!trimmedQuery) return;
    selectOption(trimmedQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < totalItemsCount - 1 ? prev + 1 : 0;
        itemRefs.current.get(next)?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : Math.max(0, totalItemsCount - 1);
        itemRefs.current.get(next)?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showAddOption && highlightedIndex === 0) {
        handleAddNew();
      } else {
        const optionIndex = showAddOption ? highlightedIndex - 1 : highlightedIndex;
        if (filteredOptions[optionIndex]) {
          selectOption(filteredOptions[optionIndex]);
        } else if (showAddOption) {
          handleAddNew();
        } else if (trimmedQuery) {
          selectOption(trimmedQuery);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <Input
          ref={inputRef}
          name={name}
          required={required}
          disabled={disabled}
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onChange(val);
            setHighlightedIndex(0);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`h-9 text-xs font-medium bg-slate-50/50 dark:bg-zinc-800/50 transition-all ${
            icon ? "pl-8" : "pl-3"
          } ${query ? "pr-14" : "pr-8"} ${
            hasError ? "border-red-500 focus-visible:ring-red-500" : ""
          } ${className}`}
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {query && !disabled && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                onChange("");
                inputRef.current?.focus();
              }}
              aria-label="Clear"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setOpen((prev) => !prev);
                inputRef.current?.focus();
              }
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded transition-colors"
          >
            <ChevronsUpDown className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>
      </div>

      {open && (
        <div
          data-radix-scroll-lock-ignore=""
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {/* Header info badge if query is typed */}
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
            <span>
              {query ? (
                <>Searching: <strong className="text-slate-800 dark:text-zinc-200">{query}</strong></>
              ) : (
                <>Known {entityTypeLabel}s</>
              )}
            </span>
            <span className="text-[10px] text-slate-400">
              {filteredOptions.length} available
            </span>
          </div>

          <div
            ref={listRef}
            data-radix-scroll-lock-ignore=""
            tabIndex={-1}
            style={{
              scrollbarWidth: "thin",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
            }}
            className="max-h-56 overflow-y-auto overscroll-contain py-1 text-xs"
          >
            {/* + Add New Option if not exact match */}
            {showAddOption && (
              <button
                ref={(el) => {
                  if (el) itemRefs.current.set(0, el);
                  else itemRefs.current.delete(0);
                }}
                type="button"
                onClick={handleAddNew}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 border-b border-indigo-100 dark:border-indigo-900/40 font-medium transition-colors ${
                  highlightedIndex === 0
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40"
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 truncate">
                  <span>{addLabelPrefix} </span>
                  <span className="font-bold underline decoration-indigo-400 underline-offset-2">
                    "{trimmedQuery}"
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-300 px-1.5 py-0 h-4">
                  New
                </Badge>
              </button>
            )}

            {/* Existing Options */}
            {filteredOptions.map((opt, idx) => {
              const itemGlobalIndex = showAddOption ? idx + 1 : idx;
              const isSelected = value?.trim().toLowerCase() === opt.trim().toLowerCase();
              const isHighlighted = highlightedIndex === itemGlobalIndex;

              return (
                <button
                  key={opt}
                  ref={(el) => {
                    if (el) itemRefs.current.set(itemGlobalIndex, el);
                    else itemRefs.current.delete(itemGlobalIndex);
                  }}
                  type="button"
                  onClick={() => selectOption(opt)}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition-colors ${
                    isHighlighted
                      ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-medium"
                      : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                  } ${isSelected ? "font-semibold text-indigo-600 dark:text-indigo-400" : ""}`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                </button>
              );
            })}

            {/* No matches and no add option */}
            {filteredOptions.length === 0 && !showAddOption && (
              <div className="px-3 py-4 text-center text-slate-400 text-xs">
                No matching {entityTypeLabel.toLowerCase()}s found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
