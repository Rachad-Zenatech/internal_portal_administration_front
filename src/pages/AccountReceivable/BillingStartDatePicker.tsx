import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

interface BillingStartDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  size?: "sm" | "xs";
}

export const BillingStartDatePicker: React.FC<BillingStartDatePickerProps> = ({
  value,
  onChange,
  className = "",
  placeholder = "Select start...",
  size = "xs",
}) => {
  // Normalize value to "Immediate" or "First of Next Month"
  const normalizedValue = (() => {
    if (!value) return "Immediate";
    const lower = value.trim().toLowerCase();
    if (lower.includes("first") || lower.includes("next")) {
      return "First of Next Month";
    }
    return "Immediate";
  })();

  const heightClass = size === "xs" ? "h-6 text-[11px]" : "h-7 text-xs";

  return (
    <Select
      value={normalizedValue}
      onValueChange={(val) => onChange(val)}
    >
      <SelectTrigger
        className={`w-full font-medium px-2 bg-card border-input focus:ring-1 focus:ring-blue-500 cursor-pointer ${heightClass} ${className}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border z-50 shadow-md">
        <SelectItem value="Immediate" className="text-xs cursor-pointer">
          Immediate
        </SelectItem>
        <SelectItem value="First of Next Month" className="text-xs cursor-pointer">
          First of Next Month
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
