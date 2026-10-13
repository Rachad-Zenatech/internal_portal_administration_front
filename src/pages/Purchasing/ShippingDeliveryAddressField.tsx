import { useState, useMemo, useEffect } from "react";
import { Country, State, City, type ICountry, type IState, type ICity } from "country-state-city";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  Globe,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from "lucide-react";
import { detectTaxFromAddress } from "@/utils/taxRates";
import { formatMoney } from "./purchasingMeta";

interface ShippingDeliveryAddressFieldProps {
  shippingAddress: string;
  onShippingAddressChange: (address: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (phone: string) => void;
  allSavedAddresses?: string[];
  lastUsedAddress?: string;
  currency?: string;
  subtotal?: number;
  currentTaxFee?: number;
  onApplyEstimatedTax?: (amount: number) => void;
  disabled?: boolean;
  idPrefix?: string;
  className?: string;
}

export function ShippingDeliveryAddressField({
  shippingAddress,
  onShippingAddressChange,
  phoneNumber,
  onPhoneNumberChange,
  allSavedAddresses = [],
  lastUsedAddress = "",
  currency = "USD",
  subtotal = 0,
  currentTaxFee = 0,
  onApplyEstimatedTax,
  disabled = false,
  idPrefix = "shipping",
  className = "",
}: ShippingDeliveryAddressFieldProps) {
  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("US");
  const [selectedStateCode, setSelectedStateCode] = useState<string>("");
  const [selectedCityName, setSelectedCityName] = useState<string>("");

  // All 250 Countries from country-state-city
  const allCountries: ICountry[] = useMemo(() => {
    return Country.getAllCountries();
  }, []);

  const selectedCountryObj = useMemo(() => {
    return allCountries.find((c) => c.isoCode === selectedCountryCode) || null;
  }, [allCountries, selectedCountryCode]);

  // States/Provinces for selected country
  const statesOfCountry: IState[] = useMemo(() => {
    if (!selectedCountryCode) return [];
    return State.getStatesOfCountry(selectedCountryCode);
  }, [selectedCountryCode]);

  const selectedStateObj = useMemo(() => {
    return statesOfCountry.find((s) => s.isoCode === selectedStateCode) || null;
  }, [statesOfCountry, selectedStateCode]);

  // Cities for selected state & country
  const citiesOfState: ICity[] = useMemo(() => {
    if (!selectedCountryCode || !selectedStateCode) return [];
    return City.getCitiesOfState(selectedCountryCode, selectedStateCode);
  }, [selectedCountryCode, selectedStateCode]);

  // Auto-detect Country / State / Tax from current address string
  const taxEstimate = useMemo(() => {
    return detectTaxFromAddress(shippingAddress || "", currency);
  }, [shippingAddress, currency]);

  const estimatedTaxAmount = useMemo(() => {
    if (!taxEstimate || subtotal <= 0) return 0;
    return Math.round(subtotal * taxEstimate.rateDecimal * 100) / 100;
  }, [taxEstimate, subtotal]);

  // Sync selected country code when address changes if high-confidence detection matches
  useEffect(() => {
    if (taxEstimate?.countryCode && taxEstimate.countryCode !== selectedCountryCode) {
      const match = allCountries.find((c) => c.isoCode === taxEstimate.countryCode);
      if (match) {
        setSelectedCountryCode(match.isoCode);
      }
    }
  }, [taxEstimate?.countryCode, allCountries, selectedCountryCode]);

  // Apply chosen international location to shipping address
  const handleApplyLocation = () => {
    const parts: string[] = [];
    if (selectedCityName) parts.push(selectedCityName);
    if (selectedStateObj?.name || selectedStateCode) {
      parts.push(selectedStateObj?.name || selectedStateCode);
    }
    if (selectedCountryObj?.name) parts.push(selectedCountryObj.name);

    if (parts.length > 0) {
      const locStr = parts.join(", ");
      const existing = (shippingAddress || "").trim();
      let updated = "";
      if (!existing) {
        updated = locStr;
      } else {
        // If existing has street address, append location
        updated = `${existing.replace(/,\s*(?:United States|Canada|UK|USA|CA|US)$/i, "")}, ${locStr}`;
      }
      onShippingAddressChange(updated);
    }

    // Auto-prefill phone country dial code if phone is empty
    if (selectedCountryObj?.phonecode && !phoneNumber) {
      const dial = selectedCountryObj.phonecode.startsWith("+")
        ? selectedCountryObj.phonecode
        : `+${selectedCountryObj.phonecode}`;
      onPhoneNumberChange(`${dial} `);
    }

    setIsHelperOpen(false);
  };

  const datalistId = `${idPrefix}-saved-shipping-addresses-list`;

  return (
    <div className={`p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800 space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
            Shipping &amp; Delivery Details
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!disabled && (
            <button
              type="button"
              onClick={() => setIsHelperOpen((v) => !v)}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Globe className="h-3 w-3" />
              <span>{isHelperOpen ? "Hide Location Finder" : "Global Location Finder"}</span>
              {isHelperOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
          <span className="text-[11px] text-slate-400 font-normal">Optional</span>
        </div>
      </div>

      {/* Expandable Multi-Country Address Finder (country-state-city) */}
      {isHelperOpen && !disabled && (
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200">
              <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>International Address Directory (250 Countries, States &amp; Cities)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsHelperOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Country Selection */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Country</span>
                <span className="text-[10px] text-slate-400 font-normal">{allCountries.length} available</span>
              </label>
              <select
                value={selectedCountryCode}
                onChange={(e) => {
                  setSelectedCountryCode(e.target.value);
                  setSelectedStateCode("");
                  setSelectedCityName("");
                }}
                className="w-full h-8 px-2 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                {allCountries.map((c) => (
                  <option key={c.isoCode} value={c.isoCode}>
                    {c.flag ? `${c.flag} ` : ""}{c.name} ({c.isoCode})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. State / Province Selection */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span>State / Province</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {statesOfCountry.length ? `${statesOfCountry.length} regions` : "None"}
                </span>
              </label>
              <select
                value={selectedStateCode}
                disabled={statesOfCountry.length === 0}
                onChange={(e) => {
                  setSelectedStateCode(e.target.value);
                  setSelectedCityName("");
                }}
                className="w-full h-8 px-2 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">-- Select State/Province --</option>
                {statesOfCountry.map((s) => (
                  <option key={s.isoCode} value={s.isoCode}>
                    {s.name} ({s.isoCode})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. City Selection */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span>City</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {citiesOfState.length ? `${citiesOfState.length} cities` : "Type or select"}
                </span>
              </label>
              {citiesOfState.length > 0 ? (
                <select
                  value={selectedCityName}
                  onChange={(e) => setSelectedCityName(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select City --</option>
                  {citiesOfState.slice(0, 300).map((ct, idx) => (
                    <option key={`${ct.name}-${idx}`} value={ct.name}>
                      {ct.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={selectedCityName}
                  onChange={(e) => setSelectedCityName(e.target.value)}
                  placeholder="Enter city..."
                  className="h-8 text-xs bg-white dark:bg-zinc-800"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              {selectedCountryObj?.flag} {selectedCountryObj?.name}
              {selectedStateObj ? ` • ${selectedStateObj.name}` : ""}
              {selectedCityName ? ` • ${selectedCityName}` : ""}
              {selectedCountryObj?.phonecode ? ` (Dial: +${selectedCountryObj.phonecode})` : ""}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsHelperOpen(false)}
                className="h-7 text-xs px-2.5"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApplyLocation}
                className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <Check className="h-3 w-3 mr-1" /> Insert into Address
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form: Address & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Shipping Address */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-500" />
              <span>Shipping Address</span>
            </label>
            {lastUsedAddress && shippingAddress !== lastUsedAddress && !disabled && (
              <button
                type="button"
                onClick={() => onShippingAddressChange(lastUsedAddress)}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <Clock className="h-2.5 w-2.5" /> Use last address
              </button>
            )}
          </div>

          <div className="relative">
            <Input
              list={datalistId}
              value={shippingAddress}
              disabled={disabled}
              onChange={(e) => onShippingAddressChange(e.target.value)}
              placeholder="Enter delivery address, suite, city, state, zip, country..."
              className="h-9 text-xs pr-8 bg-white dark:bg-zinc-900"
            />
            {shippingAddress && !disabled && (
              <button
                type="button"
                onClick={() => onShippingAddressChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                &times;
              </button>
            )}
            <datalist id={datalistId}>
              {allSavedAddresses.map((addr, i) => (
                <option key={i} value={addr} />
              ))}
            </datalist>
          </div>

          {/* Quick suggestion pills if available */}
          {allSavedAddresses.length > 0 && !disabled && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 self-center">Recent:</span>
              {allSavedAddresses.slice(0, 3).map((addr, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onShippingAddressChange(addr)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border text-left truncate max-w-[200px] transition-colors cursor-pointer ${
                    shippingAddress === addr
                      ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                      : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700"
                  }`}
                  title={addr}
                >
                  {addr}
                </button>
              ))}
            </div>
          )}

          {/* Auto Tax Estimation Badge & Quick Set */}
          {taxEstimate && (
            <div className="mt-2 p-2 rounded-lg bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-semibold">{taxEstimate.regionName}:</span>
                <span className="truncate">{taxEstimate.ratePercent}% {taxEstimate.taxType}</span>
              </div>
              {onApplyEstimatedTax && estimatedTaxAmount > 0 && !disabled && (
                <button
                  type="button"
                  onClick={() => onApplyEstimatedTax(estimatedTaxAmount)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors shrink-0 ml-2 cursor-pointer ${
                    currentTaxFee === estimatedTaxAmount
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/60 dark:hover:bg-blue-800 dark:text-blue-200"
                  }`}
                >
                  {currentTaxFee === estimatedTaxAmount ? "✓ Applied" : `Set to $${formatMoney(estimatedTaxAmount)}`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contact Phone Number */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
              <Phone className="h-3 w-3 text-slate-500" />
              <span>Contact Phone Number</span>
            </label>
            {selectedCountryObj?.phonecode && !phoneNumber && !disabled && (
              <button
                type="button"
                onClick={() => onPhoneNumberChange(`+${selectedCountryObj.phonecode.replace(/^\+/, "")} `)}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Use +{selectedCountryObj.phonecode.replace(/^\+/, "")}
              </button>
            )}
          </div>
          <Input
            type="tel"
            value={phoneNumber}
            disabled={disabled}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder="e.g. +1 (555) 019-2834"
            className="h-9 text-xs bg-white dark:bg-zinc-900"
          />
          <p className="text-[10px] text-slate-400 dark:text-zinc-500">
            Saved to your profile and used for carrier delivery &amp; tracking updates.
          </p>
        </div>
      </div>
    </div>
  );
}
