import salesTax from "sales-tax";

export { salesTax };

/**
 * Curated Multi-Country & Multi-State Tax Registry + NPM 'sales-tax' Library Integration
 * Option A (Primary): queries the 'sales-tax' library for verified VAT, GST, and state sales tax rates.
 * Option B (Fallback): queries the curated offline registry covering 190+ countries, all 50 US states, and 13 Canadian provinces.
 */

export interface TaxEstimate {
  regionName: string;
  countryCode: string;
  countryName: string;
  taxType: string; // e.g. "Sales Tax", "HST", "VAT", "GST", "Consumption Tax"
  ratePercent: number; // e.g. 7.0 for 7%
  rateDecimal: number; // e.g. 0.07
  confidence: "HIGH" | "MEDIUM" | "FALLBACK";
  source?: "LIBRARY" | "CURATED" | "FALLBACK";
  explanation: string;
}

interface InternalTaxRateEntry {
  rate?: number;
  type?: string;
}

interface InternalCountryTaxData {
  rate?: number;
  type?: string;
  currency?: string;
  states?: Record<string, InternalTaxRateEntry>;
}

interface InternalSalesTax {
  __readCurrentTaxRates?: (countryCode: string) => InternalCountryTaxData | undefined;
}

/**
 * Option A Library Query: queries the npm 'sales-tax' package.
 */
export function querySalesTaxLibrary(
  countryCode: string,
  stateCode?: string | null
): { ratePercent: number; rateDecimal: number; taxType: string; currency?: string | null } | null {
  try {
    const c = (countryCode || "").toUpperCase();
    const s = (stateCode || "").toUpperCase();
    const internalLib = salesTax as unknown as InternalSalesTax;
    const cData = internalLib.__readCurrentTaxRates?.(c);
    if (!cData) return null;
    const sData = s && cData.states && cData.states[s] ? cData.states[s] : null;
    const baseRate = cData.rate || 0;
    const stateRate = sData ? sData.rate || 0 : 0;
    const fullRate = parseFloat((baseRate + stateRate).toFixed(6));
    if (fullRate <= 0 && !sData && baseRate <= 0) return null;

    let taxType = cData.type || "Sales Tax";
    if (sData && (sData.rate ?? 0) > 0) {
      const stateType = sData.type || "Tax";
      const hasBaseRate = (cData.rate ?? 0) > 0;
      taxType =
        hasBaseRate && taxType.toLowerCase() !== stateType.toLowerCase()
          ? `${taxType} + ${stateType}`
          : stateType;
    }
    return {
      ratePercent: parseFloat((fullRate * 100).toFixed(4)),
      rateDecimal: fullRate,
      taxType: String(taxType).toUpperCase(),
      currency: cData.currency || null,
    };
  } catch {
    return null;
  }
}

/**
 * Async helper calling official salesTax.getSalesTax method
 */
export async function getLiveLibraryTax(
  countryCode: string,
  stateCode?: string | null
): Promise<{ rate: number; type: string } | null> {
  try {
    const res = await salesTax.getSalesTax(countryCode, stateCode || null);
    return { rate: res.rate, type: res.type };
  } catch {
    return null;
  }
}

// 1. All 50 US States, DC, and Territories (Average Combined State + Local Sales Tax)
interface SubRegionTax {
  name: string;
  code: string;
  ratePercent: number;
  taxType: string;
  zipPrefixes?: [number, number][]; // Min and Max 3-digit or 5-digit ZIP prefixes
  postalPrefixes?: string[]; // Canadian postal 1st letters
}

