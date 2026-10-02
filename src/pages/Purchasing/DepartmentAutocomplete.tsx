import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Check, ChevronDown, X, Plus, Loader2, Sparkles } from "lucide-react";
import { useDepartments } from "@/hooks/usePurchasing";
import { cleanAndStandardizeText } from "@/utils/textStandardizer";

interface DepartmentAutocompleteProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  label?: string;
  userDepartment?: string;
  requesterName?: string;
  usersList?: any[];
}

export function DepartmentAutocomplete({
  value = "",
  onChange,
  disabled = false,
  required = false,
  className = "",
  placeholder = "Search or select Graph API department...",
  label,
  userDepartment,
  requesterName,
  usersList,
}: DepartmentAutocompleteProps) {
  const { data: departmentsData, isLoading } = useDepartments();

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const inputValue = value || "";

  // Derive active requester's Graph API department
  const activeUserDept = useMemo(() => {
    if (userDepartment && userDepartment.trim() && userDepartment.toUpperCase() !== "REQUESTER") {
      return userDepartment.trim();
    }
    if (requesterName && usersList && usersList.length > 0) {
      const q = requesterName.trim().toLowerCase();
      const matched = usersList.find(
        (u: any) =>
          u.full_name?.trim().toLowerCase() === q ||
          u.email?.trim().toLowerCase() === q
      );
      if (matched?.department && matched.department.trim() && matched.department.toUpperCase() !== "REQUESTER") {
        return matched.department.trim();
      }
    }
    return "";
  }, [userDepartment, requesterName, usersList]);

  // Distinct department items from backend (Graph API synced)
  const departmentItems = useMemo(() => {
    const rawList = departmentsData || [];
    const deptsSet = new Set<string>();

    if (activeUserDept) {
      deptsSet.add(activeUserDept);
    }

    for (const d of rawList) {
      if (typeof d === "string" && d.trim()) {
        deptsSet.add(d.trim());
      }
    }

    // Also include common corporate departments if list is sparse
    const defaultDepts = [
      "Sales",
      "Marketing",
      "Engineering",
      "Product",
      "Finance",
      "Accounting",
      "Operations",
      "Human Resources",
      "Legal",
      "Executive",
      "Information Technology",
      "Customer Support",
    ];
    for (const d of defaultDepts) {
      deptsSet.add(d);
    }

    // Return list with activeUserDept at the very top, followed by alphabetical others
    const all = Array.from(deptsSet);
    all.sort((a, b) => {
      if (activeUserDept && a.toLowerCase() === activeUserDept.toLowerCase()) return -1;
      if (activeUserDept && b.toLowerCase() === activeUserDept.toLowerCase()) return 1;
      return a.localeCompare(b);
    });

    return all;
  }, [departmentsData, activeUserDept]);

  // Filter departments based on typed input
  const filteredDepartments = useMemo(() => {
    const q = inputValue.toLowerCase().trim();
    if (!q) return departmentItems;
    return departmentItems.filter((d) => d.toLowerCase().includes(q));
  }, [departmentItems, inputValue]);

  // Exact match check
  const isExactMatch = useMemo(() => {
    const q = inputValue.toLowerCase().trim();
    if (!q) return false;
    return departmentItems.some((d) => d.toLowerCase() === q);
  }, [departmentItems, inputValue]);

  const standardizedCandidate = useMemo(() => {
    if (!inputValue.trim()) return "";
    return cleanAndStandardizeText(inputValue);
  }, [inputValue]);

  const canCreateNew = inputValue.trim().length > 0 && !isExactMatch;

  // Determine open upward vs downward
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

  // Outside click handler
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

  const handleSelect = (deptVal: string) => {
    const cleaned = cleanAndStandardizeText(deptVal);
    onChange(cleaned);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreateNew = (rawName: string) => {
    const cleaned = cleanAndStandardizeText(rawName);
    if (!cleaned) return;
    onChange(cleaned);
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

    const totalOptions = filteredDepartments.length + (canCreateNew ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredDepartments.length) {
        handleSelect(filteredDepartments[highlightedIndex]);
      } else if (canCreateNew && (highlightedIndex === filteredDepartments.length || highlightedIndex === -1)) {
        handleCreateNew(standardizedCandidate || inputValue);
      } else if (filteredDepartments.length > 0 && inputValue.trim()) {
        const exact = filteredDepartments.find(
          (d) => d.toLowerCase() === inputValue.toLowerCase().trim()
        );
        if (exact) {
          handleSelect(exact);
        } else {
          handleCreateNew(standardizedCandidate || inputValue);
        }
      } else {
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const renderHighlightedName = (name: string, query: string) => {
    if (!query.trim()) return name;
    const q = query.trim();
    const index = name.toLowerCase().indexOf(q.toLowerCase());
    if (index === -1) return name;
    return (
      <>
        {name.substring(0, index)}
        <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 font-bold px-0.5 rounded">
          {name.substring(index, index + q.length)}
        </span>
        {name.substring(index + q.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {inputValue && (
            <span className="text-[10px] text-slate-400 font-normal">
              {isExactMatch ? "Graph API Department" : "Custom Department"}
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
          className="w-full pr-14 text-sm font-medium bg-white dark:bg-zinc-900 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-100/70 dark:disabled:bg-zinc-800/60"
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
            className={`absolute z-50 left-0 right-0 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
              openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
          >
            {/* Header info */}
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-300">
                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                Microsoft Graph API Departments
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  `${filteredDepartments.length} records`
                )}
              </span>
            </div>

            {/* List */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 dark:divide-zinc-800/50 py-1">
              {filteredDepartments.map((dept, index) => {
                const isSelected =
                  dept.toLowerCase() === inputValue.toLowerCase();
                const isHighlighted = highlightedIndex === index;
                const isRequesterDept =
                  activeUserDept &&
                  dept.toLowerCase() === activeUserDept.toLowerCase();

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
                    className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between text-xs sm:text-sm transition-colors ${
                      isHighlighted
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-100"
                        : isSelected
                        ? "bg-slate-50 dark:bg-zinc-800 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-800 dark:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isRequesterDept && (
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      )}
                      <span className="truncate font-medium">
                        {renderHighlightedName(dept, inputValue)}
                      </span>
                      {isRequesterDept && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1.5 py-0 font-normal bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0"
                        >
                          Requester Department
                        </Badge>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-indigo-600 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })}

              {/* Option to create / enter new custom department */}
              {canCreateNew && (
                <div
                  role="option"
                  aria-selected={highlightedIndex === filteredDepartments.length}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCreateNew(standardizedCandidate || inputValue);
                  }}
                  onMouseEnter={() => setHighlightedIndex(filteredDepartments.length)}
                  className={`px-3.5 py-2.5 cursor-pointer flex items-center gap-2 text-xs sm:text-sm border-t border-dashed border-indigo-200 dark:border-indigo-800/50 transition-colors ${
                    highlightedIndex === filteredDepartments.length
                      ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-950 dark:text-indigo-100 font-medium"
                      : "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100/70"
                  }`}
                >
                  <Plus className="h-4 w-4 text-indigo-600 shrink-0" />
                  <div className="flex flex-col truncate text-left">
                    <span className="font-semibold text-xs text-indigo-900 dark:text-indigo-200">
                      Use department:
                    </span>
                    <span className="truncate font-medium text-slate-700 dark:text-zinc-200 text-xs">
                      &quot;{standardizedCandidate || inputValue}&quot;
                    </span>
                  </div>
                </div>
              )}

              {filteredDepartments.length === 0 && !canCreateNew && (
                <div className="p-3.5 text-center text-xs text-muted-foreground">
                  <p>No departments available.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DepartmentAutocomplete;
