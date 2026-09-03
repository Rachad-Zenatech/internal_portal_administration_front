import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Building2, Check, ChevronDown, X } from "lucide-react";
import { useDepartments } from "@/hooks/usePurchasing";

interface DepartmentAutocompleteProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
}

export default function DepartmentAutocomplete({
  value = "",
  onChange,
  disabled = false,
  required = false,
  className = "",
  placeholder = "Search department (e.g. Technology, Engineering)...",
  label,
}: DepartmentAutocompleteProps) {
  const { data: departments = [], isLoading } = useDepartments();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const inputValue = value || "";

  // Filter departments based on input
  const filteredDepartments = useMemo(() => {
    const q = inputValue.toLowerCase().trim();
    if (!q) return departments;
    return departments.filter((d) => d.toLowerCase().includes(q));
  }, [departments, inputValue]);

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

  // Close dropdown on outside click or Escape key
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

  const handleSelect = (deptName: string) => {
    onChange(deptName);
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
        prev < filteredDepartments.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredDepartments.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredDepartments[highlightedIndex]) {
        handleSelect(filteredDepartments[highlightedIndex]);
      } else if (filteredDepartments.length > 0 && inputValue.trim()) {
        // If exact match exists or first item matches closely
        const exact = filteredDepartments.find(
          (d) => d.toLowerCase() === inputValue.toLowerCase().trim()
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
              {departments.some((d) => d.toLowerCase() === inputValue.toLowerCase())
                ? "Verified Department"
                : "Custom Department"}
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
              title="Clear department"
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
                <Building2 className="h-3.5 w-3.5 text-sky-600" />
                Departments
              </span>
              <span className="text-[11px] font-mono">
                {isLoading
                  ? "Loading..."
                  : `${filteredDepartments.length} matching`}
              </span>
            </div>

            {/* List */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 dark:divide-zinc-800/50 py-1">
              {filteredDepartments.map((dept, index) => {
                const isSelected =
                  dept.toLowerCase() === inputValue.toLowerCase();
                const isHighlighted = highlightedIndex === index;

                return (
                  <div
                    key={dept}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(dept);
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
                      {renderHighlightedName(dept, inputValue)}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-sky-600 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })}

              {filteredDepartments.length === 0 && (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  <p>No matching departments.</p>
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