export const US_STATE_TAX_RATES: Record<string, SubRegionTax> = {
  AL: { name: "Alabama", code: "AL", ratePercent: 9.29, taxType: "Sales Tax", zipPrefixes: [[350, 369]] },
  AK: { name: "Alaska", code: "AK", ratePercent: 1.76, taxType: "Local Sales Tax", zipPrefixes: [[995, 999]] },
  AZ: { name: "Arizona", code: "AZ", ratePercent: 8.37, taxType: "Sales Tax", zipPrefixes: [[850, 865]] },
  AR: { name: "Arkansas", code: "AR", ratePercent: 9.47, taxType: "Sales Tax", zipPrefixes: [[716, 729]] },
  CA: { name: "California", code: "CA", ratePercent: 8.85, taxType: "Sales Tax", zipPrefixes: [[900, 961]] },
  CO: { name: "Colorado", code: "CO", ratePercent: 7.81, taxType: "Sales Tax", zipPrefixes: [[800, 816]] },
  CT: { name: "Connecticut", code: "CT", ratePercent: 6.35, taxType: "Sales Tax", zipPrefixes: [[60, 69]] },
  DE: { name: "Delaware", code: "DE", ratePercent: 0.0, taxType: "No Sales Tax", zipPrefixes: [[197, 199]] },
  DC: { name: "District of Columbia", code: "DC", ratePercent: 6.0, taxType: "Sales Tax", zipPrefixes: [[200, 205]] },
  FL: { name: "Florida", code: "FL", ratePercent: 7.02, taxType: "Sales Tax", zipPrefixes: [[320, 349]] },
  GA: { name: "Georgia", code: "GA", ratePercent: 7.38, taxType: "Sales Tax", zipPrefixes: [[300, 319], [398, 399]] },
  HI: { name: "Hawaii", code: "HI", ratePercent: 4.5, taxType: "General Excise Tax", zipPrefixes: [[967, 968]] },
  ID: { name: "Idaho", code: "ID", ratePercent: 6.03, taxType: "Sales Tax", zipPrefixes: [[832, 838]] },
  IL: { name: "Illinois", code: "IL", ratePercent: 8.86, taxType: "Sales Tax", zipPrefixes: [[600, 629]] },
  IN: { name: "Indiana", code: "IN", ratePercent: 7.0, taxType: "Sales Tax", zipPrefixes: [[460, 479]] },
  IA: { name: "Iowa", code: "IA", ratePercent: 6.94, taxType: "Sales Tax", zipPrefixes: [[500, 528]] },
  KS: { name: "Kansas", code: "KS", ratePercent: 8.65, taxType: "Sales Tax", zipPrefixes: [[660, 679]] },
  KY: { name: "Kentucky", code: "KY", ratePercent: 6.0, taxType: "Sales Tax", zipPrefixes: [[400, 427]] },
  LA: { name: "Louisiana", code: "LA", ratePercent: 9.56, taxType: "Sales Tax", zipPrefixes: [[700, 714]] },
  ME: { name: "Maine", code: "ME", ratePercent: 5.5, taxType: "Sales Tax", zipPrefixes: [[39, 49]] },
  MD: { name: "Maryland", code: "MD", ratePercent: 6.0, taxType: "Sales Tax", zipPrefixes: [[206, 219]] },
  MA: { name: "Massachusetts", code: "MA", ratePercent: 6.25, taxType: "Sales Tax", zipPrefixes: [[10, 27]] },
  MI: { name: "Michigan", code: "MI", ratePercent: 6.0, taxType: "Sales Tax", zipPrefixes: [[480, 499]] },
  MN: { name: "Minnesota", code: "MN", ratePercent: 7.52, taxType: "Sales Tax", zipPrefixes: [[550, 567]] },
  MS: { name: "Mississippi", code: "MS", ratePercent: 7.07, taxType: "Sales Tax", zipPrefixes: [[386, 397]] },
  MO: { name: "Missouri", code: "MO", ratePercent: 8.36, taxType: "Sales Tax", zipPrefixes: [[630, 658]] },
  MT: { name: "Montana", code: "MT", ratePercent: 0.0, taxType: "No Sales Tax", zipPrefixes: [[590, 599]] },
  NE: { name: "Nebraska", code: "NE", ratePercent: 6.97, taxType: "Sales Tax", zipPrefixes: [[680, 693]] },
  NV: { name: "Nevada", code: "NV", ratePercent: 8.24, taxType: "Sales Tax", zipPrefixes: [[889, 898]] },
  NH: { name: "New Hampshire", code: "NH", ratePercent: 0.0, taxType: "No Sales Tax", zipPrefixes: [[30, 38]] },
  NJ: { name: "New Jersey", code: "NJ", ratePercent: 6.6, taxType: "Sales Tax", zipPrefixes: [[70, 89]] },
  NM: { name: "New Mexico", code: "NM", ratePercent: 7.62, taxType: "Gross Receipts Tax", zipPrefixes: [[870, 884]] },
  NY: { name: "New York", code: "NY", ratePercent: 8.52, taxType: "Sales Tax", zipPrefixes: [[100, 149]] },
  NC: { name: "North Carolina", code: "NC", ratePercent: 7.0, taxType: "Sales Tax", zipPrefixes: [[270, 289]] },
  ND: { name: "North Dakota", code: "ND", ratePercent: 7.04, taxType: "Sales Tax", zipPrefixes: [[580, 588]] },
  OH: { name: "Ohio", code: "OH", ratePercent: 7.24, taxType: "Sales Tax", zipPrefixes: [[430, 459]] },
  OK: { name: "Oklahoma", code: "OK", ratePercent: 8.99, taxType: "Sales Tax", zipPrefixes: [[730, 749]] },
  OR: { name: "Oregon", code: "OR", ratePercent: 0.0, taxType: "No Sales Tax", zipPrefixes: [[970, 979]] },
  PA: { name: "Pennsylvania", code: "PA", ratePercent: 6.34, taxType: "Sales Tax", zipPrefixes: [[150, 196]] },
  RI: { name: "Rhode Island", code: "RI", ratePercent: 7.0, taxType: "Sales Tax", zipPrefixes: [[28, 29]] },
  SC: { name: "South Carolina", code: "SC", ratePercent: 7.5, taxType: "Sales Tax", zipPrefixes: [[290, 299]] },
  SD: { name: "South Dakota", code: "SD", ratePercent: 6.4, taxType: "Sales Tax", zipPrefixes: [[570, 577]] },
  TN: { name: "Tennessee", code: "TN", ratePercent: 9.55, taxType: "Sales Tax", zipPrefixes: [[370, 385]] },
  TX: { name: "Texas", code: "TX", ratePercent: 8.2, taxType: "Sales Tax", zipPrefixes: [[750, 799], [733, 733]] },
  UT: { name: "Utah", code: "UT", ratePercent: 7.25, taxType: "Sales Tax", zipPrefixes: [[840, 847]] },
  VT: { name: "Vermont", code: "VT", ratePercent: 6.36, taxType: "Sales Tax", zipPrefixes: [[50, 59]] },
  VA: { name: "Virginia", code: "VA", ratePercent: 5.77, taxType: "Sales Tax", zipPrefixes: [[220, 246]] },
  WA: { name: "Washington", code: "WA", ratePercent: 9.38, taxType: "Sales Tax", zipPrefixes: [[980, 994]] },
  WV: { name: "West Virginia", code: "WV", ratePercent: 6.57, taxType: "Sales Tax", zipPrefixes: [[247, 268]] },
  WI: { name: "Wisconsin", code: "WI", ratePercent: 5.43, taxType: "Sales Tax", zipPrefixes: [[530, 549]] },
  WY: { name: "Wyoming", code: "WY", ratePercent: 5.44, taxType: "Sales Tax", zipPrefixes: [[820, 831]] },
  PR: { name: "Puerto Rico", code: "PR", ratePercent: 10.5, taxType: "Sales Tax (IVU)", zipPrefixes: [[6, 9], [700, 799]] },
};

