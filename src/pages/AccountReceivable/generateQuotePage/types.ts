export interface QuoteLineItem {
  name: string;
  description: string;
  currency?: string;
  price: number | string;
  quantity: number | string;
  unit_discount: number | string;
  discount_type: "%" | "$";
  billing_frequency: string;
  term: number | string;
  billing_start_date?: string;
  tax_rate: number | string;
  subtotal: number;
  calculation?: string;
  is_renewal?: boolean;
  is_prorated?: boolean;
  badge?: string;
}
