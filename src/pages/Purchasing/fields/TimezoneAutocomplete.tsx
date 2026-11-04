import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X, Check, Globe } from "lucide-react";

interface TimezoneAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const FALLBACK_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Toronto",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Vancouver",
  "America/Phoenix",
  "America/Anchorage",
  "America/Honolulu",
  "America/Halifax",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "America/Bogota",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Zurich",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Jerusalem",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Taipei",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "Pacific/Fiji",
];

export function TimezoneAutocomplete({
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "Search timezone (e.g. America/New_York, London, Tokyo)...",
}: TimezoneAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const allTimezones = useMemo(() => {
    try {
      if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
        const supported = Intl.supportedValuesOf("timeZone");
        if (supported && supported.length > 0) {
          return Array.from(new Set(["UTC", ...supported]));
        }
      }
    } catch {
      // ignore
    }
    return FALLBACK_TIMEZONES;
  }, []);

  // Format offset for a timezone
  const getTimezoneMeta = (tz: string) => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset",
      });
      const parts = formatter.formatToParts(now);
      const offset = parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
      return { tz, offset };
    } catch {
      return { tz, offset: "" };
    }
  };

  const filteredTimezones = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      // Prioritize common timezones first when no search query
      const prioritized = [
        "America/New_York",
        "America/Toronto",
        "America/Vancouver",
        "America/Los_Angeles",
        "America/Chicago",
        "Europe/London",
        "Europe/Paris",
        "Asia/Hong_Kong",
        "Asia/Tokyo",
        "Asia/Singapore",
        "UTC",
      ];
      const others = allTimezones.filter((tz) => !prioritized.includes(tz));
      return [...prioritized, ...others].map(getTimezoneMeta);
    }

    return allTimezones
      .filter((tz) => {
        const lowerTz = tz.toLowerCase();
        const readable = tz.replace(/_/g, " ").replace(/\//g, " - ").toLowerCase();
        return lowerTz.includes(q) || readable.includes(q);
      })
      .map(getTimezoneMeta);
  }, [allTimezones, search]);

  const currentMeta = useMemo(() => {
    if (!value) return null;
    return getTimezoneMeta(value);
  }, [value]);

  const handleSelect = (tz: string) => {
    onChange(tz);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("America/New_York");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent/50 transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        } ${isOpen ? "ring-2 ring-ring ring-offset-2" : ""}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          {value ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-foreground truncate">{value}</span>
              {currentMeta?.offset && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                  {currentMeta.offset}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && value !== "America/New_York" && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Reset to default timezone"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
        </div>
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[300px] max-w-[460px] rounded-lg border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 overflow-hidden">
          {/* Search Header */}
          <div className="p-2 border-b bg-muted/30">
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter timezones..."
              className="h-8 text-xs bg-background"
            />
          </div>

          {/* Timezones List */}
          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-border/40">
            {filteredTimezones.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No matching timezones found.
              </div>
            ) : (
              filteredTimezones.slice(0, 100).map(({ tz, offset }) => {
                const isSelected = value === tz;
                return (
                  <div
                    key={tz}
                    onClick={() => handleSelect(tz)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-accent hover:text-accent-foreground text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="truncate">{tz}</span>
                    </div>
                    {offset && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 font-mono text-muted-foreground shrink-0 ml-2"
                      >
                        {offset}
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TimezoneAutocomplete;