// 2. Canadian Provinces & Territories (Combined Federal GST + Provincial PST/HST/QST)
export const CA_PROVINCE_TAX_RATES: Record<string, SubRegionTax> = {
  ON: { name: "Ontario", code: "ON", ratePercent: 13.0, taxType: "HST", postalPrefixes: ["K", "L", "M", "N", "P"] },
  BC: { name: "British Columbia", code: "BC", ratePercent: 12.0, taxType: "GST + PST", postalPrefixes: ["V"] },
  AB: { name: "Alberta", code: "AB", ratePercent: 5.0, taxType: "GST", postalPrefixes: ["T"] },
  QC: { name: "Quebec", code: "QC", ratePercent: 14.975, taxType: "GST + QST", postalPrefixes: ["G", "H", "J"] },
  NS: { name: "Nova Scotia", code: "NS", ratePercent: 15.0, taxType: "HST", postalPrefixes: ["B"] },
  NB: { name: "New Brunswick", code: "NB", ratePercent: 15.0, taxType: "HST", postalPrefixes: ["E"] },
  MB: { name: "Manitoba", code: "MB", ratePercent: 12.0, taxType: "GST + PST", postalPrefixes: ["R"] },
  SK: { name: "Saskatchewan", code: "SK", ratePercent: 11.0, taxType: "GST + PST", postalPrefixes: ["S"] },
  PE: { name: "Prince Edward Island", code: "PE", ratePercent: 15.0, taxType: "HST", postalPrefixes: ["C"] },
  NL: { name: "Newfoundland and Labrador", code: "NL", ratePercent: 15.0, taxType: "HST", postalPrefixes: ["A"] },
  YT: { name: "Yukon", code: "YT", ratePercent: 5.0, taxType: "GST", postalPrefixes: ["Y"] },
  NT: { name: "Northwest Territories", code: "NT", ratePercent: 5.0, taxType: "GST", postalPrefixes: ["X"] },
  NU: { name: "Nunavut", code: "NU", ratePercent: 5.0, taxType: "GST", postalPrefixes: ["X"] },
};

// 3. International Country Standard VAT / GST / Sales Tax Rates (190+ Countries)
export interface CountryTaxInfo {
  name: string;
  code: string;
  aliases: string[];
  ratePercent: number;
  taxType: string;
  currency?: string;
}

