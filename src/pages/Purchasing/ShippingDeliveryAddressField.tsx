import { useState, useMemo, useEffect, useRef } from "react";
import { Country, State, City, type ICountry, type IState, type ICity } from "country-state-city";
import { Input } from "@/components/ui/input";
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  Globe,
  Building,
  Building2,
  Mail,
  SlidersHorizontal,
} from "lucide-react";
import { detectTaxWithPriority, type PriorityTaxEstimate } from "@/utils/taxRates";
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
  vendorName?: string;
  vendorAddress?: string;
  knownVendorLocations?: Record<string, { address?: string }>;
}

/**
 * Intelligent helper to parse raw address string into structured parts.
 */
function parseAddressToParts(
  raw: string,
  fallbackCurrency: string = "USD",
  allCountries: ICountry[]
): {
  street: string;
  postalCode: string;
  countryCode: string;
  stateCode: string;
  cityName: string;
} {
  if (!raw || typeof raw !== "string") {
    return {
      street: "",
      postalCode: "",
      countryCode: fallbackCurrency === "CAD" ? "CA" : "US",
      stateCode: "",
      cityName: "",
    };
  }

  let text = raw.trim();
  let postalCode = "";

  // 1. Detect postal code
  const caPostalMatch = text.match(/\b([A-CEGHJ-NPRSTVXY]\d[A-CEGHJ-NPRSTV-Z][ -]?\d[A-CEGHJ-NPRSTV-Z]\d)\b/i);
  const usZipMatch = text.match(/\b(\d{5}(?:-\d{4})?)\b/);

  if (caPostalMatch) {
    postalCode = caPostalMatch[1].toUpperCase();
    text = text.replace(caPostalMatch[0], " ");
  } else if (usZipMatch) {
    postalCode = usZipMatch[1];
    text = text.replace(usZipMatch[0], " ");
  }

  // 2. Detect Country
  let countryCode = "";
  if (/\b(?:canada|can)\b/i.test(text) || caPostalMatch) {
    countryCode = "CA";
    text = text.replace(/\b(?:canada|can)\b/gi, " ");
  } else if (/\b(?:united states|usa|u\.s\.a\.|u\.s\.|america)\b/i.test(text)) {
    countryCode = "US";
    text = text.replace(/\b(?:united states|usa|u\.s\.a\.|u\.s\.|america)\b/gi, " ");
  } else if (/\b(?:united kingdom|uk|great britain|england)\b/i.test(text)) {
    countryCode = "GB";
    text = text.replace(/\b(?:united kingdom|uk|great britain|england)\b/gi, " ");
  } else {
    for (const c of allCountries) {
      const cRegex = new RegExp(`\\b${c.name}\\b`, "i");
      if (cRegex.test(text)) {
        countryCode = c.isoCode;
        text = text.replace(cRegex, " ");
        break;
      }
    }
  }

  if (!countryCode) {
    countryCode = fallbackCurrency === "CAD" ? "CA" : "US";
  }

  // 3. Detect State / Province
  let stateCode = "";
  const states = State.getStatesOfCountry(countryCode);
  for (const s of states) {
    const sNameRegex = new RegExp(`\\b${s.name}\\b`, "i");
    const sCodeRegex = new RegExp(`(?:,\\s*|\\b)${s.isoCode}(?:\\s*,|\\b)`, "i");
    if (sNameRegex.test(text)) {
      stateCode = s.isoCode;
      text = text.replace(sNameRegex, " ");
      break;
    } else if (sCodeRegex.test(text)) {
      stateCode = s.isoCode;
      text = text.replace(sCodeRegex, " ");
      break;
    }
  }

  // 4. Detect City
  let cityName = "";
  if (countryCode && stateCode) {
    const cities = City.getCitiesOfState(countryCode, stateCode);
    for (const ct of cities) {
      const ctRegex = new RegExp(`\\b${ct.name}\\b`, "i");
      if (ctRegex.test(text)) {
        cityName = ct.name;
        text = text.replace(ctRegex, " ");
        break;
      }
    }
  }

  // 5. Clean remainder for street / unit
  const street = text
    .replace(/^[,\s-]+|[,\s-]+$/g, "")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { street, postalCode, countryCode, stateCode, cityName };
}

/**
 * Builds formatted full shipping address from parts.
 */
