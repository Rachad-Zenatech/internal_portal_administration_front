import { useState, useEffect, useMemo, useRef, useCallback, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Check, Plus, Loader2, ChevronsUpDown, RefreshCw, X } from "lucide-react";
import { useCompanyProducts } from "@/hooks/useMasterTables";
import type { MasterProductItem } from "@/services/masterTablesService";

interface ProductServiceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectProduct?: (product: MasterProductItem) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  companyId?: string | null;
}

export function ProductServiceAutocomplete({
  value,
  onChange,
  onSelectProduct,
  placeholder = "Item / Service name...",
  disabled = false,
  className = "",
  id,
  name,
  companyId,
}: ProductServiceAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Directly uses GET /api/companies/{companyId}/products with include_general=false when companyId is provided
  const { data, isLoading, refetch } = useCompanyProducts(companyId, "", true, false);
  const products = data?.items || [];

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const updateCoords = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < 280 && rect.top > 280;

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 440)),
      width: Math.max(rect.width, 380),
      placeAbove,
    });
  }, []);

  // Recalculate position on open, scroll, or resize
  useEffect(() => {
    if (open) {
      updateCoords();
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
      return () => {
        window.removeEventListener("scroll", updateCoords, true);
        window.removeEventListener("resize", updateCoords);
      };
    }
  }, [open, updateCoords]);

  // Click outside listener
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      const q = inputValue.trim().toLowerCase();
      if (q && onSelectProduct) {
        const matched = products.find(
          (p) => p.name.toLowerCase() === q || p.raw_name?.toLowerCase() === q
        );
        if (matched) {
          onSelectProduct(matched);
        }
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleMouseDown);
      return () => document.removeEventListener("mousedown", handleMouseDown);
    }
  }, [open, inputValue, products, onSelectProduct]);

  const filteredProducts = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return products.slice(0, 50);

    return products
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.raw_name?.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      })
      .slice(0, 50);
  }, [products, inputValue]);

  const hasExactMatch = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    return products.some((p) => p.name.toLowerCase() === q);
  }, [products, inputValue]);

  const canUseCustom = inputValue.trim().length > 0 && !hasExactMatch;

  const handleSelect = (product: MasterProductItem) => {
    setInputValue(product.name);
    onChange(product.name);
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    setOpen(false);
  };

  const handleSelectCustom = () => {
    const custom = inputValue.trim();
    if (custom) {
      onChange(custom);
    }
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        updateCoords();
        return;
      }
      return;
    }

    const totalOptions = filteredProducts.length + (canUseCustom ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % (totalOptions || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalOptions) % (totalOptions || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
        handleSelect(filteredProducts[highlightedIndex]);
      } else if (canUseCustom && highlightedIndex === filteredProducts.length) {
        handleSelectCustom();
      } else {
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <Input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        value={inputValue}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          updateCoords();
          if (products.length === 0) refetch();
        }}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setHighlightedIndex(0);
          if (!open) {
            setOpen(true);
            updateCoords();
          }
        }}
        onBlur={() => {
          const q = inputValue.trim().toLowerCase();
          if (q && onSelectProduct) {
            const matched = products.find(
              (p) => p.name.toLowerCase() === q || p.raw_name?.toLowerCase() === q
            );
            if (matched) {
              onSelectProduct(matched);
            }
          }
        }}
        onKeyDown={handleKeyDown}
        className={`${inputValue && !disabled ? "pr-12" : "pr-7"} font-medium ${className}`}
      />
      {inputValue && !disabled && (
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            setInputValue("");
            onChange("");
            setOpen(false);
            inputRef.current?.focus();
          }}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer rounded-full hover:bg-muted"
          title="Clear"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        type="button"
        tabIndex={-1}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => {
              const next = !prev;
              if (next) updateCoords();
              return next;
            });
            inputRef.current?.focus();
          }
        }}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ChevronsUpDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* Portaled Floating Dropdown directly attached to document.body with max z-index */}
      {open && !disabled && coords && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 999999,
            ...(coords.placeAbove
              ? { bottom: `${window.innerHeight - coords.top}px` }
              : { top: `${coords.top}px` }),
          }}
          className="shadow-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-foreground rounded-lg overflow-hidden flex flex-col ring-1 ring-black/5 animate-in fade-in-0 duration-75"
        >
          {/* Header count / catalog status */}
          <div className="px-3 py-2 flex items-center justify-between text-[11px] text-muted-foreground font-medium bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-zinc-200">
              <Package className="w-3.5 h-3.5 text-amber-500" />
              <span>Products & Services ({filteredProducts.length})</span>
              {companyId && (
                <span className="text-[9.5px] px-1.5 py-0.2 rounded font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                  {filteredProducts[0]?.company_name || "Company Filtered"}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              {isLoading && <Loader2 className="w-3 h-3 animate-spin text-amber-500" />}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  refetch();
                }}
                title="Refresh catalog"
                className="p-1 hover:text-foreground hover:bg-slate-200 dark:hover:bg-zinc-800 rounded transition-colors text-muted-foreground cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-[260px] overflow-y-auto p-1.5 space-y-1">
            {filteredProducts.map((p, idx) => {
              const isSelected = p.name.toLowerCase() === (value || "").toLowerCase();
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`flex items-start justify-between gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-colors text-left ${
                    isHighlighted
                      ? "bg-amber-500/10 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500/20"
                      : "hover:bg-slate-100/70 dark:hover:bg-zinc-900 text-slate-800 dark:text-zinc-200"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold truncate text-foreground">
                        {p.name}
                      </span>
                      {p.sku && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ({p.sku})
                        </span>
                      )}
                      {p.company_name && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {p.company_name}
                        </span>
                      )}
                      {p.source === "hubspot" && !p.company_name && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                          HubSpot
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 border-muted-foreground/30 font-normal text-muted-foreground"
                      >
                        {p.billing_frequency}
                      </Badge>
                    </div>

                    {p.description ? (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 font-light">
                        {p.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {p.currency} {Number(p.price).toFixed(2)}
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-amber-600 ml-auto mt-0.5" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Custom item freeform selection option */}
            {canUseCustom && (
              <div
                onClick={handleSelectCustom}
                onMouseEnter={() => setHighlightedIndex(filteredProducts.length)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors border-t border-dashed mt-1.5 text-left ${
                  highlightedIndex === filteredProducts.length
                    ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/20"
                    : "hover:bg-slate-100/70 dark:hover:bg-zinc-900 text-muted-foreground"
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div className="text-xs">
                  Use custom item: <span className="font-semibold text-foreground">"{inputValue.trim()}"</span>
                </div>
              </div>
            )}

            {filteredProducts.length === 0 && !canUseCustom && (
              <div className="px-3 py-5 text-center text-xs text-muted-foreground">
                {isLoading ? "Loading catalog..." : "No matching products found."}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