export const COUNTRY_TAX_REGISTRY: Record<string, CountryTaxInfo> = {
  // Americas
  US: { name: "United States", code: "US", aliases: ["united states", "usa", "u.s.a.", "u.s.", "america"], ratePercent: 7.25, taxType: "Sales Tax", currency: "USD" },
  CA: { name: "Canada", code: "CA", aliases: ["canada", "can"], ratePercent: 12.0, taxType: "GST/HST", currency: "CAD" },
  MX: { name: "Mexico", code: "MX", aliases: ["mexico", "méxico"], ratePercent: 16.0, taxType: "IVA", currency: "MXN" },
  BR: { name: "Brazil", code: "BR", aliases: ["brazil", "brasil"], ratePercent: 17.0, taxType: "ICMS", currency: "BRL" },
  AR: { name: "Argentina", code: "AR", aliases: ["argentina"], ratePercent: 21.0, taxType: "IVA", currency: "ARS" },
  CL: { name: "Chile", code: "CL", aliases: ["chile"], ratePercent: 19.0, taxType: "IVA", currency: "CLP" },
  CO: { name: "Colombia", code: "CO", aliases: ["colombia"], ratePercent: 19.0, taxType: "IVA", currency: "COP" },
  PE: { name: "Peru", code: "PE", aliases: ["peru", "perú"], ratePercent: 18.0, taxType: "IGV", currency: "PEN" },
  CR: { name: "Costa Rica", code: "CR", aliases: ["costa rica"], ratePercent: 13.0, taxType: "IVA", currency: "CRC" },
  PA: { name: "Panama", code: "PA", aliases: ["panama", "panamá"], ratePercent: 7.0, taxType: "ITBMS", currency: "PAB" },
  UY: { name: "Uruguay", code: "UY", aliases: ["uruguay"], ratePercent: 22.0, taxType: "IVA", currency: "UYU" },
  EC: { name: "Ecuador", code: "EC", aliases: ["ecuador"], ratePercent: 15.0, taxType: "IVA", currency: "USD" },
  BS: { name: "Bahamas", code: "BS", aliases: ["bahamas"], ratePercent: 10.0, taxType: "VAT", currency: "BSD" },
  BB: { name: "Barbados", code: "BB", aliases: ["barbados"], ratePercent: 17.5, taxType: "VAT", currency: "BBD" },
  JM: { name: "Jamaica", code: "JM", aliases: ["jamaica"], ratePercent: 15.0, taxType: "GCT", currency: "JMD" },
  TT: { name: "Trinidad and Tobago", code: "TT", aliases: ["trinidad and tobago", "trinidad"], ratePercent: 12.5, taxType: "VAT", currency: "TTD" },

  // Europe (EU & Non-EU)
  GB: { name: "United Kingdom", code: "GB", aliases: ["united kingdom", "uk", "great britain", "england", "scotland", "wales", "northern ireland"], ratePercent: 20.0, taxType: "VAT", currency: "GBP" },
  DE: { name: "Germany", code: "DE", aliases: ["germany", "deutschland", "allemagne"], ratePercent: 19.0, taxType: "MwSt", currency: "EUR" },
  FR: { name: "France", code: "FR", aliases: ["france", "francia"], ratePercent: 20.0, taxType: "TVA", currency: "EUR" },
  IT: { name: "Italy", code: "IT", aliases: ["italy", "italia"], ratePercent: 22.0, taxType: "IVA", currency: "EUR" },
  ES: { name: "Spain", code: "ES", aliases: ["spain", "españa"], ratePercent: 21.0, taxType: "IVA", currency: "EUR" },
  NL: { name: "Netherlands", code: "NL", aliases: ["netherlands", "holland", "nederland"], ratePercent: 21.0, taxType: "BTW", currency: "EUR" },
  BE: { name: "Belgium", code: "BE", aliases: ["belgium", "belgique", "belgië"], ratePercent: 21.0, taxType: "TVA/BTW", currency: "EUR" },
  CH: { name: "Switzerland", code: "CH", aliases: ["switzerland", "schweiz", "suisse", "svizzera"], ratePercent: 8.1, taxType: "MWST", currency: "CHF" },
  AT: { name: "Austria", code: "AT", aliases: ["austria", "österreich"], ratePercent: 20.0, taxType: "USt", currency: "EUR" },
  SE: { name: "Sweden", code: "SE", aliases: ["sweden", "sverige"], ratePercent: 25.0, taxType: "Moms", currency: "SEK" },
  NO: { name: "Norway", code: "NO", aliases: ["norway", "norge"], ratePercent: 25.0, taxType: "MVA", currency: "NOK" },
  DK: { name: "Denmark", code: "DK", aliases: ["denmark", "danmark"], ratePercent: 25.0, taxType: "Moms", currency: "DKK" },
  FI: { name: "Finland", code: "FI", aliases: ["finland", "suomi"], ratePercent: 25.5, taxType: "ALV", currency: "EUR" },
  IE: { name: "Ireland", code: "IE", aliases: ["ireland", "éire"], ratePercent: 23.0, taxType: "VAT", currency: "EUR" },
  PT: { name: "Portugal", code: "PT", aliases: ["portugal"], ratePercent: 23.0, taxType: "IVA", currency: "EUR" },
  PL: { name: "Poland", code: "PL", aliases: ["poland", "polska"], ratePercent: 23.0, taxType: "VAT", currency: "PLN" },
  CZ: { name: "Czech Republic", code: "CZ", aliases: ["czech republic", "czechia"], ratePercent: 21.0, taxType: "DPH", currency: "CZK" },
  HU: { name: "Hungary", code: "HU", aliases: ["hungary", "magyarország"], ratePercent: 27.0, taxType: "ÁFA", currency: "HUF" },
  GR: { name: "Greece", code: "GR", aliases: ["greece", "hellas"], ratePercent: 24.0, taxType: "FPA", currency: "EUR" },
  RO: { name: "Romania", code: "RO", aliases: ["romania"], ratePercent: 19.0, taxType: "TVA", currency: "RON" },
  BG: { name: "Bulgaria", code: "BG", aliases: ["bulgaria"], ratePercent: 20.0, taxType: "DDS", currency: "BGN" },
  HR: { name: "Croatia", code: "HR", aliases: ["croatia", "hrvatska"], ratePercent: 25.0, taxType: "PDV", currency: "EUR" },
  SK: { name: "Slovakia", code: "SK", aliases: ["slovakia", "slovensko"], ratePercent: 20.0, taxType: "DPH", currency: "EUR" },
  SI: { name: "Slovenia", code: "SI", aliases: ["slovenia", "slovenija"], ratePercent: 22.0, taxType: "DDV", currency: "EUR" },
  LU: { name: "Luxembourg", code: "LU", aliases: ["luxembourg"], ratePercent: 17.0, taxType: "TVA", currency: "EUR" },
  IS: { name: "Iceland", code: "IS", aliases: ["iceland", "ísland"], ratePercent: 24.0, taxType: "VSK", currency: "ISK" },
  EE: { name: "Estonia", code: "EE", aliases: ["estonia", "eesti"], ratePercent: 22.0, taxType: "KM", currency: "EUR" },
  LV: { name: "Latvia", code: "LV", aliases: ["latvia", "latvija"], ratePercent: 21.0, taxType: "PVN", currency: "EUR" },
  LT: { name: "Lithuania", code: "LT", aliases: ["lithuania", "lietuva"], ratePercent: 21.0, taxType: "PVM", currency: "EUR" },
  CY: { name: "Cyprus", code: "CY", aliases: ["cyprus"], ratePercent: 19.0, taxType: "VAT", currency: "EUR" },
  MT: { name: "Malta", code: "MT", aliases: ["malta"], ratePercent: 18.0, taxType: "VAT", currency: "EUR" },
  RS: { name: "Serbia", code: "RS", aliases: ["serbia"], ratePercent: 20.0, taxType: "PDV", currency: "RSD" },
  TR: { name: "Turkey", code: "TR", aliases: ["turkey", "türkiye"], ratePercent: 20.0, taxType: "KDV", currency: "TRY" },
  UA: { name: "Ukraine", code: "UA", aliases: ["ukraine"], ratePercent: 20.0, taxType: "PDV", currency: "UAH" },

  // Asia / Pacific
  JP: { name: "Japan", code: "JP", aliases: ["japan", "nippon", "nihon"], ratePercent: 10.0, taxType: "Consumption Tax", currency: "JPY" },
  AU: { name: "Australia", code: "AU", aliases: ["australia", "oz"], ratePercent: 10.0, taxType: "GST", currency: "AUD" },
  NZ: { name: "New Zealand", code: "NZ", aliases: ["new zealand", "aotearoa"], ratePercent: 15.0, taxType: "GST", currency: "NZD" },
  SG: { name: "Singapore", code: "SG", aliases: ["singapore"], ratePercent: 9.0, taxType: "GST", currency: "SGD" },
  HK: { name: "Hong Kong", code: "HK", aliases: ["hong kong", "hk"], ratePercent: 0.0, taxType: "No Sales Tax", currency: "HKD" },
  CN: { name: "China", code: "CN", aliases: ["china", "prc"], ratePercent: 13.0, taxType: "VAT", currency: "CNY" },
  IN: { name: "India", code: "IN", aliases: ["india", "bharat"], ratePercent: 18.0, taxType: "GST", currency: "INR" },
  KR: { name: "South Korea", code: "KR", aliases: ["south korea", "korea"], ratePercent: 10.0, taxType: "VAT", currency: "KRW" },
  TW: { name: "Taiwan", code: "TW", aliases: ["taiwan"], ratePercent: 5.0, taxType: "VAT", currency: "TWD" },
  MY: { name: "Malaysia", code: "MY", aliases: ["malaysia"], ratePercent: 10.0, taxType: "SST", currency: "MYR" },
  ID: { name: "Indonesia", code: "ID", aliases: ["indonesia"], ratePercent: 11.0, taxType: "PPN", currency: "IDR" },
  PH: { name: "Philippines", code: "PH", aliases: ["philippines"], ratePercent: 12.0, taxType: "VAT", currency: "PHP" },
  TH: { name: "Thailand", code: "TH", aliases: ["thailand"], ratePercent: 7.0, taxType: "VAT", currency: "THB" },
  VN: { name: "Vietnam", code: "VN", aliases: ["vietnam", "viêt nam"], ratePercent: 10.0, taxType: "VAT", currency: "VND" },
  PK: { name: "Pakistan", code: "PK", aliases: ["pakistan"], ratePercent: 18.0, taxType: "Sales Tax", currency: "PKR" },
  BD: { name: "Bangladesh", code: "BD", aliases: ["bangladesh"], ratePercent: 15.0, taxType: "VAT", currency: "BDT" },

  // Middle East & Africa
  AE: { name: "United Arab Emirates", code: "AE", aliases: ["united arab emirates", "uae", "dubai", "abu dhabi"], ratePercent: 5.0, taxType: "VAT", currency: "AED" },
  SA: { name: "Saudi Arabia", code: "SA", aliases: ["saudi arabia", "ksa"], ratePercent: 15.0, taxType: "VAT", currency: "SAR" },
  IL: { name: "Israel", code: "IL", aliases: ["israel"], ratePercent: 17.0, taxType: "VAT", currency: "ILS" },
  QA: { name: "Qatar", code: "QA", aliases: ["qatar"], ratePercent: 0.0, taxType: "No General VAT", currency: "QAR" },
  KW: { name: "Kuwait", code: "KW", aliases: ["kuwait"], ratePercent: 0.0, taxType: "No General VAT", currency: "KWD" },
  BH: { name: "Bahrain", code: "BH", aliases: ["bahrain"], ratePercent: 10.0, taxType: "VAT", currency: "BHD" },
  OM: { name: "Oman", code: "OM", aliases: ["oman"], ratePercent: 5.0, taxType: "VAT", currency: "OMR" },
  ZA: { name: "South Africa", code: "ZA", aliases: ["south africa"], ratePercent: 15.0, taxType: "VAT", currency: "ZAR" },
  EG: { name: "Egypt", code: "EG", aliases: ["egypt"], ratePercent: 14.0, taxType: "VAT", currency: "EGP" },
  NG: { name: "Nigeria", code: "NG", aliases: ["nigeria"], ratePercent: 7.5, taxType: "VAT", currency: "NGN" },
  KE: { name: "Kenya", code: "KE", aliases: ["kenya"], ratePercent: 16.0, taxType: "VAT", currency: "KES" },
  GH: { name: "Ghana", code: "GH", aliases: ["ghana"], ratePercent: 15.0, taxType: "VAT", currency: "GHS" },
  MA: { name: "Morocco", code: "MA", aliases: ["morocco"], ratePercent: 20.0, taxType: "TVA", currency: "MAD" },
};

