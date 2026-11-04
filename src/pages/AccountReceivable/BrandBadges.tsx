// Distinct, readable colours (light + dark). Full class names so Tailwind can see them.
const BRAND_PALETTE = [
  "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900",
  "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-900",
  "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  "bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-950/50 dark:text-lime-300 dark:border-lime-900",
  "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900",
  "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900",
  "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
  "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900",
  "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-900",
  "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/50 dark:text-fuchsia-300 dark:border-fuchsia-900",
  "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-900",
];

/** Same brand name -> same colour, on every card and every reload. */
export function brandColorClass(brand: string): string {
  const key = brand.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return BRAND_PALETTE[hash % BRAND_PALETTE.length];
}

/** Brands arrive as one string joined with "," (or ";"); split them into clean names. */
export function splitBrands(brand?: string | null): string[] {
  return (brand || "")
    .split(/[;,]/)
    .map((b) => b.trim())
    .filter(Boolean);
}

export function BrandBadges({ brand, className = "" }: { brand?: string | null; className?: string }) {
  const brands = splitBrands(brand);
  if (brands.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {brands.map((b) => (
        <span
          key={b}
          title={`Brand: ${b}`}
          className={`inline-flex items-center rounded-full border px-2 py-0 h-[18px] text-[10px] font-semibold leading-none whitespace-nowrap ${brandColorClass(b)}`}
        >
          {b}
        </span>
      ))}
    </div>
  );
}
