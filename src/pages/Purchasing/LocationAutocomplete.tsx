import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Check, ChevronDown, X } from "lucide-react";
import { SHIPPED_TO_LOCATIONS } from "./purchasingMeta";

interface LocationAutocompleteProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
}

export default function LocationAutocomplete({
  value = "",
  onChange,
  disabled = false,
  required = false,
  className = "",
  placeholder = "Search or enter location (e.g. Vancouver, BC)...",
  label,
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const inputValue = value || "";

  // Filter locations based on input
  const filteredLocations = useMemo(() => {
    const q = inputValue.toLowerCase().trim();
    if (!q) return SHIPPED_TO_LOCATIONS;
    return SHIPPED_TO_LOCATIONS.filter((loc) => loc.toLowerCase().includes(q));
  }, [inputValue]);

  // Determine whether to open upward or downward
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 260 && rect.top > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']");
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (locName: string) => {
    onChange(locName);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredLocations.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredLocations.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredLocations[highlightedIndex]) {
        handleSelect(filteredLocations[highlightedIndex]);
      } else if (filteredLocations.length > 0 && inputValue.trim()) {
        const exact = filteredLocations.find(
          (l) => l.toLowerCase() === inputValue.toLowerCase().trim()
        );
        if (exact) {
          handleSelect(exact);
        } else {
          setIsOpen(false);
        }
      } else {
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Helper to highlight matching text in search results
  const renderHighlightedName = (name: string, query: string) => {
    if (!query.trim()) return name;
    const q = query.trim();
    const index = name.toLowerCase().indexOf(q.toLowerCase());
    if (index === -1) return name;
    return (
      <>
        {name.substring(0, index)}
        <span className="bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 font-bold px-0.5 rounded">
          {name.substring(index, index + q.length)}
        </span>
        {name.substring(index + q.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium flex items-center justify-between">
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          {inputValue && (
            <span className="text-[11px] text-muted-foreground font-normal">
              {SHIPPED_TO_LOCATIONS.some((l) => l.toLowerCase() === inputValue.toLowerCase())
                ? "Standard Location"
                : "Custom Location"}
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <Input
          value={inputValue}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full pr-14 text-sm font-medium"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setIsOpen(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Clear location"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div
            ref={listRef}
            className={`absolute z-50 left-0 right-0 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
              openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
          >
            {/* Header info */}
            <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="h-3.5 w-3.5 text-sky-600" />
                Locations
              </span>
              <span className="text-[11px] font-mono">
                {`${filteredLocations.length} matching`}
              </span>
            </div>

            {/* List */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 dark:divide-zinc-800/50 py-1">
              {filteredLocations.map((loc, index) => {
                const isSelected =
                  loc.toLowerCase() === inputValue.toLowerCase();
                const isHighlighted = highlightedIndex === index;

                return (
                  <div
                    key={loc}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(loc);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between text-sm transition-colors ${
                      isHighlighted
                        ? "bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100"
                        : isSelected
                        ? "bg-slate-50 dark:bg-zinc-800 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-800 dark:text-zinc-200"
                    }`}
                  >
                    <span className="truncate">
                      {renderHighlightedName(loc, inputValue)}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-sky-600 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })}

              {filteredLocations.length === 0 && (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  <p>No matching locations.</p>
                  {inputValue.trim() && (
                    <p className="mt-1 text-slate-700 dark:text-zinc-300 font-medium">
                      Press enter to use custom &quot;{inputValue}&quot;
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