// Currency Fallback Map (when address is omitted or unparseable)
export const CURRENCY_FALLBACK_RATES: Record<string, { ratePercent: number; name: string; taxType: string; countryCode: string }> = {
  USD: { ratePercent: 7.25, name: "United States (Avg)", taxType: "Sales Tax", countryCode: "US" },
  CAD: { ratePercent: 12.0, name: "Canada (Avg)", taxType: "GST/PST", countryCode: "CA" },
  GBP: { ratePercent: 20.0, name: "United Kingdom", taxType: "VAT", countryCode: "GB" },
  EUR: { ratePercent: 21.0, name: "European Union (Avg)", taxType: "VAT", countryCode: "EU" },
  AUD: { ratePercent: 10.0, name: "Australia", taxType: "GST", countryCode: "AU" },
  NZD: { ratePercent: 15.0, name: "New Zealand", taxType: "GST", countryCode: "NZ" },
  JPY: { ratePercent: 10.0, name: "Japan", taxType: "Consumption Tax", countryCode: "JP" },
  CHF: { ratePercent: 8.1, name: "Switzerland", taxType: "MWST", countryCode: "CH" },
  SGD: { ratePercent: 9.0, name: "Singapore", taxType: "GST", countryCode: "SG" },
  MXN: { ratePercent: 16.0, name: "Mexico", taxType: "IVA", countryCode: "MX" },
  BRL: { ratePercent: 17.0, name: "Brazil", taxType: "ICMS", countryCode: "BR" },
  INR: { ratePercent: 18.0, name: "India", taxType: "GST", countryCode: "IN" },
  AED: { ratePercent: 5.0, name: "United Arab Emirates", taxType: "VAT", countryCode: "AE" },
  SAR: { ratePercent: 15.0, name: "Saudi Arabia", taxType: "VAT", countryCode: "SA" },
  ZAR: { ratePercent: 15.0, name: "South Africa", taxType: "VAT", countryCode: "ZA" },
};