function buildFullAddress(
  street: string,
  postal: string,
  city: string,
  stateNameOrCode: string,
  countryName: string
): string {
  const parts: string[] = [];
  if (street.trim()) parts.push(street.trim());
  if (city.trim()) parts.push(city.trim());

  const statePart = stateNameOrCode.trim();
  const postPart = postal.trim();
  const statePostal = [statePart, postPart].filter(Boolean).join(" ");
  if (statePostal) parts.push(statePostal);

  if (countryName.trim()) parts.push(countryName.trim());
  return parts.join(", ");
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
  vendorName = "",
  vendorAddress = "",
  knownVendorLocations = {},
}: ShippingDeliveryAddressFieldProps) {
  // All 250 Countries from country-state-city
  const allCountries: ICountry[] = useMemo(() => {
    return Country.getAllCountries();
  }, []);

  // Structured address parts
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(
    currency === "CAD" ? "CA" : "US"
  );
  const [selectedStateCode, setSelectedStateCode] = useState<string>("");
  const [selectedCityName, setSelectedCityName] = useState<string>("");
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [useSingleLineMode, setUseSingleLineMode] = useState(false);

  // Track the last emitted address string to prevent sync feedback loops
  const lastEmittedAddressRef = useRef<string>("");

  // Sync state when external shippingAddress changes (initial mount, selecting recent address, etc.)
  useEffect(() => {
    if (shippingAddress === lastEmittedAddressRef.current) return;
    lastEmittedAddressRef.current = shippingAddress;

    if (!shippingAddress) {
      setStreetAddress("");
      setPostalCode("");
      setSelectedStateCode("");
      setSelectedCityName("");
      return;
    }

    const parsed = parseAddressToParts(shippingAddress, currency, allCountries);
    setStreetAddress(parsed.street);
    setPostalCode(parsed.postalCode);
    if (parsed.countryCode) setSelectedCountryCode(parsed.countryCode);
    setSelectedStateCode(parsed.stateCode);
    setSelectedCityName(parsed.cityName);
  }, [shippingAddress, currency, allCountries]);

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

  // Emit updated combined address whenever parts change
  const emitAddress = (
    street: string,
    postal: string,
    city: string,
    stateCode: string,
    countryCode: string
  ) => {
    const country = allCountries.find((c) => c.isoCode === countryCode);
    const stateObj = State.getStatesOfCountry(countryCode).find((s) => s.isoCode === stateCode);
    const stateNameOrCode = stateObj ? stateObj.name : stateCode;
    const countryName = country ? country.name : countryCode;

    const full = buildFullAddress(street, postal, city, stateNameOrCode, countryName);
    lastEmittedAddressRef.current = full;
    onShippingAddressChange(full);
  };

  // Handlers for structured inputs
  const handleStreetChange = (val: string) => {
    setStreetAddress(val);
    emitAddress(val, postalCode, selectedCityName, selectedStateCode, selectedCountryCode);
  };

  const handlePostalChange = (val: string) => {
    setPostalCode(val);
    emitAddress(streetAddress, val, selectedCityName, selectedStateCode, selectedCountryCode);
  };

  const handleCountryChange = (newCountryCode: string) => {
    setSelectedCountryCode(newCountryCode);
    setSelectedStateCode("");
    setSelectedCityName("");
    setIsCustomCity(false);

    // Auto-prefill phone dial code if phone is empty or only holds previous dial code
    const countryObj = allCountries.find((c) => c.isoCode === newCountryCode);
    if (countryObj?.phonecode) {
      const dialCode = `+${countryObj.phonecode.replace(/^\+/, "")} `;
      if (!phoneNumber || /^\+\d+\s*$/.test(phoneNumber.trim())) {
        onPhoneNumberChange(dialCode);
      }
    }

    emitAddress(streetAddress, postalCode, "", "", newCountryCode);
  };

  const handleStateChange = (newStateCode: string) => {
    setSelectedStateCode(newStateCode);
    setSelectedCityName("");
    setIsCustomCity(false);
    emitAddress(streetAddress, postalCode, "", newStateCode, selectedCountryCode);
  };

  const handleCityChange = (newCityName: string) => {
    setSelectedCityName(newCityName);
    emitAddress(streetAddress, postalCode, newCityName, selectedStateCode, selectedCountryCode);
  };

  const handleApplySavedAddress = (savedAddr: string) => {
    lastEmittedAddressRef.current = savedAddr;
    onShippingAddressChange(savedAddr);
    const parsed = parseAddressToParts(savedAddr, currency, allCountries);
    setStreetAddress(parsed.street);
    setPostalCode(parsed.postalCode);
    if (parsed.countryCode) setSelectedCountryCode(parsed.countryCode);
    setSelectedStateCode(parsed.stateCode);
    setSelectedCityName(parsed.cityName);
  };

  // Priority-based tax detection: 1. Shipping Address (Destination), 2. Vendor Location (Origin)
  const taxEstimate: PriorityTaxEstimate | null = useMemo(() => {
    return detectTaxWithPriority({
      shippingAddress,
      vendorAddress,
      vendorName,
      knownVendorLocations,
      currency,
    });
  }, [shippingAddress, vendorAddress, vendorName, knownVendorLocations, currency]);

  const estimatedTaxAmount = useMemo(() => {
    if (!taxEstimate || subtotal <= 0) return 0;
    return Math.round(subtotal * taxEstimate.rateDecimal * 100) / 100;
  }, [taxEstimate, subtotal]);

  const datalistId = `${idPrefix}-saved-shipping-addresses-list`;

  return (
    <div
      className={`p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800 space-y-3.5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
            Shipping &amp; Delivery Details
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastUsedAddress && shippingAddress !== lastUsedAddress && !disabled && (
            <button
              type="button"
              onClick={() => handleApplySavedAddress(lastUsedAddress)}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <Clock className="h-3 w-3" /> Use last address
            </button>
          )}
          <button
            type="button"
            onClick={() => setUseSingleLineMode((v) => !v)}
            className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>{useSingleLineMode ? "Structured Fields" : "Single-Line Mode"}</span>
          </button>
          <span className="text-[11px] text-slate-400 font-normal">Optional</span>
        </div>
      </div>

      {useSingleLineMode ? (
        /* Fallback Single-Line Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-500" />
              <span>Full Shipping Address</span>
            </label>
            <Input
              list={datalistId}
              value={shippingAddress}
              disabled={disabled}
              onChange={(e) => onShippingAddressChange(e.target.value)}
              placeholder="e.g. 100 Main Street, Suite 400, Austin, TX 78701, United States"
              className="h-8.5 text-xs bg-white dark:bg-zinc-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
              <Phone className="h-3 w-3 text-slate-500" />
              <span>Contact Phone Number</span>
            </label>
            <Input
              type="tel"
              value={phoneNumber}
              disabled={disabled}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              placeholder="e.g. +1 (555) 019-2834"
              className="h-8.5 text-xs bg-white dark:bg-zinc-900"
            />
          </div>
        </div>
      ) : (
        /* Standard Structured Address: Above = Unit/Street + Postal Code + Phone */
        <div className="space-y-3">
          {/* Top Row: Street / Unit & Postal Code & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Street Address & Unit */}
            <div className="sm:col-span-6 space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                <Building className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span>Street Address &amp; Unit / Suite</span>
              </label>
              <Input
                value={streetAddress}
                disabled={disabled}
                onChange={(e) => handleStreetChange(e.target.value)}
                placeholder="e.g. 100 Main Street, Suite 400"
                className="h-8.5 text-xs bg-white dark:bg-zinc-900"
              />
            </div>

            {/* Postal / ZIP Code */}
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                <Mail className="h-3 w-3 text-slate-500" />
                <span>Postal / ZIP Code</span>
              </label>
              <Input
                value={postalCode}
                disabled={disabled}
                onChange={(e) => handlePostalChange(e.target.value)}
                placeholder="e.g. 90210 or M5V 2T6"
                className="h-8.5 text-xs bg-white dark:bg-zinc-900 uppercase"
              />
            </div>

            {/* Contact Phone */}
            <div className="sm:col-span-3 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-500" />
                  <span>Contact Phone</span>
                </label>
                {selectedCountryObj?.phonecode && !phoneNumber && !disabled && (
                  <button
                    type="button"
                    onClick={() =>
                      onPhoneNumberChange(`+${selectedCountryObj.phonecode.replace(/^\+/, "")} `)
                    }
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    +{selectedCountryObj.phonecode.replace(/^\+/, "")}
                  </button>
                )}
              </div>
              <Input
                type="tel"
                value={phoneNumber}
                disabled={disabled}
                onChange={(e) => onPhoneNumberChange(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="h-8.5 text-xs bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          {/* Base Foundation Row: Global Location Finder (Country · State/Province · City) */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 dark:text-zinc-200">
                <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Global Location Base</span>
                <span className="text-[10px] font-normal text-slate-400">
                  (250 Countries, States &amp; Cities)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                {selectedCountryObj?.flag} {selectedCountryObj?.name}
                {selectedStateObj ? ` · ${selectedStateObj.name}` : ""}
                {selectedCityName ? ` · ${selectedCityName}` : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* 1. Country Selection */}
              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400">
                  Country
                </label>
                <select
                  value={selectedCountryCode}
                  disabled={disabled}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  {allCountries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.flag ? `${c.flag} ` : ""}{c.name} ({c.isoCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. State / Province Selection */}
              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400 flex items-center justify-between">
                  <span>State / Province</span>
                  <span className="text-[9px] text-slate-400 font-normal">
                    {statesOfCountry.length ? `${statesOfCountry.length} regions` : "None"}
                  </span>
                </label>
                <select
                  value={selectedStateCode}
                  disabled={disabled || statesOfCountry.length === 0}
                  onChange={(e) => handleStateChange(e.target.value)}
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
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400">
                    City
                  </label>
                  {citiesOfState.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCustomCity((v) => !v)}
                      className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isCustomCity ? "Choose from list" : "Type custom"}
                    </button>
                  )}
                </div>
                {citiesOfState.length > 0 && !isCustomCity ? (
                  <select
                    value={selectedCityName}
                    disabled={disabled}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select City --</option>
                    {citiesOfState.slice(0, 400).map((ct, idx) => (
                      <option key={`${ct.name}-${idx}`} value={ct.name}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={selectedCityName}
                    disabled={disabled}
                    onChange={(e) => handleCityChange(e.target.value)}
                    placeholder="Enter city name..."
                    className="h-8 text-xs bg-white dark:bg-zinc-800"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compiled Delivery Address Preview */}
      {shippingAddress && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100/90 dark:bg-zinc-800/60 text-[11px] text-slate-600 dark:text-zinc-300">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-zinc-200 shrink-0">
              Delivery Destination:
            </span>
            <span className="truncate">{shippingAddress}</span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onShippingAddressChange("")}
              className="text-[10px] text-slate-400 hover:text-rose-500 ml-2 shrink-0 cursor-pointer"
              title="Clear address"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Recent Address Quick Chips */}
      {allSavedAddresses.length > 0 && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-slate-400">Recent:</span>
          {allSavedAddresses.slice(0, 3).map((addr, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplySavedAddress(addr)}
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

      {/* Auto Tax Estimation Badge & Quick Set (Priority: 1. Delivery, 2. Vendor) */}
      {taxEstimate && (
        <div className="p-2.5 rounded-lg bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2 truncate">
            {taxEstimate.sourcing === "DESTINATION" ? (
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            ) : (
              <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            )}
            <div className="truncate min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
                  {taxEstimate.sourcing === "DESTINATION" ? "Est. Delivery Tax" : "Est. Vendor Tax"} ({taxEstimate.regionName}):
                </span>
                <span className="font-medium text-blue-700 dark:text-blue-300 shrink-0">
                  {taxEstimate.ratePercent}% {taxEstimate.taxType}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                {taxEstimate.sourcing === "DESTINATION"
                  ? "Destination-Based: based on delivery shipping address"
                  : `Origin-Based: based on vendor location (${taxEstimate.sourcingLabel})`}
              </p>
            </div>
          </div>
          {onApplyEstimatedTax && estimatedTaxAmount > 0 && !disabled && (
            <button
              type="button"
              onClick={() => onApplyEstimatedTax(estimatedTaxAmount)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors shrink-0 ml-2 cursor-pointer shadow-xs ${
                currentTaxFee === estimatedTaxAmount
                  ? "bg-blue-600 text-white dark:bg-blue-500"
                  : "bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/60 dark:hover:bg-blue-800 dark:text-blue-200"
              }`}
              title="Click to apply starting set point (field remains editable)"
            >
              {currentTaxFee === estimatedTaxAmount
                ? "✓ Applied"
                : `Set to $${formatMoney(estimatedTaxAmount)}`}
            </button>
          )}
        </div>
      )}

      <datalist id={datalistId}>
        {allSavedAddresses.map((addr, i) => (
          <option key={i} value={addr} />
        ))}
      </datalist>
    </div>
  );
}
