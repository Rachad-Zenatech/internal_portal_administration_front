/** Product details extracted from a vendor URL, and the AI chart-of-accounts suggestions saved on a request. */

export type ProductInfo = {
  name: string;
  price: string;
  category: string;
  brand: string;
  description: string;
  vendor: string;
  currency: string;
  original_price?: string | null;
  original_currency?: string | null;
};

/** One AI chart-of-accounts candidate for a request. */
export type GLSuggestion = {
  account_number: string;
  account_name: string;
  confidence: number;
  reason: string;
  source: string;
  is_best_match: boolean;
};

/** AI chart-of-accounts suggestions, worked out once on the server and saved on the request. */
export type GLSuggestions = {
  best_category: string;
  best_account_number: string;
  best_account_name: string;
  suggestions: GLSuggestion[];
  evidence_summary: string;
};