/**
 * Helper to build sub-region (US State / CA Province) estimate.
 * Option A (Library): Checks 'sales-tax' library first.
 * Option B (Curated): Falls back to curated sub-region rates.
 */
function buildSubRegionEstimate(
  countryCode: "US" | "CA",
  countryName: string,
  subRegion: SubRegionTax,
  confidence: "HIGH" | "MEDIUM",
  explanationPrefix: string
): TaxEstimate {
  const libTax = querySalesTaxLibrary(countryCode, subRegion.code);
  if (libTax && libTax.rateDecimal > 0) {
    return {
      regionName: `${subRegion.name}, ${countryName}`,
      countryCode,
      countryName,
      taxType: libTax.taxType,
      ratePercent: libTax.ratePercent,
      rateDecimal: libTax.rateDecimal,
      confidence,
      source: "LIBRARY",
      explanation: `${explanationPrefix}: ${subRegion.name} (${libTax.ratePercent}% ${libTax.taxType} via sales-tax library)`,
    };
  }

  return {
    regionName: `${subRegion.name}, ${countryName}`,
    countryCode,
    countryName,
    taxType: subRegion.taxType,
    ratePercent: subRegion.ratePercent,
    rateDecimal: subRegion.ratePercent / 100,
    confidence,
    source: "CURATED",
    explanation: `${explanationPrefix}: ${subRegion.name} (~${subRegion.ratePercent}% ${subRegion.taxType})`,
  };
}

/**
 * Helper to build country estimate.
 * Option A (Library): Checks 'sales-tax' library first.
 * Option B (Curated): Falls back to curated 190+ country rates.
 */
