import React, { useState, useRef, useEffect, useMemo } from "react";
import { useGLCodes } from "@/hooks/usePurchasing";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X, Check, Landmark, CreditCard, ArrowRightLeft, Search } from "lucide-react";
import {
  buildPaymentMethodOptions,
  parsePaymentMethod,
  type PaymentMethodOption,
} from "@/utils/glAccountUtils";

interface PaymentMethodSelectProps {
  value?: string | null;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PaymentMethodSelect({
  value,
  onChange,
  placeholder = "Select payment method...",
  disabled = false,
  className = "",
}: PaymentMethodSelectProps) {
  const { data: glCodes = [] } = useGLCodes();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allOptions = useMemo(() => buildPaymentMethodOptions(glCodes), [glCodes]);

  const parsedCurrent = useMemo(() => parsePaymentMethod(value), [value]);

  // Filtered options
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return allOptions;
    const q = search.toLowerCase().trim();
    return allOptions.filter((opt) => {
      const matchBank = opt.bank_name.toLowerCase().includes(q);
      const matchLast4 = opt.last4 ? opt.last4.includes(q) : false;
      const matchSub = opt.subsidiary ? opt.subsidiary.toLowerCase().includes(q) : false;
      const matchType = opt.card_type.toLowerCase().includes(q);
      const matchLabel = opt.display_label.toLowerCase().includes(q);
      return matchBank || matchLast4 || matchSub || matchType || matchLabel;
    });
  }, [allOptions, search]);

  // Group options by card_type
  const creditCards = useMemo(
    () => filteredOptions.filter((o) => o.card_type === "Credit Card"),
    [filteredOptions]
  );
  const debitCards = useMemo(
    () => filteredOptions.filter((o) => o.card_type === "Debit Card"),
    [filteredOptions]
  );
  const wireOptions = useMemo(
    () => filteredOptions.filter((o) => o.card_type === "Wire"),
    [filteredOptions]
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const handleSelect = (opt: PaymentMethodOption) => {
    onChange(opt.value);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-between min-h-10 px-3 py-1.5 rounded-md border text-sm transition-all cursor-pointer select-none bg-white dark:bg-zinc-900 shadow-2xs ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
            : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-zinc-800" : ""}`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap py-0.5">
          {parsedCurrent ? (
            parsedCurrent.card_type === "Wire" ? (
              <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-2.5 py-1 rounded-md">
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Wire Transfer</span>
              </div>
            ) : parsedCurrent.card_type === "Credit Card" ? (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md">
                  <CreditCard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>{parsedCurrent.bank_name}</span>
                </span>
                {parsedCurrent.last4 && (
                  <span className="font-mono font-medium text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-800 px-1.5 py-0.5 rounded text-[11px]">
                    •••• {parsedCurrent.last4}
                  </span>
                )}
                {parsedCurrent.subsidiary && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-medium">
                    {parsedCurrent.subsidiary}
                  </span>
                )}
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700 bg-white dark:bg-zinc-900">
                  Credit Card
                </Badge>
              </div>
            ) : parsedCurrent.card_type === "Debit Card" ? (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                  <Landmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{parsedCurrent.bank_name}</span>
                </span>
                {parsedCurrent.last4 && (
                  <span className="font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded text-[11px]">
                    •••• {parsedCurrent.last4}
                  </span>
                )}
                {parsedCurrent.subsidiary && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 font-medium">
                    {parsedCurrent.subsidiary}
                  </span>
                )}
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-zinc-900">
                  Debit Card
                </Badge>
              </div>
            ) : (
              <span className="text-slate-800 dark:text-zinc-200 font-medium">{value}</span>
            )
          ) : (
            <span className="text-slate-400 dark:text-zinc-500">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1.5">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search bar inside dropdown */}
          <div className="p-2 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bank name, last 4 digits, or card type..."
                className="h-8 pl-8 pr-3 text-xs bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 focus-visible:ring-1 focus-visible:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* List of cards and methods */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60 p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching cards or payment methods found
              </div>
            ) : (
              <>
                {/* Credit Cards Section */}
                {creditCards.length > 0 && (
                  <div className="py-1">
                    <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-purple-700 dark:text-purple-300 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> Credit Cards
                      </span>
                      <span className="text-[10px] font-normal opacity-70">
                        {creditCards.length} cards
                      </span>
                    </div>
                    {creditCards.map((opt) => {
                      const isSelected = value === opt.value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => handleSelect(opt)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? "bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 font-semibold"
                              : "hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-zinc-100">
                              {opt.bank_name}
                            </span>
                            {opt.last4 && (
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-purple-100/70 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-medium">
                                •••• {opt.last4}
                              </span>
                            )}
                            {opt.subsidiary && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                ({opt.subsidiary})
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                            >
                              (Credit Card)
                            </Badge>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0 ml-2" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Debit Cards Section */}
                {debitCards.length > 0 && (
                  <div className="py-1">
                    <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-emerald-700 dark:text-emerald-300 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5" /> Debit Cards / Checking
                      </span>
                      <span className="text-[10px] font-normal opacity-70">
                        {debitCards.length} accounts
                      </span>
                    </div>
                    {debitCards.map((opt) => {
                      const isSelected = value === opt.value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => handleSelect(opt)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold"
                              : "hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-zinc-100">
                              {opt.bank_name}
                            </span>
                            {opt.last4 && (
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium">
                                •••• {opt.last4}
                              </span>
                            )}
                            {opt.subsidiary && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                ({opt.subsidiary})
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            >
                              (Debit Card)
                            </Badge>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Wire Transfer Section */}
                {wireOptions.length > 0 && (
                  <div className="py-1">
                    <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-amber-700 dark:text-amber-300 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Wire Transfer
                      </span>
                    </div>
                    {wireOptions.map((opt) => {
                      const isSelected = value === opt.value || value === "W" || value === "WIRE";
                      return (
                        <div
                          key={opt.value}
                          onClick={() => handleSelect(opt)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold"
                              : "hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-zinc-100">
                              Wire Transfer
                            </span>
                            <span className="text-slate-400 dark:text-zinc-500 text-[11px]">
                              (Direct Bank Wire)
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentMethodSelect;
