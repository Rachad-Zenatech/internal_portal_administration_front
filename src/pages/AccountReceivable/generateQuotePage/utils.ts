import type { QuoteLineItem } from "./types";

export const createEmptyQuoteLineItem = (): QuoteLineItem => ({
  name: "",
  description: "",
  currency: "USD",
  price: "",
  quantity: 1,
  unit_discount: "",
  discount_type: "%",
  billing_frequency: "",
  term: 1,
  tax_rate: "",
  subtotal: 0,
  calculation: "",
});