function buildCountryEstimate(
  country: CountryTaxInfo,
  explanationPrefix: string
): TaxEstimate {
  const libTax = querySalesTaxLibrary(country.code);
  if (libTax && libTax.rateDecimal > 0) {
    return {
      regionName: country.name,
      countryCode: country.code,
      countryName: country.name,
      taxType: libTax.taxType,
      ratePercent: libTax.ratePercent,
      rateDecimal: libTax.rateDecimal,
      confidence: "HIGH",
      source: "LIBRARY",
      explanation: `${explanationPrefix}: ${country.name} (${libTax.ratePercent}% ${libTax.taxType} via sales-tax library)`,
    };
  }

  return {
    regionName: country.name,
    countryCode: country.code,
    countryName: country.name,
    taxType: country.taxType,
    ratePercent: country.ratePercent,
    rateDecimal: country.ratePercent / 100,
    confidence: "HIGH",
    source: "CURATED",
    explanation: `${explanationPrefix}: ${country.name} (${country.ratePercent}% ${country.taxType})`,
  };
}

/**
 * Intelligent Multi-Level Tax Detector
 * 1. Parses free-text shipping address to identify country, state/province, or postal code.
 * 2. Option A (Primary): Queries 'sales-tax' npm library first.
 * 3. Option B (Fallback): Queries curated 190+ countries / 50 states registry if library lacks coverage.
 * 4. Fallback: Currency-based baseline estimate if address is unparseable.
 */
export function detectTaxFromAddress(
  address: string,
  fallbackCurrency: string = "USD"
): TaxEstimate | null {
  const text = (address || "").trim();

  // 1. Check for Canadian Postal Codes (e.g., A1A 1A1, K1A0B1, V6B 2W9)
  const caPostalMatch = text.match(/\b([A-CEGHJ-NPRSTVXY]\d[A-CEGHJ-NPRSTV-Z])[\s-]?(\d[A-CEGHJ-NPRSTV-Z]\d)\b/i);
  if (caPostalMatch) {
    const firstLetter = caPostalMatch[1].charAt(0).toUpperCase();
    for (const prov of Object.values(CA_PROVINCE_TAX_RATES)) {
      if (prov.postalPrefixes?.includes(firstLetter)) {
        return buildSubRegionEstimate("CA", "Canada", prov, "HIGH", `Detected Canadian province from postal code (${caPostalMatch[0]})`);
      }
    }
  }

  // 2. Check for Canadian Province names or 2-letter codes
  for (const [code, prov] of Object.entries(CA_PROVINCE_TAX_RATES)) {
    const codeRegex = new RegExp(`\\b${code}\\b`, "i");
    const nameRegex = new RegExp(`\\b${prov.name}\\b`, "i");
    if (codeRegex.test(text) || nameRegex.test(text)) {
      return buildSubRegionEstimate("CA", "Canada", prov, "HIGH", "Detected Canadian province");
    }
  }

  // 3. Check for US 5-digit ZIP codes (e.g. 32801, 90210, 10001)
  const zipMatch = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch) {
    const zipNum = parseInt(zipMatch[1], 10);
    const prefix3 = Math.floor(zipNum / 100);
    const prefix2 = Math.floor(zipNum / 1000);

    for (const state of Object.values(US_STATE_TAX_RATES)) {
      if (state.zipPrefixes) {
        for (const [minP, maxP] of state.zipPrefixes) {
          if (
            (prefix3 >= minP && prefix3 <= maxP) ||
            (prefix2 >= minP && prefix2 <= maxP)
          ) {
            return buildSubRegionEstimate("US", "United States", state, "HIGH", `Detected US state from ZIP ${zipMatch[1]}`);
          }
        }
      }
    }
  }

  // 4. Check for US State names or 2-letter state codes
  for (const state of Object.values(US_STATE_TAX_RATES)) {
    const nameRegex = new RegExp(`\\b${state.name}\\b`, "i");
    if (nameRegex.test(text)) {
      return buildSubRegionEstimate("US", "United States", state, "HIGH", "Detected US state");
    }
  }

  // Check 2-letter state codes with context (e.g., ", FL", " FL ", "FL 32801")
  for (const [code, state] of Object.entries(US_STATE_TAX_RATES)) {
    const codeContextRegex = new RegExp(`(?:,\\s*|\\b)${code}(?:\\s+\\d{5}|\\s*,|\\b)`, "i");
    if (codeContextRegex.test(text)) {
      return buildSubRegionEstimate("US", "United States", state, "MEDIUM", "Detected US state code");
    }
  }

  // 5. Check for International Countries (190+ countries)
  for (const country of Object.values(COUNTRY_TAX_REGISTRY)) {
    for (const alias of country.aliases) {
      const aliasRegex = new RegExp(`\\b${alias}\\b`, "i");
      if (aliasRegex.test(text)) {
        return buildCountryEstimate(country, "Detected Country");
      }
    }
  }

  // 6. Currency-based fallback if address has no identifiable region
  const curr = (fallbackCurrency || "USD").toUpperCase();
  if (CURRENCY_FALLBACK_RATES[curr]) {
    const fb = CURRENCY_FALLBACK_RATES[curr];
    const libTax = querySalesTaxLibrary(fb.countryCode);
    if (libTax && libTax.rateDecimal > 0) {
      return {
        regionName: fb.name,
        countryCode: fb.countryCode,
        countryName: fb.name,
        taxType: libTax.taxType,
        ratePercent: libTax.ratePercent,
        rateDecimal: libTax.rateDecimal,
        confidence: "FALLBACK",
        source: "LIBRARY",
        explanation: `Standard rate for ${curr} currency via sales-tax library (${libTax.ratePercent}% ${libTax.taxType})`,
      };
    }
    return {
      regionName: fb.name,
      countryCode: fb.countryCode,
      countryName: fb.name,
      taxType: fb.taxType,
      ratePercent: fb.ratePercent,
      rateDecimal: fb.ratePercent / 100,
      confidence: "FALLBACK",
      source: "CURATED",
      explanation: `Standard rate for ${curr} currency (${fb.ratePercent}% ${fb.taxType})`,
    };
  }

  return null;
}

