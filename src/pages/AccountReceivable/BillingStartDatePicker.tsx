import React, { useState } from "react";
import { format, parse, isValid, addMonths, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Calendar } from "../../components/ui/calendar";

interface BillingStartDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  size?: "sm" | "xs";
  effectiveDate?: string;
}

export const BillingStartDatePicker: React.FC<BillingStartDatePickerProps> = ({
  value,
  onChange,
  className = "",
  placeholder = "Select date...",
  size = "xs",
  effectiveDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const parseDate = (dStr?: string): Date => {
    if (!dStr) return new Date();
    try {
      const clean = String(dStr).trim();
      // 1. Handle yyyy-MM-dd in local time to avoid UTC timezone off-by-one shifts
      if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(clean)) {
        const parts = clean.split(/[-/]/);
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
      // 2. Handle MM/dd/yyyy in local time
      if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(clean)) {
        const parts = clean.split(/[-/]/);
        const m = parseInt(parts[0], 10) - 1;
        const d = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
      const p1 = parse(clean, "yyyy-MM-dd", new Date());
      if (isValid(p1)) return p1;
      const p2 = parse(clean, "MM/dd/yyyy", new Date());
      if (isValid(p2)) return p2;
      const p3 = parse(clean, "MMM dd, yyyy", new Date());
      if (isValid(p3)) return p3;
      const p4 = new Date(clean.replace(/-/g, "/"));
      if (isValid(p4)) return p4;
    } catch {
      // ignore
    }
    return new Date();
  };

  const getDisplayLabel = () => {
    if (!value || value === "Immediate") {
      return effectiveDate ? format(parseDate(effectiveDate), "MMM dd, yyyy") : "Effective Date";
    }
    if (value === "First of Next Month") {
      const nextMonth = startOfMonth(addMonths(new Date(), 1));
      return format(nextMonth, "MMM dd, yyyy");
    }
    try {
      const d = parseDate(value);
      return format(d, "MMM dd, yyyy");
    } catch {
      return value;
    }
  };

  const heightClass = size === "xs" ? "h-7 text-[11px]" : "h-8 text-xs";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`w-full justify-start text-left font-medium px-2 bg-card hover:bg-muted border-input cursor-pointer ${heightClass} ${className}`}
        >
          <CalendarIcon className="mr-1 h-3 w-3 text-muted-foreground shrink-0" />
          <span className="truncate text-foreground font-sans">
            {getDisplayLabel() || placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-2">
          <Calendar
            mode="single"
            selected={value && value !== "Immediate" && value !== "First of Next Month" ? parseDate(value) : parseDate(effectiveDate)}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "yyyy-MM-dd"));
                setIsOpen(false);
              }
            }}
          />
          <div className="flex flex-wrap items-center justify-between border-t border-border pt-2 gap-1 text-[11px]">
            {effectiveDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(effectiveDate);
                  setIsOpen(false);
                }}
                className="h-6 text-[11px] px-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
              >
                Same as Item
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(format(new Date(), "yyyy-MM-dd"));
                setIsOpen(false);
              }}
              className="h-6 text-[11px] px-1.5 text-foreground hover:bg-muted cursor-pointer"
            >
              Today
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const nextMonth = startOfMonth(addMonths(new Date(), 1));
                onChange(format(nextMonth, "yyyy-MM-dd"));
                setIsOpen(false);
              }}
              className="h-6 text-[11px] px-1.5 text-foreground hover:bg-muted cursor-pointer"
            >
              1st Next Month
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
