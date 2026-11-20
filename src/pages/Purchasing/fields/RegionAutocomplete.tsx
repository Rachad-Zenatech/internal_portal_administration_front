import { useState, useRef, useEffect, useMemo, type RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Globe, Check, ChevronDown, X, Plus, Loader2 } from "lucide-react";
import { useMasterLocations, useCreateMasterLocation } from "@/hooks/useMasterTables";
import { cleanAndStandardizeText } from "@/utils/textStandardizer";
import { DEFAULT_REGIONS, isRegionName } from "./locationRegionConstants";

interface RegionAutocompleteProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
}

interface RegionMenuProps {
  listRef: RefObject<HTMLDivElement | null>;
  openUpward: boolean;
  isLoading: boolean;
  filteredRegions: string[];
  inputValue: string;
  highlightedIndex: number;
  canCreateNew: boolean;
  standardizedCandidate: string;
  onSelect: (region: string) => void;
  onCreateNew: (region: string) => void;
  onHighlight: (index: number) => void;
}

function RegionDropdownMenu({
  listRef,
  openUpward,
  isLoading,
  filteredRegions,
  inputValue,
  highlightedIndex,
  canCreateNew,
  standardizedCandidate,
  onSelect,
  onCreateNew,
  onHighlight,
}: RegionMenuProps) {
  return (
    <div
      ref={listRef}
      className={`absolute z-50 left-0 right-0 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
        openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
      }`}
    >
      <div className="px-3 py-2 bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1 font-medium">
          <Globe className="h-3.5 w-3.5 text-sky-600" />
          Region
        </span>
        <span className="text-[11px] font-mono">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : `${filteredRegions.length} records`}
        </span>
      </div>

      <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 dark:divide-zinc-800/50 py-1">
        {filteredRegions.map((reg, index) => {
          const isSelected = reg.toLowerCase() === inputValue.toLowerCase();
          const isHighlighted = highlightedIndex === index;
          return (
            <div
              key={reg}
              role="option"
              aria-selected={isSelected}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(reg);
              }}
              onMouseEnter={() => onHighlight(index)}
              className={`px-3 py-2 cursor-pointer flex items-center justify-between text-sm transition-colors ${
                isHighlighted
                  ? "bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100"
                  : isSelected
                  ? "bg-slate-50 dark:bg-zinc-800 font-semibold"
                  : "hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-800 dark:text-zinc-200"
              }`}
            >
              <span className="truncate">{reg}</span>
              {isSelected && <Check className="h-4 w-4 text-sky-600 shrink-0 ml-2" />}
            </div>
          );
        })}

        {canCreateNew && (
          <div
            role="option"
            aria-selected={false}
            onMouseDown={(e) => {
              e.preventDefault();
              onCreateNew(standardizedCandidate || inputValue);
            }}
            onMouseEnter={() => onHighlight(filteredRegions.length)}
            className={`px-3 py-2.5 cursor-pointer flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30 border-t border-sky-100 dark:border-sky-900/50 hover:bg-sky-50 dark:hover:bg-sky-950/50 font-medium ${
              highlightedIndex === filteredRegions.length ? "bg-sky-100/70 dark:bg-sky-900/50" : ""
            }`}
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="truncate">
              Add new region: <strong>"{standardizedCandidate || inputValue}"</strong>
            </span>
          </div>
        )}

        {filteredRegions.length === 0 && !canCreateNew && (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">No regions found</div>
        )}
      </div>
    </div>
  );
}

export default function RegionAutocomplete({
  value = "",
  onChange,
  disabled = false,
  required = false,
  className = "",
  placeholder = "Select or enter region...",
  label,
}: RegionAutocompleteProps) {
  const { data: locationsData, isLoading } = useMasterLocations();
  const createLocation = useCreateMasterLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const inputValue = value || "";

  const regionItems = useMemo(() => {
    const set = new Set<string>(DEFAULT_REGIONS);
    (locationsData?.items || []).forEach((item) => {
      if (item.is_active && isRegionName(item.name)) {
        set.add(item.name);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [locationsData]);

  const filteredRegions = useMemo(() => {
    const q = inputValue.toLowerCase().trim();
    if (!q) return regionItems;
    return regionItems.filter((reg) => reg.toLowerCase().includes(q));
  }, [regionItems, inputValue]);

  const isExactMatch = useMemo(() => {
    const q = inputValue.toLowerCase().trim();
    if (!q) return false;
    return regionItems.some((reg) => reg.toLowerCase() === q);
  }, [regionItems, inputValue]);

  const standardizedCandidate = useMemo(() => {
    if (!inputValue.trim()) return "";
    return cleanAndStandardizeText(inputValue);
  }, [inputValue]);

  const canCreateNew = inputValue.trim().length > 0 && !isExactMatch;

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 260 && rect.top > spaceBelow);
    }
  }, [isOpen]);

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

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option']");
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (regName: string) => {
    const cleaned = cleanAndStandardizeText(regName);
    onChange(cleaned);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreateNew = async (rawName: string) => {
    const cleaned = cleanAndStandardizeText(rawName);
    if (!cleaned) return;
    onChange(cleaned);
    setIsOpen(false);
    setHighlightedIndex(-1);

    const alreadyExists = regionItems.some((l) => l.toLowerCase() === cleaned.toLowerCase());
    if (!alreadyExists) {
      try {
        await createLocation.mutateAsync({ name: cleaned });
      } catch {
        // Handled in mutation toast
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    const totalOptions = filteredRegions.length + (canCreateNew ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredRegions.length) {
        handleSelect(filteredRegions[highlightedIndex]);
      } else if (canCreateNew && (highlightedIndex === filteredRegions.length || highlightedIndex === -1)) {
        handleCreateNew(standardizedCandidate || inputValue);
      } else if (filteredRegions.length > 0 && inputValue.trim()) {
        const exact = filteredRegions.find((l) => l.toLowerCase() === inputValue.toLowerCase().trim());
        if (exact) {
          handleSelect(exact);
        } else {
          handleCreateNew(standardizedCandidate || inputValue);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
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
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Clear region"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {isOpen && !disabled && (
          <RegionDropdownMenu
            listRef={listRef}
            openUpward={openUpward}
            isLoading={isLoading}
            filteredRegions={filteredRegions}
            inputValue={inputValue}
            highlightedIndex={highlightedIndex}
            canCreateNew={canCreateNew}
            standardizedCandidate={standardizedCandidate}
            onSelect={handleSelect}
            onCreateNew={handleCreateNew}
            onHighlight={setHighlightedIndex}
          />
        )}
      </div>
    </div>
  );
}