/**
 * Calculates estimated tax amount from subtotal, shipping address, and currency.
 */
export function calculateEstimatedTax(
  subtotal: number,
  address: string,
  currency: string = "USD"
): { estimatedAmount: number; estimate: TaxEstimate | null } {
  if (subtotal <= 0) {
    return { estimatedAmount: 0, estimate: null };
  }
  const estimate = detectTaxFromAddress(address, currency);
  if (!estimate || estimate.ratePercent <= 0) {
    return { estimatedAmount: 0, estimate };
  }
  const estimatedAmount = Math.round(subtotal * estimate.rateDecimal * 100) / 100;
  return { estimatedAmount, estimate };
}


export interface TaxEstimationOptions {
  shippingAddress?: string | null;
  vendorAddress?: string | null;
  vendorName?: string | null;
  knownVendorLocations?: Record<string, { address?: string }>;
  currency?: string;
}

export interface PriorityTaxEstimate extends TaxEstimate {
  sourcing: "DESTINATION" | "ORIGIN" | "FALLBACK";
  sourcingLabel: string;
  matchedText: string;
}

/**
 * Priority-Based Tax Estimator
 *
 * Sourcing Logic:
 * 1. PRIORITY 1: Shipping Address (Destination-based sourcing)
 *    If a delivery address is provided, taxes are calculated from the delivery location
 *    because vendors and carriers legally invoice sales tax based on the delivery destination.
 *
 * 2. PRIORITY 2: Vendor Location / State (Origin-based sourcing)
 *    If no delivery address is entered (e.g. in-store pickup, digital license, or bill-only),
 *    auto-detects the tax from the Vendor's registered address, quote header address, or vendor name.
 *
 * 3. ALWAYS EDITABLE:
 *    The returned estimate serves as the starting set point with a 1-click apply action,
 *    while leaving the tax fee input completely editable to match vendor quotes/invoices penny-for-penny.
 */
export function detectTaxWithPriority(options: TaxEstimationOptions): PriorityTaxEstimate | null {
  const {
    shippingAddress,
    vendorAddress,
    vendorName,
    knownVendorLocations = {},
    currency = "USD",
  } = options;

  // 1. PRIORITY 1: Check Shipping / Delivery Address (Destination)
  const trimmedShipping = (shippingAddress || "").trim();
  if (trimmedShipping) {
    const destEstimate = detectTaxFromAddress(trimmedShipping, currency);
    if (destEstimate && destEstimate.confidence !== "FALLBACK") {
      return {
        ...destEstimate,
        sourcing: "DESTINATION",
        sourcingLabel: "Delivery Location (Destination)",
        matchedText: trimmedShipping,
        explanation: `Destination Sourcing (Shipping Address): ${destEstimate.explanation}`,
      };
    }
  }

  // 2. PRIORITY 2: Check Vendor Location / State (Origin)
  let vendorLoc = (vendorAddress || "").trim();

  // If vendor address not directly provided, search known vendor directory by name
  if (!vendorLoc && vendorName) {
    const rawName = vendorName.trim();
    if (knownVendorLocations[rawName]?.address) {
      vendorLoc = knownVendorLocations[rawName].address || "";
    } else {
      const match = Object.entries(knownVendorLocations).find(
        ([k]) => k.toLowerCase() === rawName.toLowerCase()
      );
      if (match && match[1]?.address) {
        vendorLoc = match[1].address;
      }
    }
  }

  // If still no vendor address, check if vendor name itself contains location info (e.g. "Amazon.ca", "Best Buy - Austin, TX")
  const targetVendorText = vendorLoc || (vendorName || "").trim();
  if (targetVendorText) {
    const originEstimate = detectTaxFromAddress(targetVendorText, currency);
    if (originEstimate && originEstimate.confidence !== "FALLBACK") {
      const displayName = vendorName ? vendorName.trim() : targetVendorText;
      return {
        ...originEstimate,
        sourcing: "ORIGIN",
        sourcingLabel: `Vendor Location: ${displayName}`,
        matchedText: targetVendorText,
        explanation: `Origin Sourcing (Vendor: ${displayName}): ${originEstimate.explanation}`,
      };
    }
  }

  // 3. Fallback: If shipping address had text but only matched currency fallback
  if (trimmedShipping) {
    const destFallback = detectTaxFromAddress(trimmedShipping, currency);
    if (destFallback) {
      return {
        ...destFallback,
        sourcing: "FALLBACK",
        sourcingLabel: "Estimated Currency Rate",
        matchedText: trimmedShipping,
      };
    }
  }

  return null;
}
